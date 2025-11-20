import React, { useRef, useState, useEffect, useMemo } from 'react';
import { TargetFaceType, ArrowShot } from '../types';
import { TARGET_COLORS } from '../constants';

interface TargetVisualProps {
  type: TargetFaceType;
  onScore?: (shot: ArrowShot) => void;
  lastShot?: ArrowShot;
  existingShots?: ArrowShot[];
  readOnly?: boolean;
}

const TargetVisual: React.FC<TargetVisualProps> = ({ 
  type, 
  onScore, 
  lastShot, 
  existingShots = [],
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // -- State --
  const [isTouching, setIsTouching] = useState(false);
  
  // Aiming State (SVG Coordinates 0-1000)
  const [aimCoords, setAimCoords] = useState({ x: 500, y: 500 });
  
  // Screen Position of the touch (for Scope positioning)
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 }); 

  // View State for ReadOnly (Pan/Zoom)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1000, h: 1000 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Constants
  const FULL_SIZE = 1000;
  const CENTER = FULL_SIZE / 2;
  const SCOPE_SIZE = 180; // px
  const SCOPE_ZOOM = 3.5; 

  // -- Rings Definition --
  const rings = useMemo(() => [
    { val: 1, r: 500 },
    { val: 2, r: 450 },
    { val: 3, r: 400 },
    { val: 4, r: 350 },
    { val: 5, r: 300 },
    { val: 6, r: 250 },
    { val: 7, r: 200 },
    { val: 8, r: 150 },
    { val: 9, r: 100 },
    { val: 10, r: 50 },
    { val: 11, r: 25 }, // X
  ], []);

  // -- Helpers --

  const getSVGPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 500, y: 500 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    // Transform screen pixel to SVG coordinate
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  };

  const calculateScore = (x: number, y: number) => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 500) return { value: 0, display: 'M' };

    for (let i = rings.length - 1; i >= 0; i--) {
      if (dist <= rings[i].r) {
        if (rings[i].val === 11) return { value: 10, display: 'X' };
        return { value: rings[i].val, display: rings[i].val.toString() };
      }
    }
    return { value: 0, display: 'M' };
  };

  // -- Handlers: Aiming (Write Mode) --

  const handleAimStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (readOnly) {
      handlePanStart(e);
      return;
    }
    
    e.preventDefault(); // Prevent scrolling
    setIsTouching(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Update touch pos for scope UI location
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTouchPos({ x: clientX - rect.left, y: clientY - rect.top });
    }

    const p = getSVGPoint(clientX, clientY);
    setAimCoords(p);
  };

  const handleAimMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (readOnly) {
      handlePanMove(e);
      return;
    }
    if (!isTouching) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTouchPos({ x: clientX - rect.left, y: clientY - rect.top });
    }

    const p = getSVGPoint(clientX, clientY);
    setAimCoords(p);
  };

  const handleAimEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (readOnly) {
      handlePanEnd();
      return;
    }
    if (!isTouching) return;
    setIsTouching(false);

    if (onScore) {
      const score = calculateScore(aimCoords.x, aimCoords.y);
      onScore({
        ...score,
        x: aimCoords.x,
        y: aimCoords.y,
        timestamp: Date.now()
      });
    }
  };

  // -- Handlers: Pan/Zoom (Read Mode) --

  const handlePanStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDraggingMap(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePanMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingMap) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dxPx = clientX - dragStart.x;
    const dyPx = clientY - dragStart.y;

    // Convert pixel delta to SVG delta
    // SVG width / Client Width gives ratio
    if (containerRef.current) {
      const ratio = viewBox.w / containerRef.current.clientWidth;
      const dxSvg = dxPx * ratio;
      const dySvg = dyPx * ratio;

      setViewBox(prev => ({
        ...prev,
        x: prev.x - dxSvg,
        y: prev.y - dySvg
      }));
    }

    setDragStart({ x: clientX, y: clientY });
  };

  const handlePanEnd = () => {
    setIsDraggingMap(false);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setViewBox(prev => {
      const factor = direction === 'in' ? 0.8 : 1.25;
      const newW = Math.min(FULL_SIZE, prev.w * factor);
      const newH = Math.min(FULL_SIZE, prev.h * factor);
      
      // Zoom towards center of current view
      const centerX = prev.x + prev.w / 2;
      const centerY = prev.y + prev.h / 2;

      return {
        x: centerX - newW / 2,
        y: centerY - newH / 2,
        w: newW,
        h: newH
      };
    });
  };

  const handleDoubleTap = () => {
    if (!readOnly) return;
    // Reset view
    setViewBox({ x: 0, y: 0, w: FULL_SIZE, h: FULL_SIZE });
  };

  // -- Render Components --

  const TargetFaceContent = () => (
    <>
      <rect x={-500} y={-500} width={2000} height={2000} fill="#09090b" />
      {rings.map((ring) => {
        const isX = ring.val === 11;
        const colorKey = isX ? 10 : ring.val;
        const colorData = TARGET_COLORS[colorKey as keyof typeof TARGET_COLORS];
        return (
          <circle
            key={ring.val}
            cx={CENTER}
            cy={CENTER}
            r={ring.r}
            fill={colorData.ring}
            stroke={ring.val <= 2 ? '#e4e4e7' : '#18181b'}
            strokeWidth="1"
          />
        );
      })}
      <line x1={CENTER-5} y1={CENTER} x2={CENTER+5} y2={CENTER} stroke="#000" strokeWidth="0.5" />
      <line x1={CENTER} y1={CENTER-5} x2={CENTER} y2={CENTER+5} stroke="#000" strokeWidth="0.5" />
    </>
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-zinc-900 touch-none select-none rounded-xl"
      onTouchStart={handleAimStart}
      onTouchMove={handleAimMove}
      onTouchEnd={handleAimEnd}
      onMouseDown={handleAimStart}
      onMouseMove={handleAimMove}
      onMouseUp={handleAimEnd}
      onMouseLeave={handleAimEnd}
      onDoubleClick={handleDoubleTap}
    >
      <svg 
        ref={svgRef}
        viewBox={readOnly ? `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}` : `0 0 ${FULL_SIZE} ${FULL_SIZE}`} 
        className="w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <TargetFaceContent />
        
        {/* Shots */}
        {existingShots.map((s, i) => (
          s.x !== undefined && (
            <g key={i}>
              <circle 
                cx={s.x} cy={s.y} 
                r={readOnly ? 4 * (viewBox.w / FULL_SIZE) * 3 : 5} 
                fill="#3b82f6" stroke="white" strokeWidth={1} opacity={0.8} 
              />
              {readOnly && (
                 <text 
                   x={s.x} y={s.y} dy={-8 * (viewBox.w / FULL_SIZE) * 2} 
                   textAnchor="middle" 
                   fontSize={14 * (viewBox.w / FULL_SIZE) * 2} 
                   fill="white" fontWeight="bold" className="font-mono drop-shadow-md"
                  >
                   {i + 1}
                 </text>
              )}
            </g>
          )
        ))}

        {/* Last Shot Highlight (Only in write mode) */}
        {!readOnly && lastShot && lastShot.x !== undefined && !isTouching && (
           <g>
             <circle cx={lastShot.x} cy={lastShot.y} r={6} fill="#ef4444" stroke="white" strokeWidth={2} className="animate-pulse" />
           </g>
        )}
      </svg>

      {/* Read Only Controls */}
      {readOnly && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
           <button onClick={() => handleZoom('in')} className="w-10 h-10 bg-black/60 backdrop-blur text-white rounded-full flex items-center justify-center font-bold border border-white/10 active:scale-90 transition-transform">+</button>
           <button onClick={() => handleZoom('out')} className="w-10 h-10 bg-black/60 backdrop-blur text-white rounded-full flex items-center justify-center font-bold border border-white/10 active:scale-90 transition-transform">-</button>
        </div>
      )}

      {/* SCOPE (Magnifier) for Aiming */}
      {isTouching && !readOnly && (
        <div 
          className="absolute rounded-full border-4 border-white shadow-2xl overflow-hidden z-50 pointer-events-none bg-zinc-900"
          style={{
            width: SCOPE_SIZE,
            height: SCOPE_SIZE,
            left: touchPos.x - (SCOPE_SIZE / 2),
            top: touchPos.y - SCOPE_SIZE * 1.2, // Offset upwards so finger doesn't block it
          }}
        >
          <svg
             viewBox={`${aimCoords.x - (FULL_SIZE / SCOPE_ZOOM / 2)} ${aimCoords.y - (FULL_SIZE / SCOPE_ZOOM / 2)} ${FULL_SIZE / SCOPE_ZOOM} ${FULL_SIZE / SCOPE_ZOOM}`}
             className="w-full h-full"
             preserveAspectRatio="xMidYMid slice"
          >
            <TargetFaceContent />
            {/* Render existing shots in scope too for reference? Optional. Let's skip to keep view clean for aiming. */}
          </svg>
          
          {/* Reticle */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-red-500 rounded-full shadow-sm"></div>
             <div className="absolute w-full h-[1px] bg-red-500/50"></div>
             <div className="absolute h-full w-[1px] bg-red-500/50"></div>
          </div>
        </div>
      )}

      {!readOnly && !isTouching && existingShots.length === 0 && !lastShot && (
        <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
           <span className="px-3 py-1 bg-black/40 backdrop-blur rounded-full text-xs font-bold text-white/70 uppercase tracking-wider">
             Touch & Drag to Aim
           </span>
        </div>
      )}
    </div>
  );
};

export default TargetVisual;