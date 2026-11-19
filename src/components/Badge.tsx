import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  withDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  dot,
  withDot,
  size = 'md',
  className = '',
  icon,
}) => {
  const showDot = dot !== undefined ? dot : withDot !== undefined ? withDot : false;
  const mappedVariant = variant === 'neutral' ? 'default' : variant;
  const sizeClass = size === 'sm' ? 'badge-sm' : '';

  return (
    <span className={`badge badge-${mappedVariant} ${sizeClass} ${className}`}>
      {showDot && <span className="badge-dot" aria-hidden="true" />}
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
