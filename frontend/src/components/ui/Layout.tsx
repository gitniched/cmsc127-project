import type { ReactNode } from 'react';
import NavBar from './NavBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-raised">
      <NavBar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}