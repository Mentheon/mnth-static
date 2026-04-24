import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{ display: 'flex', gap: '16px' }}>
      <Link href="/">Home</Link>
      <Link href="/news">News</Link>
      <Link href="/about">About</Link>
      <Link href="/who">Who?</Link>
      <Link href="/what">What?</Link>
      <Link href="/why">Why?</Link>
    </nav>
  );
}
