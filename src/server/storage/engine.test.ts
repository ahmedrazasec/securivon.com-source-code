import { describe, it, expect } from "vitest";
import { calculateStorage } from "@/server/storage/engine";
import type { CameraStorageInput } from "@/server/storage/types";

const continuousCamera: CameraStorageInput = {
  bitrateKbps: 4096,
  codec: "H265",
  fps: 25,
  recordingMode: "CONTINUOUS",
};

describe("calculateStorage", () => {
  it("scales total storage with camera count", () => {
    const oneCamera = calculateStorage({ cameras: [continuousCamera], retentionDays: 14, redundancyMargin: 1.15 });
    const fourCameras = calculateStorage({
      cameras: [continuousCamera, continuousCamera, continuousCamera, continuousCamera],
      retentionDays: 14,
      redundancyMargin: 1.15,
    });
    expect(fourCameras.totalGigabytes).toBeCloseTo(oneCamera.totalGigabytes * 4, 0);
  });

  it("scales total storage with retention days", () => {
    const twoWeeks = calculateStorage({ cameras: [continuousCamera], retentionDays: 14, redundancyMargin: 1.0 });
    const fourWeeks = calculateStorage({ cameras: [continuousCamera], retentionDays: 28, redundancyMargin: 1.0 });
    expect(fourWeeks.totalGigabytes).toBeCloseTo(twoWeeks.totalGigabytes * 2, 0);
  });

  it("estimates motion-detection mode as using less storage than continuous", () => {
    const continuous = calculateStorage({ cameras: [continuousCamera], retentionDays: 14, redundancyMargin: 1.0 });
    const motion = calculateStorage({
      cameras: [{ ...continuousCamera, recordingMode: "MOTION_DETECTION" }],
      retentionDays: 14,
      redundancyMargin: 1.0,
    });
    expect(motion.totalGigabytes).toBeLessThan(continuous.totalGigabytes);
  });

  it("applies the redundancy margin as a genuine multiplier above the theoretical minimum", () => {
    const noMargin = calculateStorage({ cameras: [continuousCamera], retentionDays: 14, redundancyMargin: 1.0 });
    const withMargin = calculateStorage({ cameras: [continuousCamera], retentionDays: 14, redundancyMargin: 1.2 });
    expect(withMargin.totalGigabytes).toBeCloseTo(noMargin.totalGigabytes * 1.2, 0);
  });

  it("recommends a drive size at or above the computed total", () => {
    const result = calculateStorage({ cameras: [continuousCamera], retentionDays: 14, redundancyMargin: 1.15 });
    expect(result.recommendedDriveSizeTb * 1024).toBeGreaterThanOrEqual(result.totalGigabytes);
  });

  it("respects a scheduled recording window shorter than 24 hours", () => {
    const fullDay = calculateStorage({
      cameras: [{ ...continuousCamera, recordingMode: "SCHEDULED", scheduledHoursPerDay: 24 }],
      retentionDays: 7,
      redundancyMargin: 1.0,
    });
    const halfDay = calculateStorage({
      cameras: [{ ...continuousCamera, recordingMode: "SCHEDULED", scheduledHoursPerDay: 12 }],
      retentionDays: 7,
      redundancyMargin: 1.0,
    });
    expect(halfDay.totalGigabytes).toBeCloseTo(fullDay.totalGigabytes / 2, 0);
  });

  it("returns a per-camera breakdown matching the number of input cameras", () => {
    const result = calculateStorage({
      cameras: [continuousCamera, { ...continuousCamera, bitrateKbps: 2048 }],
      retentionDays: 7,
      redundancyMargin: 1.0,
    });
    expect(result.perCameraGigabytesPerDay).toHaveLength(2);
    expect(result.perCameraGigabytesPerDay[0]).toBeGreaterThan(result.perCameraGigabytesPerDay[1]);
  });
});
