import "server-only";
import type { CameraStorageInput, StorageEstimateInput, StorageEstimateResult } from "./types";

/**
 * Production storage calculation engine.
 *
 * Implements the formula approved in Phase 2 Corrections §4 / Phase 4 §3.10 —
 * NOT the prototype's simplified "pick a retention tier" logic, which is
 * explicitly commented as non-production in securivon-prototype.jsx.
 *
 * Per-camera daily storage (GB) =
 *   (bitrate_kbps × 3600 × recording_hours_per_day) / (8 × 1024) / 1024
 *   — adjusted down for motion-detection mode, which records a fraction of
 *     continuous hours rather than the full 24.
 *
 * Total storage (GB) = Σ(per-camera daily storage) × retention_days × redundancy_margin
 *
 * Codec is accepted as an input (Phase 2 Corrections §4 explicitly lists it
 * as a required factor) but is not yet used to adjust the raw bitrate below —
 * see the MOTION_DETECTION_FRACTION note and the "codec efficiency" TODO.
 * Real Securivon product bitrate specs should already reflect each codec's
 * typical efficiency (H.265/H.265+ products are specced with a lower
 * bitrate than an equivalent H.264 product for the same visual quality), so
 * double-adjusting here would double-count that effect. If real-world
 * calibration later shows this assumption doesn't hold, add an explicit
 * codec multiplier here rather than silently changing the bitrate inputs.
 */

// Motion-detection recording is estimated at this fraction of a full day's
// continuous hours. This is a documented estimate, not a measured constant —
// recalibrate against real installations once Securivon has data.
const MOTION_DETECTION_FRACTION = 0.35;

function effectiveRecordingHours(camera: CameraStorageInput): number {
  switch (camera.recordingMode) {
    case "CONTINUOUS":
      return 24;
    case "MOTION_DETECTION":
      return 24 * MOTION_DETECTION_FRACTION;
    case "SCHEDULED":
      return camera.scheduledHoursPerDay ?? 24;
    default:
      return 24;
  }
}

function perCameraDailyGigabytes(camera: CameraStorageInput): number {
  const hours = effectiveRecordingHours(camera);
  const bitsPerDay = camera.bitrateKbps * 1000 * 3600 * hours;
  const bytesPerDay = bitsPerDay / 8;
  const gigabytesPerDay = bytesPerDay / 1024 / 1024 / 1024;
  return gigabytesPerDay;
}

export function calculateStorage(input: StorageEstimateInput): StorageEstimateResult {
  const perCameraGigabytesPerDay = input.cameras.map(perCameraDailyGigabytes);
  const dailyTotal = perCameraGigabytesPerDay.reduce((a, b) => a + b, 0);
  const totalGigabytes = dailyTotal * input.retentionDays * input.redundancyMargin;

  // Round up to the nearest common drive size for the customer-facing
  // recommendation — production drive-size options should come from the
  // Product catalogue (storage category), not this hardcoded list; this is
  // a reasonable display default until that lookup is wired in.
  const commonDriveSizesTb = [1, 2, 4, 6, 8, 10, 12];
  const totalTb = totalGigabytes / 1024;
  const recommendedDriveSizeTb =
    commonDriveSizesTb.find((size) => size >= totalTb) ??
    commonDriveSizesTb[commonDriveSizesTb.length - 1];

  const assumptions = [
    `${input.cameras.length} camera(s), ${input.retentionDays} day retention.`,
    `Redundancy margin: +${Math.round((input.redundancyMargin - 1) * 100)}% above theoretical minimum.`,
    input.cameras.some((c) => c.recordingMode === "MOTION_DETECTION")
      ? `Motion-detection cameras estimated at ~${Math.round(MOTION_DETECTION_FRACTION * 100)}% of a full recording day — actual usage varies with scene activity.`
      : "",
  ].filter(Boolean);

  return {
    totalGigabytes: Math.round(totalGigabytes * 10) / 10,
    recommendedDriveSizeTb,
    perCameraGigabytesPerDay: perCameraGigabytesPerDay.map((g) => Math.round(g * 100) / 100),
    assumptions,
  };
}
