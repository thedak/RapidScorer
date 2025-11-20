import React, { useRef, useState, useEffect } from 'react';
import { TargetFaceType, ArrowShot } from '../types';
import { TARGET_COLORS } from '../constants';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TargetVisualProps {
  type: TargetFaceType;
  onScore: (shot: ArrowShot) => void;
  lastShot?: ArrowShot;
  existingShots?: ArrowShot[];
}

const TargetVisual: React.FC<TargetVisualProps> = ({ type, onScore, lastShot, existingShots = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Viewbox config
  const viewBoxSize = 1000;
  const center = viewBoxSize / 2;
  const maxRadius = 500;
  
  // Rings definition (radius for WA Target)
  const rings = [
    { val: 1, r: maxRadius },
    { val: 2, r: maxRadius * 0.9 },
    { val: 3, r: maxRadius * 0.8 },
    { val: 4, r: maxRadius * 0.7 },
    { val: 5, r: maxRadius * 0.6 },
    { val: 6, r: maxRadius * 0.5 },
    { val: 7, r: maxRadius * 0.4 },
    { val: 8, r: maxRadius * 0.3 },
    { val: 9, r: maxRadius * 0.2 },
    { val: 10, r: maxRadius * 0.1 },
    { val: 11, r: maxRadius * 0.05 }, // X-ring
  ];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging && (Math.abs(e.clientX - startPan.x - pan.x) > 5 || Math.abs(e.clientY - startPan.y - pan.y) > 5)) {
      // If moved significantly, treat as drag, not click
      return;
    }

    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBoxSize / rect.width;
    const scaleY = viewBoxSize / rect.height;

    // Calculate click position relative to SVG center, accounting for current zoom/pan not needed if we use exact SVG coords mapping
    // However, since we are transforming the GROUP inside, we need to reverse transform.
    
    // Pure SVG coordinate calculation without zoom influence first
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Adjust for Zoom/Pan transform
    // The group transform is: translate(pan.x, pan.y) scale(zoom) from center? 
    // Actually easier to just map touch to SVG coordinate space directly if we render visual feedback only. 
    
    // Let's simplify: The click needs to be calculated based on the visual target, whatever its size.
    // We need the click relative to the center of the target rings.
    
    // Re-calculating:
    // The target is drawn centered at (500, 500).
    // We need to find where the user clicked relative to that 500,500 point.
    // We need to factor in the CSS transform that is applied to the container or group.
    
    // Let's try a simpler approach for scoring: Use standard vector math from the visual center.
    // But to support zoom, we need the transformed coordinates.
    
    // Helper: get point in SVG space
    const point = svgRef.current.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    // Get the matrix of the <g> element containing rings
    const targetGroup = svgRef.current.getElementById('target-rings');
    if (!targetGroup) return;
    
    const ctm = (targetGroup as SVGGraphicsElement).getScreenCTM();
    if (!ctm) return;
    
    const svgPoint = point.matrixTransform(ctm.inverse());
    
    // Distance from center (500, 500)
    const dx = svgPoint.x - center;
    const dy = svgPoint.y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let score = 0;
    let display = 'M';

    // Determine score
    if (dist > maxRadius) {
      score = 0;
      display = 'M';
    } else {
      // Find the smallest ring that contains the distance
      for (let i = rings.length - 1; i >= 0; i--) {
        if (dist <= rings[i].r) {
          if (rings[i].val === 11) {
            score = 10;
            display = 'X';
          } else {
            score = rings[i].val;
            display = score.toString();
          }
          break;
        }
      }
    }

    onScore({
      value: score,
      display,
      x: svgPoint.x,
      y: svgPoint.y,
      timestamp: Date.now()
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900 touch-none rounded-xl border border-zinc-800 shadow-inner">
      
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button onClick={() => setZoom(z => Math.min(z * 1.2, 5))} className="p-2 bg-zinc-800 text-white rounded-full shadow hover:bg-zinc-700"><ZoomIn size={20}/></button>
        <button onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))} className="p-2 bg-zinc-800 text-white rounded-full shadow hover:bg-zinc-700"><ZoomOut size={20}/></button>
        <button onClick={resetView} className="p-2 bg-zinc-800 text-white rounded-full shadow hover:bg-zinc-700"><RotateCcw size={20}/></button>
      </div>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} 
        className="w-full h-full cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      >
        <g 
          id="target-rings"
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} 
          style={{ transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}
        >
            {/* Background for M */}
            <rect x={0} y={0} width={viewBoxSize} height={viewBoxSize} fill="#09090b" opacity={0} />

            {/* Rings (Outer to Inner) */}
            {rings.map((ring) => {
              const isX = ring.val === 11;
              const colorKey = isX ? 10 : ring.val;
              const colorData = TARGET_COLORS[colorKey as keyof typeof TARGET_COLORS];
              
              return (
                <circle
                  key={ring.val}
                  cx={center}
                  cy={center}
                  r={ring.r}
                  fill={colorData.ring}
                  stroke={ring.val <= 2 ? '#e4e4e7' : '#18181b'} // Light border for black/white rings
                  strokeWidth="1"
                />
              );
            })}
            
            {/* X ring center crosshair optional */}
            <line x1={center-5} y1={center} x2={center+5} y2={center} stroke="#000" strokeWidth="0.5" />
            <line x1={center} y1={center-5} x2={center} y2={center+5} stroke="#000" strokeWidth="0.5" />

            {/* Past Shots */}
            {existingShots.map((s, i) => (
              s.x !== undefined && (
                <g key={i}>
                  <circle cx={s.x} cy={s.y} r={5 / zoom} fill="#3b82f6" stroke="white" strokeWidth={1 / zoom} opacity={0.6} />
                  <text x={s.x} y={s.y} dy={15/zoom} textAnchor="middle" fontSize={12/zoom} fill="white" className="pointer-events-none font-bold drop-shadow-md">{i + 1}</text>
                </g>
              )
            ))}

             {/* Last Shot Highlight */}
             {lastShot && lastShot.x !== undefined && (
               <g>
                 <circle cx={lastShot.x} cy={lastShot.y} r={6 / zoom} fill="#ef4444" stroke="white" strokeWidth={2 / zoom} className="animate-pulse" />
                 <text x={lastShot.x} y={lastShot.y} dy={-10/zoom} textAnchor="middle" fontSize={14/zoom} fill="white" className="pointer-events-none font-bold drop-shadow-md shadow-black">{lastShot.display}</text>
               </g>
            )}
        </g>
      </svg>
    </div>
  );
};

export default TargetVisual;