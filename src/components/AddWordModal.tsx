import React, { useMemo, useState } from 'react';
import { Delete, Keyboard, Plus, X } from 'lucide-react';
import {
  decomposeChar,
  extractHangulChars,
  isValidHangulInput,
  romanizeHangul,
} from '../data/hangulEngine';
import { StudyItem } from '../types/hangul';
import { appendJamoToText, backspaceHangulText } from '../utils/hangulInput';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWord: (item: StudyItem) => void;
}

const KEYBOARD_CONSONANTS = [
  'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
  'ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ',
];

const KEYBOARD_VOWELS = [
  'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ',
];

export const AddWordModal: React.FC<AddWordModalProps> = ({
  isOpen,
  onClose,
  onAddWord,
}) => {
  const [hangul, setHangul] = useState('');
  const [romanization, setRomanization] = useState('');
  const [romanTouched, setRomanTouched] = useState(false);
  const [meaningIt, setMeaningIt] = useState('');
  const [notes, setNotes] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const autoRoman = useMemo(() => romanizeHangul(hangul), [hangul]);
  const effectiveRoman = romanTouched ? romanization : autoRoman;

  const previewChars = useMemo(() => extractHangulChars(hangul), [hangul]);
  const totalStrokes = useMemo(
    () => previewChars.reduce((acc, ch) => acc + decomposeChar(ch).strokes.length, 0),
    [previewChars]
  );

  if (!isOpen) return null;

  const handleHangulChange = (val: string) => {
    setHangul(val);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hangul.trim();
    if (!trimmed) {
      setError('Inserisci almeno una lettera o parola coreana.');
      return;
    }
    if (!isValidHangulInput(trimmed)) {
      setError('Usa solo caratteri coreani Hangul (es. 사랑, 김치, 안녕하세요).');
      return;
    }

    const cleanHangul = trimmed.replace(/\s+/g, ' ');
    const item: StudyItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      hangul: cleanHangul,
      romanization: (effectiveRoman || autoRoman).trim(),
      meaningIt: meaningIt.trim() || 'Parola personalizzata',
      category: 'Lista Personale',
      stage: 'custom',
      notes: notes.trim() || undefined,
      isCustom: true,
      createdAt: Date.now(),
    };

    onAddWord(item);
    setHangul('');
    setRomanization('');
    setRomanTouched(false);
    setMeaningIt('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-word-title"
    >
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 id="add-word-title" className="text-base font-bold text-slate-900">
              Aggiungi alla tua lista di studio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Qualsiasi parola Hangul viene scomposta automaticamente nei singoli tratti animati.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Hangul input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="hangul-input" className="text-xs font-semibold text-slate-800">
                Parola o sillaba in Hangul
              </label>
              <button
                type="button"
                onClick={() => setShowKeyboard((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{showKeyboard ? 'Nascondi tastiera Hangul' : 'Apri tastiera Hangul'}</span>
              </button>
            </div>

            <input
              id="hangul-input"
              type="text"
              value={hangul}
              onChange={(e) => handleHangulChange(e.target.value)}
              placeholder="Es. 사랑, 김치, 행복..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-kr text-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />

            {previewChars.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                <span>
                  {previewChars.length} {previewChars.length === 1 ? 'carattere' : 'sillabe'}
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono-tabular">{totalStrokes} tratti totali</span>
                </span>
                <span className="font-mono-tabular text-slate-700">[{autoRoman}]</span>
              </div>
            )}

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          </div>

          {/* Built-in Virtual Hangul Keyboard */}
          {showKeyboard && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Tastiera Hangul rapida (assembla le sillabe in automatico)</span>
                <button
                  type="button"
                  onClick={() => handleHangulChange(backspaceHangulText(hangul))}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Delete className="w-3 h-3" />
                  <span>Cancella</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {KEYBOARD_CONSONANTS.map((c) => (
                  <button
                    key={`kb-${c}`}
                    type="button"
                    onClick={() => handleHangulChange(appendJamoToText(hangul, c))}
                    className="w-7 h-7 rounded bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 font-kr text-sm font-medium text-slate-900 transition-colors cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {KEYBOARD_VOWELS.map((v) => (
                  <button
                    key={`kb-${v}`}
                    type="button"
                    onClick={() => handleHangulChange(appendJamoToText(hangul, v))}
                    className="w-7 h-7 rounded bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50 font-kr text-sm font-medium text-slate-900 transition-colors cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Italian Meaning & Romanization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="meaning-input" className="text-xs font-semibold text-slate-800">
                Significato in italiano
              </label>
              <input
                id="meaning-input"
                type="text"
                value={meaningIt}
                onChange={(e) => setMeaningIt(e.target.value)}
                placeholder="Es. Felicità, Gelato..."
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="roman-input" className="text-xs font-semibold text-slate-800">
                Trascrizione (automatica)
              </label>
              <input
                id="roman-input"
                type="text"
                value={effectiveRoman}
                onChange={(e) => {
                  setRomanTouched(true);
                  setRomanization(e.target.value);
                }}
                placeholder="es. haeng-bok"
                className="px-3 py-2 rounded-lg border border-slate-300 font-mono-tabular text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="notes-input" className="text-xs font-semibold text-slate-800">
              Nota personale (opzionale)
            </label>
            <input
              id="notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es. Espressione usata nei dialoghi quotidiani"
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Salva e pratica</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
