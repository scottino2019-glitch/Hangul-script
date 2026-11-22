import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Suppress button when already running in standalone installed mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        {isIOS ? <Smartphone className="w-3.5 h-3.5 text-blue-700" /> : <Download className="w-3.5 h-3.5 text-blue-700" />}
        <span>{isIOS ? 'Installa su iOS' : 'Installa App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="pwa-guide-title" className="text-base font-bold text-slate-950">
                  {isIOS ? 'Installa su iPhone / iPad' : 'Installa HangulScript come App'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Usa HangulScript a schermo intero e anche offline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Chiudi guida installazione"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono-tabular font-semibold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Tocca il pulsante <strong className="inline-flex items-center gap-1 text-slate-950">Condividi <Share className="w-3 h-3" /></strong> nella barra di Safari.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono-tabular font-semibold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Scorri e seleziona <strong className="text-slate-950">Aggiungi alla schermata Home</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono-tabular font-semibold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Se sei nell’anteprima incorporata, apri prima l’app nella sua scheda dedicata dal pulsante di apertura esterna.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono-tabular font-semibold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Su Chrome o Edge clicca l’icona <strong className="text-slate-950">Installa HangulScript</strong> nella barra degli indirizzi oppure dal menu del browser.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-lg bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
};
