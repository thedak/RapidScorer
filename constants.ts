import { TargetFaceType } from './types';

export const DEFAULT_ARROWS_PER_END = 3;
export const DEFAULT_ENDS = 10;

export const TARGET_COLORS = {
  10: { bg: 'bg-yellow-400', text: 'text-black', ring: '#FCD34D' },
  9: { bg: 'bg-yellow-400', text: 'text-black', ring: '#FCD34D' },
  8: { bg: 'bg-red-500', text: 'text-white', ring: '#EF4444' },
  7: { bg: 'bg-red-500', text: 'text-white', ring: '#EF4444' },
  6: { bg: 'bg-blue-500', text: 'text-white', ring: '#3B82F6' },
  5: { bg: 'bg-blue-500', text: 'text-white', ring: '#3B82F6' },
  4: { bg: 'bg-black', text: 'text-white', ring: '#18181B' },
  3: { bg: 'bg-black', text: 'text-white', ring: '#18181B' },
  2: { bg: 'bg-white', text: 'text-black', ring: '#F9FAFB' },
  1: { bg: 'bg-white', text: 'text-black', ring: '#F9FAFB' },
  0: { bg: 'bg-green-800', text: 'text-white', ring: 'transparent' }, // Miss
};

export const getRingColor = (value: number) => {
  if (value >= 9) return TARGET_COLORS[10];
  if (value >= 7) return TARGET_COLORS[8];
  if (value >= 5) return TARGET_COLORS[6];
  if (value >= 3) return TARGET_COLORS[4];
  if (value >= 1) return TARGET_COLORS[2];
  return TARGET_COLORS[0];
};

// Keypad values
export const KEYPAD_VALUES = [
  ['X', '10', '9'],
  ['8', '7', '6'],
  ['5', '4', '3'],
  ['2', '1', 'M'],
];