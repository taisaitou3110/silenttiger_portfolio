// GeminiCLI/components/LoadingButton.tsx
import React from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  isLoading,
  loadingText = '処理中...',
  disabled,
  ...rest
}) => {
  return (
    <button
      {...rest}
      disabled={isLoading || disabled}
      className={`${rest.className || ''} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? loadingText : children}
    </button>
  );
};

export default LoadingButton;
