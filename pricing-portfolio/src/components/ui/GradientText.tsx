import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GradientText({ children, className = '' }: Props) {
  return (
    <span className={`bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}
