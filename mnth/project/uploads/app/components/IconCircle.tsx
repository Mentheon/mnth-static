'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './IconCircle.module.css';

export interface IconCircleProps {
  /** Unicode emoji to display, e.g. "🔬" */
  emoji?: string;
  /** Optional source URL for an image-based icon */
  src?: string;
  /** Alternative text (if using src) */
  alt?: string;
  /** Diameter of the circle (default: 120) */
  size?: number;

  colour?: string;

  selectedColour?: string;

  isSelected?: boolean;
}

export default function IconCircle({
  emoji,
  src,
  alt = 'icon',
  size = 120,
  colour = '#A30B37',
  selectedColour = '#9C528B',
  isSelected = false

}: IconCircleProps) {
  const iconSize = size * 0.6;
  const [scale, setScale] = useState(1);
  const circleRef = useRef<HTMLDivElement>(null);
  
  // Track if the mouse is directly over the circle.
  const [isHovered, setIsHovered] = useState(false);
  
  // Global mouse position state.
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!circleRef.current) return;
  
    // Get the circle's bounding rectangle and compute its center.
    const rect = circleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    // Settings for scaling.
    const threshold = 210; // Scaling effect occurs for distances less than this.
    const maxScale = 1.15;  // Maximum scale when the cursor is very close.
    
    // If the cursor is extremely close (say, within 10 pixels), treat distance as 0.
    const effectiveDistance = distance < 70 ? 0 : distance;
    
    // Compute new scale smoothly.
    let newScale = 1;
    if (effectiveDistance < threshold) {
      newScale = 1 + (maxScale - 1) * (1 - effectiveDistance / threshold);
    }
    setScale(newScale);
  }, [mousePos]);

  return (
    <div
      ref={circleRef}
      className={styles.circle}
      style={{
        backgroundColor: isSelected ? `${colour}` : `${selectedColour}`,
        width: size,
        height: size,
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        transition: 'transform 0.1s ease-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {emoji ? (
        <div style={{ fontSize: iconSize, lineHeight: 1 }}>{emoji}</div>
      ) : src ? (
        <Image src={src} alt={alt} width={iconSize} height={iconSize} />
      ) : null}
    </div>
  );
}
