import versionData from '@/app/version.json';
import React from 'react';

export default function DevlogLayout({ children }: { children: React.ReactNode }) {
  const devlogVersion = versionData.apps.devlog;
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { version: devlogVersion } as any);
        }
        return child;
      })}
    </>
  );
}
