import { Keypoint, BodyMeasurements } from '../types';

const dist = (a: Keypoint, b: Keypoint) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const mid = (a: Keypoint, b: Keypoint): Keypoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

// MoveNet keypoint indices
const KP = {
  NOSE: 0,
  LEFT_EYE: 1, RIGHT_EYE: 2,
  LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10,
  LEFT_HIP: 11, RIGHT_HIP: 12,
  LEFT_KNEE: 13, RIGHT_KNEE: 14,
  LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
};

export const calculateMeasurements = (
  keypoints: Keypoint[],
  userHeightCm: number
): BodyMeasurements | null => {
  const MIN_SCORE = 0.25;
  const kp = (idx: number) => keypoints[idx];
  const valid = (idx: number) => (kp(idx)?.score ?? 0) >= MIN_SCORE;

  if (!valid(KP.NOSE) || !valid(KP.LEFT_SHOULDER) || !valid(KP.RIGHT_SHOULDER) ||
      !valid(KP.LEFT_HIP) || !valid(KP.RIGHT_HIP)) {
    return null;
  }

  const nose = kp(KP.NOSE);
  const leftShoulder = kp(KP.LEFT_SHOULDER);
  const rightShoulder = kp(KP.RIGHT_SHOULDER);
  const leftHip = kp(KP.LEFT_HIP);
  const rightHip = kp(KP.RIGHT_HIP);

  const hasAnkles = valid(KP.LEFT_ANKLE) || valid(KP.RIGHT_ANKLE);
  const ankleY = hasAnkles
    ? (valid(KP.LEFT_ANKLE) && valid(KP.RIGHT_ANKLE)
        ? (kp(KP.LEFT_ANKLE).y + kp(KP.RIGHT_ANKLE).y) / 2
        : valid(KP.LEFT_ANKLE) ? kp(KP.LEFT_ANKLE).y : kp(KP.RIGHT_ANKLE).y)
    : leftHip.y + dist(leftShoulder, leftHip) * 1.3;

  // Estimate head top: ~8% above nose relative to total body span
  const bodySpan = ankleY - nose.y;
  const headTopY = nose.y - bodySpan * 0.08;
  const bodyHeightPx = ankleY - headTopY;

  if (bodyHeightPx <= 0) return null;

  const scale = userHeightCm / bodyHeightPx; // cm per pixel

  const shoulderWidthPx = dist(leftShoulder, rightShoulder);
  const hipWidthPx = dist(leftHip, rightHip);
  const shoulderMid = mid(leftShoulder, rightShoulder);
  const hipMid = mid(leftHip, rightHip);

  const shoulderWidth = shoulderWidthPx * scale;
  const hipWidth = hipWidthPx * scale;
  const torsoLength = dist(shoulderMid, hipMid) * scale;

  // Inseam: hip to ankle
  const inseamPx = hasAnkles
    ? (valid(KP.LEFT_ANKLE) && valid(KP.RIGHT_ANKLE)
        ? (dist(leftHip, kp(KP.LEFT_ANKLE)) + dist(rightHip, kp(KP.RIGHT_ANKLE))) / 2
        : valid(KP.LEFT_ANKLE) ? dist(leftHip, kp(KP.LEFT_ANKLE)) : dist(rightHip, kp(KP.RIGHT_ANKLE)))
    : hipWidthPx * 2.2;
  const inseam = inseamPx * scale;

  // Arm length: shoulder to wrist
  let armLength = shoulderWidth * 1.6; // fallback estimate
  if (valid(KP.LEFT_SHOULDER) && valid(KP.LEFT_ELBOW) && valid(KP.LEFT_WRIST)) {
    armLength = (dist(leftShoulder, kp(KP.LEFT_ELBOW)) + dist(kp(KP.LEFT_ELBOW), kp(KP.LEFT_WRIST))) * scale;
  } else if (valid(KP.RIGHT_SHOULDER) && valid(KP.RIGHT_ELBOW) && valid(KP.RIGHT_WRIST)) {
    armLength = (dist(rightShoulder, kp(KP.RIGHT_ELBOW)) + dist(kp(KP.RIGHT_ELBOW), kp(KP.RIGHT_WRIST))) * scale;
  }

  // Circumference estimates using anthropometric ratios
  // Chest: shoulder width (projection) ≈ 55% of actual chest circumference
  const chest = shoulderWidth / 0.55;
  // Waist: narrower than hips; hip-joint width ≈ 35% of waist circumference
  const waist = hipWidth / 0.35;
  // Hips: hip-joint width ≈ 37% of hip circumference
  const hips = hipWidth / 0.37;

  return {
    height: userHeightCm,
    shoulderWidth: Math.round(shoulderWidth),
    chest: Math.round(chest),
    waist: Math.round(waist),
    hips: Math.round(hips),
    inseam: Math.round(inseam),
    torsoLength: Math.round(torsoLength),
    armLength: Math.round(armLength),
  };
};
