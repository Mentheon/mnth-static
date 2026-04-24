'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './HeroIcons.module.css';
import IconCircle from './IconCircle';

// Define your nav items with an identifier.
const NAV_ITEMS = [
  { id: 'research', label: 'Research', href: '/research', emoji: '🔬' },
  { id: 'development', label: 'Development', href: '/development', emoji: '💻' },
  { id: 'consultancy', label: 'Consultancy', href: '/consultancy', emoji: '📋' },
];

export default function HeroIcons() {
  // Track which icon (by id) is hovered
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const defaultSize = 120;
  const expandedSize = 125; // Adjust as needed

  return (
    <div className={styles.container}>
      {NAV_ITEMS.map((item) => (
        <div key={item.id} className={styles.iconGroup}>
          <Link
            href={item.href}
            className={styles.iconLink}
            onMouseEnter={() => setHoveredIcon(item.id)}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            {/* Fixed container that prevents layout shifts */}
            <div className={styles.iconWrapper}>
              <IconCircle
                emoji={item.emoji}
                size={hoveredIcon === item.id ? expandedSize : defaultSize}
              />
            </div>
          </Link>
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
