import React from 'react';
import { KEYPAD_VALUES, getRingColor } from '../constants';
import { ArrowShot } from '../types';

interface DialPadProps {
  onScore: (shot: ArrowShot) => void;
  className?: string;
}

const DialPad: React.FC<DialPadProps> = ({ onScore, className = "" }) => {
  
  const handlePress = (label: string) => {
    let value = 0;
    if (label === 'X') value = 10;
    else if (label === 'M') value = 0;
    else value = parseInt(label, 10);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(15);

    onScore({
      value,
      display: label,
      timestamp: Date.now()
    });
  };

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {KEYPAD_VALUES.map((row, rIndex) => (
        <React.Fragment key={rIndex}>
          {row.map((val) => {
             const numericVal = val === 'X' ? 10 : (val === 'M' ? 0 : parseInt(val));
             const colors = getRingColor(numericVal);
             
             return (
              <button
                key={val}
                onClick={() => handlePress(val)}
                className={`
                  relative overflow-hidden rounded-lg text-xl font-bold shadow-sm transition-all active:scale-95
                  flex items-center justify-center h-12
                  ${colors.bg} ${colors.text}
                  ${val === 'X' || val === '10' || val === '9' ? 'border border-yellow-600' : 'border border-zinc-700'}
                `}
              >
                {val}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default DialPad;