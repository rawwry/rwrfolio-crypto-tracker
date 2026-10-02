import React from 'react';
import { motion } from 'framer-motion';

interface AppLogoProps {
  customLogoUrl?: string;
  size?: number; // size in px, default 34
  className?: string;
  withGlow?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  customLogoUrl,
  size = 34,
  className = '',
  withGlow = true,
}) => {
  if (customLogoUrl) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={customLogoUrl}
          alt="Custom Logo"
          className="w-full h-full object-contain"
        />
      </motion.div>
    );
  }

  // Pixel Fox / Cat Emblem SVG
  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: [0, -4, 4, 0] }}
      transition={{ duration: 0.3 }}
      className={`relative inline-flex items-center justify-center rounded-xl bg-slate-900 border border-indigo-500/30 overflow-hidden shadow-sm select-none group cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      title="rwrfolio"
    >
      {withGlow && (
        <div className="absolute inset-0 bg-indigo-500/15 rounded-xl blur-sm group-hover:bg-indigo-500/25 transition-all" />
      )}

      <svg
        viewBox="0 0 48 48"
        width={size * 0.78}
        height={size * 0.78}
        className="relative z-10 drop-shadow-sm"
        shapeRendering="crispEdges"
      >
        {/* 12x12 Grid mapped to 48x48 (each pixel is 4x4) */}
        {/* Row 0 */}
        <rect x="4" y="0" width="4" height="4" fill="#6366f1" />
        <rect x="40" y="0" width="4" height="4" fill="#6366f1" />

        {/* Row 1 */}
        <rect x="0" y="4" width="12" height="4" fill="#6366f1" />
        <rect x="36" y="4" width="12" height="4" fill="#6366f1" />

        {/* Row 2 */}
        <rect x="0" y="8" width="16" height="4" fill="#6366f1" />
        <rect x="32" y="8" width="16" height="4" fill="#6366f1" />

        {/* Row 3 */}
        <rect x="4" y="12" width="40" height="4" fill="#6366f1" />

        {/* Row 4: Eyes top */}
        <rect x="4" y="16" width="8" height="4" fill="#6366f1" />
        <rect x="12" y="16" width="8" height="4" fill="#ffffff" />
        <rect x="20" y="16" width="8" height="4" fill="#6366f1" />
        <rect x="28" y="16" width="8" height="4" fill="#ffffff" />
        <rect x="36" y="16" width="8" height="4" fill="#6366f1" />

        {/* Row 5: Eyes pupils */}
        <rect x="4" y="20" width="8" height="4" fill="#6366f1" />
        <rect x="12" y="20" width="4" height="4" fill="#1e1b4b" />
        <rect x="16" y="20" width="4" height="4" fill="#ffffff" />
        <rect x="20" y="20" width="8" height="4" fill="#6366f1" />
        <rect x="28" y="20" width="4" height="4" fill="#1e1b4b" />
        <rect x="32" y="20" width="4" height="4" fill="#ffffff" />
        <rect x="36" y="20" width="8" height="4" fill="#6366f1" />

        {/* Row 6: Cheeks */}
        <rect x="0" y="24" width="48" height="4" fill="#6366f1" />

        {/* Row 7: Heart nose / mouth */}
        <rect x="0" y="28" width="20" height="4" fill="#6366f1" />
        <rect x="20" y="28" width="8" height="4" fill="#f43f5e" />
        <rect x="28" y="28" width="20" height="4" fill="#6366f1" />

        {/* Row 8 */}
        <rect x="8" y="32" width="32" height="4" fill="#6366f1" />

        {/* Row 9 */}
        <rect x="12" y="36" width="24" height="4" fill="#6366f1" />

        {/* Row 10 */}
        <rect x="16" y="40" width="16" height="4" fill="#6366f1" />

        {/* Row 11 */}
        <rect x="20" y="44" width="8" height="4" fill="#6366f1" />
      </svg>
    </motion.div>
  );
};
