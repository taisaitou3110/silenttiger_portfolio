import versionData from '@/app/version.json';
import React from 'react';

export default function PokerLayout({ children }: { children: React.ReactNode }) {
  const pokerVersion = versionData.apps.poker;
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { version: pokerVersion } as any);
        }
        return child;
      })}
    </>
  );
}
