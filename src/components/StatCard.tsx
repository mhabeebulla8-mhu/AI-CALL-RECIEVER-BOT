import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isUp?: boolean;
    direction?: 'up' | 'down';
    label?: string;
  };
  sparklineData?: number[];
  sparklineColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  sparklineData = [12, 18, 15, 22, 28, 25, 34],
  sparklineColor = '#4f46e5',
}) => {
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 64;
  const height = 24;

  const points = sparklineData
    .map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const isPositive = trend ? (trend.isUp !== undefined ? trend.isUp : trend.direction === 'up') : true;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {trend && (
          <span className={`stat-trend-chip ${isPositive ? 'up' : 'down'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}
          </span>
        )}
      </div>

      <div className="stat-card-main">
        <div className="stat-card-value">{value}</div>

        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ overflow: 'visible', flexShrink: 0 }}
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke={sparklineColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
};

export default StatCard;
