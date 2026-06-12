export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface BodyMeasurements {
  height: number;
  shoulderWidth: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  torsoLength: number;
  armLength: number;
}

export interface SizeRecommendation {
  tops: { us: string; eu: string; uk: string; asia: string };
  bottoms: { us: string; eu: string; uk: string; waistSize: string };
  jeans: string;
}

export interface UserSetup {
  heightCm: number;
  gender: 'male' | 'female' | 'unisex';
  scanMode: 'static' | 'walkby';
}

export type AppScreen = 'welcome' | 'setup' | 'scan' | 'results';
