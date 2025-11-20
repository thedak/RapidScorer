import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onDelete, className = '' }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  
  const MAX_SWIPE = -80;

  const handleTouchStart = (e: React.TouchEvent) => {
    // If already open, touching the content row should probably close it or start new swipe
    if (offsetX < 0) {
       // Optional: Close on touch if tapping content? 
       // For now, let's allow swiping back or just resetting if they swipe right
    }
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Only logic for left swipe or correcting back
    if (diff < 0 || offsetX < 0) {
       let newOffset = diff;
       if (offsetX < 0) newOffset += offsetX; // Continue from open state
       
       // Clamp
       // Min: MAX_SWIPE (fully open), Max: 0 (closed)
       // Allow some overdrag
       const finalOffset = Math.min(0, Math.max(MAX_SWIPE * 1.5, newOffset));
       setOffsetX(finalOffset);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsSwiping(false);
    touchStartX.current = null;
    
    // Threshold to snap open
    if (offsetX < MAX_SWIPE / 2) {
      setOffsetX(MAX_SWIPE);
    } else {
      setOffsetX(0);
    }
  };

  const handleClickDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setOffsetX(0);
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Delete Button (Absolute Background) */}
      <button
        className="absolute inset-y-0 right-0 bg-red-600 flex items-center justify-center z-0 cursor-pointer transition-opacity active:bg-red-700"
        style={{ width: Math.abs(MAX_SWIPE) + 20, paddingLeft: 20 }}
        onClick={handleClickDelete}
        tabIndex={offsetX < 0 ? 0 : -1}
      >
        <Trash2 size={20} className="text-white" />
      </button>

      {/* Content (Relative Foreground) */}
      <div 
        className="relative bg-zinc-900 z-10 transition-transform ease-out touch-pan-y"
        style={{ 
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableRow;