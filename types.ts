export enum TargetFaceType {
  WA_OUTDOOR = 'WA_OUTDOOR', // 10-1, X
  WA_INDOOR_SINGLE = 'WA_INDOOR_SINGLE', // 10-1
  WA_INDOOR_TRIPLE = 'WA_INDOOR_TRIPLE', // 10-6
}

export interface ArrowShot {
  value: number; // Numerical value for calculation (X = 10, M = 0)
  display: string; // 'X', '10', 'M', etc.
  x?: number; // Coordinate on target
  y?: number; // Coordinate on target
  timestamp: number;
}

export interface End {
  id: string;
  number: number;
  arrows: ArrowShot[];
}

export interface Session {
  id: string;
  date: string;
  name: string;
  targetType: TargetFaceType;
  totalEnds: number;
  arrowsPerEnd: number;
  distance: number; // meters
  ends: End[];
  isComplete: boolean;
  notes?: string;
}

export interface Stats {
  totalArrows: number;
  totalScore: number;
  averageArrow: number;
  xCount: number;
  tenCount: number;
  missCount: number;
}

// --- Profile & Equipment ---

export interface SightMark {
  distance: number;
  setting: string;
}

export interface ArrowSetup {
  id: string;
  name: string;
  spine: string;
  length: string;
  pointWeight: string;
  fletching: string;
}

export interface Equipment {
  bowName: string;
  riser: string;
  limbs: string;
  poundage: string;
  sightMarks: SightMark[];
  arrows: ArrowSetup[];
}

export interface UserProfile {
  name: string;
  equipment: Equipment;
}