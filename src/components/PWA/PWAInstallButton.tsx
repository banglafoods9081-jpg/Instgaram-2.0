import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'compact' | 'card' | 'pill';
  collapsed?: boolean;
  theme?: 'dark' | 'light';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'sidebar',
  collapsed = false,
  theme = 'dark',
}) => {
  const { canNativeInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-400">App Installed</p>
            <p className="text-xs text-neutral-300 mt-0.5">
              You are running Instagram as an installed app with offline shell support.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (canNativeInstall) {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') {
        setShowInstructions(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const renderTrigger = () => {
    if (variant === 'compact') {
      return (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-sm hover:opacity-90 transition"
          aria-label="Install App"
          title="Install App"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      );
    }

    if (variant === 'pill') {
      return (
        <button
          type="button"
          onClick={handleClick}
          className="w-full py-2.5 px-4 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold transition flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4 text-pink-400" />
          <span>Install App on Phone / Desktop</span>
        </button>
      );
    }

    if (variant === 'card') {
      return (
        <div className="p-4 rounded-xl border border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Install App (PWA)</p>
              <p className="text-xs text-neutral-400">
                Add to Home Screen for full-screen app experience & instant launch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="px-4 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition shrink-0 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>
      );
    }

    // Default: sidebar
    return (
      <button
        onClick={handleClick}
        title="Install App"
        className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition duration-200 w-full text-left font-medium ${
          theme === 'dark'
            ? 'hover:bg-neutral-900 text-pink-400'
            : 'hover:bg-neutral-100 text-pink-600'
        }`}
      >
        <Download className="w-6 h-6 shrink-0" />
        {!collapsed && <span className="text-[15px]">Install App</span>}
      </button>
    );
  };

  return (
    <>
      {renderTrigger()}

      {showInstructions && (
        <div
          onClick={() => setShowInstructions(false)}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 text-white p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Install Instagram App</h3>
                  <p className="text-[11px] text-neutral-400">Works on Android, iPhone & Desktop</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                <p className="font-semibold text-white">On iPhone / iPad (Safari):</p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" /> <strong>Share</strong> button in Safari.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-neutral-200" /> <strong>Add to Home Screen</strong>.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> — the app opens full-screen like a native app!
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                <p className="font-semibold text-white">In Chrome / Edge / Android:</p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Open the live app URL directly in a new tab (outside preview frames) using Chrome or Edge.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Tap the browser menu (<strong>⋮</strong>) or the address bar install icon and select <strong>Install app</strong> / <strong>Add to Home screen</strong>.
                  </span>
                </p>
              </div>
            )}

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
