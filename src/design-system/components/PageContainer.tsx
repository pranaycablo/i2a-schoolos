import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1400px]',
  full: 'max-w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'xl',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in ${maxWidthClasses[maxWidth]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
