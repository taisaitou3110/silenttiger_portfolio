import versionData from '@/app/version.json';
import React from 'react';

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  const quizVersion = versionData.apps.wordbook; // Use wordbook version for quiz
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { version: quizVersion } as any);
        }
        return child;
      })}
    </>
  );
}
