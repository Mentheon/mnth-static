import './globals.css';
import { ReactNode } from 'react';
import Header from './components/Header';

export const metadata = {
  title: 'Mentheon',
  description: 'Digital Health Solutions - VR-RT and more',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
