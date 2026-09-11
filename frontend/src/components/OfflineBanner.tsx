import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
  onRetry?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline, onRetry }) => {
  if (!isOffline) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-amber-900 flex items-center justify-between text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
        <span>
          <strong className="font-semibold text-amber-950">AI Microservice Offline:</strong> Heuristic token similarity and cached UNSPSC classifications are currently active. All platform modules remain fully functional.
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
};
