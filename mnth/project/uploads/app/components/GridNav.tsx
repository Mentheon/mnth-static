'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lato } from 'next/font/google';
import styles from './GridNav.module.css';

const lato = Lato({ weight: '400', subsets: ['latin'] });

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'News', href: '/news' },
  { label: 'About', href: '/about' },
  { label: 'Who?', href: '/who' },
  { label: 'What?', href: '/what' },
  { label: 'Why?', href: '/why' },
];

export default function GridNav() {
  const pathname = usePathname();

  return (
    <div className={styles.gridContainer}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${lato.className} ${styles.navItem}`}
            style={{
              backgroundColor: isActive ? '#A30B37' : '#3F0247',
            }}
          >
            {item.label}
            {isActive && <div className={styles.cornerCrop} />}
          </Link>
        );
      })}
    </div>
  );
}
