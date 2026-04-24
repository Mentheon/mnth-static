import Link from 'next/link';
import { Lato } from 'next/font/google';
import HeroIcons from './HeroIcons';
import HeroIconsWithContent from './HeroIconsWithContent';


const lato = Lato({
    subsets: ['latin'],  // Ensures proper character rendering
    weight: ['400', '700'],  // Load specific font weights
    variable: '--font-lato',  // Allows CSS variable usage
  });

export default function HeroSection() {
  return (
    <>
    <section style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <p style={{ fontSize: '2.5rem', marginBottom: '0rem', fontFamily: 'Lato', color:'#2F0147', fontWeight: 'normal', padding: 'none', marginTop: 'none' }}>
        We are innovators of cutting edge 
      </p>
        <p style={{ fontSize: '2.5rem', marginTop: '1rem', fontFamily: 'Lato', color:'#2F0147', fontWeight: 'bold'  }}>
        Software as a Medical Device (SaMD)
        </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
        
      <HeroIconsWithContent />
      </div>
    </section>
    </>
  );
}
