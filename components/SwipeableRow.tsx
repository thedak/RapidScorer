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
  const rowRef = useRef<HTMLDivElement>(null);
  
  const MAX_SWIPE = -80;

  const handleTouchStart = (e: React.TouchEvent) => {
    // If already open, maybe close it?
    if (offsetX < 0 && e.target instanceof Node && !rowRef.current?.contains(e.target)) {
       setOffsetX(0);
       return;
    }
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Only allow swiping left
    if (diff < 0 || offsetX < 0) {
       // Add resistance
       let newOffset = diff;
       if (offsetX < 0) newOffset += offsetX; // Adjust if starting from open state (not fully supported in this simple version)
       
       // Clamp
       const finalOffset = Math.min(0, Math.max(MAX_SWIPE * 1.5, newOffset));
       setOffsetX(finalOffset);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsSwiping(false);
    touchStartX.current = null;
    
    if (offsetX < MAX_SWIPE / 2) {
      setOffsetX(MAX_SWIPE);
    } else {
      setOffsetX(0);
    }
  };

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent ghost clicks
    onDelete();
    setOffsetX(0);
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Background (Delete Button) */}
      <div 
        className="absolute inset-y-0 right-0 bg-red-600 flex items-center justify-center z-0"
        style={{ width: Math.abs(MAX_SWIPE) + 20, paddingLeft: 20 }} 
        onClick={handleDelete}
        onTouchEnd={handleDelete}
      >
        <Trash2 size={20} className="text-white" />
      </div>

      {/* Foreground (Content) */}
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