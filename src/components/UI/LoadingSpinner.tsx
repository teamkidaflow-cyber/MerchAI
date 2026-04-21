import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClass} border-4 border-gray-200 border-t-primary rounded-full animate-spin`}></div>
      {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
