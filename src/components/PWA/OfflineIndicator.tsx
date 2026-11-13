import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-amber-500 text-black font-bold text-xs shadow-xl flex items-center gap-2 border border-amber-300"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>You are offline — showing cached view</span>
    </div>
  );
};
