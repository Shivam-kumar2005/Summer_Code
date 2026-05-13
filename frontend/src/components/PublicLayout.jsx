import React from 'react';
import TopNav from './TopNav';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      <TopNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
