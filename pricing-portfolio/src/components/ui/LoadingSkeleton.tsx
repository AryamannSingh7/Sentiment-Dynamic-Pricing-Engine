interface Props {
  className?: string;
}

export default function LoadingSkeleton({ className = '' }: Props) {
  return <div className={`skeleton ${className}`} />;
}
