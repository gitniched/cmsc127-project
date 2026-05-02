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
        backdropFilter: 'blur(1.5px)', 
        WebkitBackdropFilter: 'blur(1.5px)',
        zIndex: -1,
        pointerEvents: 'none',
      }} />
      <NavBar />
      <main className="flex-1 pt-[72px]">
        {children}
      </main>
    </div>
  );
}