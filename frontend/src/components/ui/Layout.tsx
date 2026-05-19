import type { ReactNode } from 'react';
import NavBar from './NavBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0, 79, 119, 0.25) 0%, rgba(6, 36, 66, 0.5) 100%)',
        backdropFilter: 'blur(1.5px)', 
        WebkitBackdropFilter: 'blur(1.5px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <NavBar />
      <main className="flex-1 pt-[72px]">
        {children}
      </main>
    </div>
  );
}