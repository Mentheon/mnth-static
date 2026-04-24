'use client';
import React, { useState } from 'react';
import TypedContent from './TypedContent';
import styles from './ContentDisplay.module.css';

const contentData = {
  default: [
    "Welcome to our homepage!",
    "We deliver innovative digital health solutions.",
    "Explore our services below.",
  ],
  research: [
    "Our research is groundbreaking.",
    "We utilize state-of-the-art technology.",
    "Innovation and collaboration are our core.",
  ],
  development: [
    "Our development team builds robust solutions.",
    "Agile methodologies and cutting-edge tools are our focus.",
    "We create scalable, high-performance products.",
  ],
  consultancy: [
    "Our consultancy offers expert guidance.",
    "We help organizations transform digitally.",
    "Your success is our top priority.",
  ],
};

const menuItems: { key: 'default' | 'research' | 'development' | 'consultancy'; label: string }[] = [
  { key: 'default', label: 'Home' },
  { key: 'research', label: 'Research' },
  { key: 'development', label: 'Development' },
  { key: 'consultancy', label: 'Consultancy' },
];

export default function ContentDisplay() {
  const [selected, setSelected] = useState<'default' | 'research' | 'development' | 'consultancy'>('default');

  return (
    <div className={styles.container}>
      {/* Menu buttons */}
      <div className={styles.menu}>
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`${styles.menuButton} ${selected === item.key ? styles.active : ''}`}
            onClick={() => setSelected(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Typed content area */}
      <div className={styles.typedContent}>
        <TypedContent texts={contentData[selected]} />
      </div>

      {/* Bullet status indicators */}
      <div className={styles.statusIndicators}>
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`${styles.indicator} ${selected === item.key ? styles.activeIndicator : ''}`}
          ></div>
        ))}
      </div>
    </div>
  );
}
