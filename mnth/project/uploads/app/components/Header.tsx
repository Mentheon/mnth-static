// app/components/Header.tsx
'use client';

import React from 'react';
import Logo from './Logo';
import GridNav from './GridNav';

export default function Header() {
  return (
    <header
      style={{
        position: 'relative', // so the nav can be absolutely positioned inside
        width: '100%',
        height: '170px', // match the height for your logo + nav area
        backgroundColor: '#FFECE1', // or your preferred color
      }}
    >
      {/* Logo on the left, 518×170 area */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          left: 0,
          width: '518px',
          height: '170px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Logo />
      </div>

      {/* GridNav on the right, also 518×170 area */}
      {/* <div style={{marginTop: '16px'}}> */}
      <GridNav/>
      {/* </div> */}
    </header>
  );
}
