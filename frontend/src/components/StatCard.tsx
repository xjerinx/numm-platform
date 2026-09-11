import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  decimalPlaces?: number;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: string;
  subtext?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix = '',
  decimalPlaces = 0,
  icon: Icon,
  trend,
  trendPositive = true,
  accentColor = 'text-numm-navy',
  subtext,
  delay = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const formatted =
    decimalPlaces > 0
      ? displayValue.toFixed(decimalPlaces)
      : Math.round(displayValue).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform ${accentColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
          {formatted}
        </span>
        {suffix && (
          <span className="text-lg font-bold text-slate-600 font-mono">
            {suffix}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        {subtext ? (
          <span className="text-slate-500 font-medium">{subtext}</span>
        ) : (
          <span className="text-slate-400">Standardized across CPSEs</span>
        )}
        {trend && (
          <span
            className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
              trendPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {/* Decorative accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent group-hover:via-amber-400 transition-all duration-500" />
    </motion.div>
  );
};
