import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface JoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onEnd: () => void;
  color?: string;
  label?: string;
  isAiming?: boolean;
}

/**
 * Twin-Stick Joystick Component
 * Dinamik (ekrana dokunulan yerde beliren) joystick sistemi.
 * Roblox'taki TouchControls'un daha gelişmiş ve "Juicy" versiyonu.
 */
export const Joystick: React.FC<JoystickProps> = ({ onMove, onEnd, color = "blue", label, isAiming }) => {
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const maxRadius = 60;
  const deadzone = 0.15;

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setTouchPos({ x: clientX, y: clientY });
    setKnobPos({ x: 0, y: 0 });
  };

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!touchPos) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - touchPos.x;
    const dy = clientY - touchPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize vector
    const angle = Math.atan2(dy, dx);
    const clampedDistance = Math.min(distance, maxRadius);
    
    const nx = Math.cos(angle) * clampedDistance;
    const ny = Math.sin(angle) * clampedDistance;

    setKnobPos({ x: nx, y: ny });

    // Send normalized vector to parent (-1 to 1)
    const normalizedX = nx / maxRadius;
    const normalizedY = ny / maxRadius;

    // Apply Deadzone
    if (Math.abs(normalizedX) < deadzone && Math.abs(normalizedY) < deadzone) {
      onMove({ x: 0, y: 0 });
    } else {
      onMove({ x: normalizedX, y: normalizedY });
    }
  }, [touchPos, onMove]);

  const handleEnd = useCallback(() => {
    setTouchPos(null);
    setKnobPos({ x: 0, y: 0 });
    onEnd();
  }, [onEnd]);

  useEffect(() => {
    if (touchPos) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [touchPos, handleMove, handleEnd]);

  return (
    <div 
      className="absolute inset-0 z-10 select-none touch-none"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <AnimatePresence>
        {touchPos && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute pointer-events-none"
            style={{ left: touchPos.x - 75, top: touchPos.y - 75 }}
          >
            {/* Outer Ring */}
            <div className={cn(
              "w-[150px] h-[150px] rounded-full border-4 flex items-center justify-center bg-black/20 backdrop-blur-sm",
              color === "blue" ? "border-blue-400/50" : "border-red-400/50"
            )}>
              {/* Inner Knob */}
              <motion.div
                className={cn(
                  "w-16 h-16 rounded-full shadow-lg",
                  color === "blue" ? "bg-blue-500" : "bg-red-500"
                )}
                style={{ x: knobPos.x, y: knobPos.y }}
              />
            </div>
            {label && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white font-bold text-sm uppercase tracking-widest drop-shadow-md">
                {label}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
