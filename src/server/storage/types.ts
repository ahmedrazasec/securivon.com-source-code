import "server-only";

export interface CameraStorageInput {
  /** Bits per second, e.g. 4096 kbps — must come from Product.specifications, never guessed. */
  bitrateKbps: number;
  codec: "H264" | "H265" | "H265_PLUS";
  fps: number;
  recordingMode: "CONTINUOUS" | "MOTION_DETECTION" | "SCHEDULED";
  /** Only meaningful for SCHEDULED mode; ignored otherwise. */
  scheduledHoursPerDay?: number;
}

export interface StorageEstimateInput {
  cameras: CameraStorageInput[];
  retentionDays: number;
  /** Real-world safety margin above the theoretical minimum, e.g. 1.15 for +15%. */
  redundancyMargin: number;
}

export interface StorageEstimateResult {
  totalGigabytes: number;
  recommendedDriveSizeTb: number;
  perCameraGigabytesPerDay: number[];
  assumptions: string[];
}
