import Image from 'next/image';

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Image 
        src="/web-svg.svg" 
        alt="Mentheon Logo" 
        width={518} 
        height={170} 
      />
      {/* <span style={{ marginLeft: '8px', fontWeight: 'bold', fontSize: '1.2rem' }}>
        Mentheon
      </span> */}
    </div>
  );
}
