import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  );
}