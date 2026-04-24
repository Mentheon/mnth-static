'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import TypeIt from 'typeit-react';
import styles from './HeroIcons.module.css';
import IconCircle from './IconCircle';

// Define your nav items with an identifier.
const NAV_ITEMS = [
  { id: 'default', label: 'Home', href: '/', emoji: '🏠' },
  { id: 'research', label: 'Research', href: '/research', emoji: '🔬' },
  { id: 'development', label: 'Development', href: '/development', emoji: '💻' },
  { id: 'consultancy', label: 'Consultancy', href: '/consultancy', emoji: '📋' },
];

// Define the typed content for each menu item.
const typedContentData: Record<string, string[]> = {
  default: [
    "Welcome to our homepage!",
    "Discover our innovative digital health solutions."
  ],
  research: [
    "Our research pushes the boundaries of digital health.",
    "Cutting-edge methods and pioneering discoveries."
  ],
  development: [
    "Our development team builds robust, scalable solutions.",
    "Innovation in software for healthcare."
  ],
  consultancy: [
    "Expert consultancy to guide your digital transformation.",
    "We bring expertise and strategy to your projects."
  ],
};

export default function HeroIconsWithContent() {
  // State for which menu item is selected.
  const [selected, setSelected] = useState('default');
  const defaultSize = 120;
  const expandedSize = 125;

  return (
    <div>
      {/* Menu Section */}
      <div className={styles.container}>
        {NAV_ITEMS.map((item) => (
          <div key={item.id} className={styles.iconGroup}>
            {/* Using Link but preventing navigation */}
            <Link
              href={item.href}
              className={`${styles.iconLink} ${
                selected === item.id ? styles.active : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                console.log("Clicked:", item.id);
                setSelected(item.id);
              }}
            >
              <div className={styles.iconWrapper}>
                <IconCircle
                  emoji={item.emoji}
                  size={selected === item.id ? expandedSize : defaultSize}
                  isSelected={selected === item.id}
                />
              </div>
            </Link>
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Typed Content Section using typeit-react with a key to reinitialize on change */}
      <div className={styles.typedContent}>
        <TypeIt
          key={selected}
          options={{
            strings: typedContentData[selected],
            speed: 25,
            waitUntilVisible: true,
          }}
        />
      </div>

      {/* Status Indicators */}
      <div className={styles.statusIndicators}>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`${styles.indicator} ${
              selected === item.id ? styles.activeIndicator : ''
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}
