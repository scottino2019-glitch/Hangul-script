import React, { useMemo, useState } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import {
  CHOSEONG_LIST,
  JONGSEONG_LIST,
  JUNGSEONG_LIST,
  composeHangulSyllable,
  romanizeHangul,
} from '../data/hangulEngine';
import { speakKorean } from '../utils/speech';

interface SyllableBuilderProps {
  onSelectSyllable: (syllable: string, romanization: string) => void;
}

export const SyllableBuilder: React.FC<SyllableBuilderProps> = ({ onSelectSyllable }) => {
  const [initialIdx, setInitialIdx] = useState(0); // ㄱ
  const [medialIdx, setMedialIdx] = useState(0);  // ㅏ
  const [finalIdx, setFinalIdx] = useState(0);    // none

  const composed = useMemo(
    () => composeHangulSyllable(initialIdx, medialIdx, finalIdx),
    [initialIdx, medialIdx, finalIdx]
  );

  const roman = useMemo(() => romanizeHangul(composed), [composed]);

  return (
    <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Costruttore Libero di Sillabe</h3>
          <p className="text-xs text-slate-300">
            Combina consonante iniziale, vocale e batchim finale.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => speakKorean(composed)}
            title="Ascolta pronuncia"
            className="p-2 rounded-lg border border-slate-600 bg-slate-700 text-white hover:bg-slate-600 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <div className="w-11 h-11 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-kr text-2xl font-bold text-slate-950">
            {composed}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-blue-800">1. Iniziale</span>
            <select
              value={initialIdx}
              onChange={(e) => setInitialIdx(Number(e.target.value))}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 font-kr text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              {CHOSEONG_LIST.map((ch, idx) => (
                <option key={`ini-${ch}`} value={idx}>
                  {ch}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-red-700">2. Vocale</span>
            <select
              value={medialIdx}
              onChange={(e) => setMedialIdx(Number(e.target.value))}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 font-kr text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              {JUNGSEONG_LIST.map((ch, idx) => (
                <option key={`med-${ch}`} value={idx}>
                  {ch}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-teal-800">3. Finale (opz.)</span>
            <select
              value={finalIdx}
              onChange={(e) => setFinalIdx(Number(e.target.value))}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 font-kr text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              {JONGSEONG_LIST.map((ch, idx) => (
                <option key={`fin-${idx}`} value={idx}>
                  {ch === '' ? 'Nessuna' : ch}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
          <div className="text-xs text-slate-700">
            Lettura: <span className="font-mono-tabular font-bold text-slate-950">[{roman}]</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectSyllable(composed, roman)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Pratica questa sillaba</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
