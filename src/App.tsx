import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Volume2,
} from 'lucide-react';
import { AddWordModal } from './components/AddWordModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SyllableBuilder } from './components/SyllableBuilder';
import { WritingCanvas } from './components/WritingCanvas';
import {
  LETTERS_CURRICULUM,
  SYLLABLES_CURRICULUM,
  WORDS_CURRICULUM,
} from './data/curriculum';
import {
  JAMO_METADATA,
  decomposeChar,
  extractHangulChars,
  romanizeHangul,
} from './data/hangulEngine';
import { MasteryRecord, StageId, StudyItem } from './types/hangul';
import { speakKorean } from './utils/speech';

const STORAGE_CUSTOM_KEY = 'hangulscript_custom_words_v1';
const STORAGE_MASTERY_KEY = 'hangulscript_mastery_v1';

const DEFAULT_CUSTOM_WORDS: StudyItem[] = [
  {
    id: 'custom-starter-kimchi',
    hangul: '김치',
    romanization: 'gim-chi',
    meaningIt: 'Kimchi (piatto tradizionale)',
    category: 'Lista Personale',
    stage: 'custom',
    notes: 'Esempio modificabile: aggiungi tutte le parole che vuoi studiare.',
    isCustom: true,
    createdAt: 1700000000000,
  },
  {
    id: 'custom-starter-kkum',
    hangul: '꿈',
    romanization: 'kkum',
    meaningIt: 'Sogno',
    category: 'Lista Personale',
    stage: 'custom',
    notes: 'Combina la doppia consonante ㄲ, la vocale ㅜ e il batchim ㅁ.',
    isCustom: true,
    createdAt: 1700000000001,
  },
  {
    id: 'custom-starter-icecream',
    hangul: '아이스크림',
    romanization: 'a-i-seu-keu-rim',
    meaningIt: 'Gelato',
    category: 'Lista Personale',
    stage: 'custom',
    notes: 'Ottima parola lunga per esercitarsi con sillabe in sequenza.',
    isCustom: true,
    createdAt: 1700000000002,
  },
];

const STAGE_LABELS: Record<StageId, { title: string; subtitle: string }> = {
  letters: {
    title: '01. Lettere Singole (Jamo)',
    subtitle: 'Impara i tratti fondamentali di vocali e consonanti prima di unirli.',
  },
  syllables: {
    title: '02. Accoppiamenti (Sillabe)',
    subtitle: 'Combina consonanti e vocali in blocchi quadrati equilibrati.',
  },
  words: {
    title: '03. Parole Vere (Vocabolario)',
    subtitle: 'Scrivi parole complete sillaba dopo sillaba con pronuncia reale.',
  },
  custom: {
    title: '04. La Mia Lista di Studio',
    subtitle: 'Espandi il tuo quaderno con qualsiasi parola coreana vuoi imparare.',
  },
};

export default function App() {
  const [activeStage, setActiveStage] = useState<StageId>('letters');
  const [selectedItemId, setSelectedItemId] = useState<string>(LETTERS_CURRICULUM[0].id);
  const [adHocItem, setAdHocItem] = useState<StudyItem | null>(null);
  const [activeSyllableIdx, setActiveSyllableIdx] = useState(0);

  const [categoryFilter, setCategoryFilter] = useState<string>('Tutte');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [customWords, setCustomWords] = useState<StudyItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return DEFAULT_CUSTOM_WORDS;
  });

  const [mastery, setMastery] = useState<Record<string, MasteryRecord>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_MASTERY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(customWords));
    } catch {
      // Ignore storage write errors
    }
  }, [customWords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MASTERY_KEY, JSON.stringify(mastery));
    } catch {
      // Ignore storage write errors
    }
  }, [mastery]);

  const stageItems = useMemo(() => {
    if (activeStage === 'letters') return LETTERS_CURRICULUM;
    if (activeStage === 'syllables') return SYLLABLES_CURRICULUM;
    if (activeStage === 'words') return WORDS_CURRICULUM;
    return customWords;
  }, [activeStage, customWords]);

  const categories = useMemo(() => {
    const set = new Set<string>(['Tutte']);
    stageItems.forEach((item) => set.add(item.category));
    return Array.from(set);
  }, [stageItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stageItems.filter((item) => {
      const matchesCat = categoryFilter === 'Tutte' || item.category === categoryFilter;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        item.hangul.includes(q) ||
        item.romanization.toLowerCase().includes(q) ||
        item.meaningIt.toLowerCase().includes(q)
      );
    });
  }, [stageItems, categoryFilter, searchQuery]);

  const activeItem: StudyItem = useMemo(() => {
    if (adHocItem && adHocItem.id === selectedItemId) return adHocItem;
    const all = [
      ...LETTERS_CURRICULUM,
      ...SYLLABLES_CURRICULUM,
      ...WORDS_CURRICULUM,
      ...customWords,
    ];
    return all.find((item) => item.id === selectedItemId) || stageItems[0] || LETTERS_CURRICULUM[0];
  }, [adHocItem, selectedItemId, customWords, stageItems]);

  const itemChars = useMemo(() => {
    const chars = extractHangulChars(activeItem.hangul);
    return chars.length > 0 ? chars : ['ㅏ'];
  }, [activeItem.hangul]);

  const safeSyllableIdx = Math.min(activeSyllableIdx, itemChars.length - 1);
  const currentChar = itemChars[safeSyllableIdx];
  const decomposed = useMemo(() => decomposeChar(currentChar), [currentChar]);

  const handleStageSwitch = (stage: StageId) => {
    setActiveStage(stage);
    setCategoryFilter('Tutte');
    setSearchQuery('');
    setAdHocItem(null);
    setActiveSyllableIdx(0);

    const targetList =
      stage === 'letters'
        ? LETTERS_CURRICULUM
        : stage === 'syllables'
        ? SYLLABLES_CURRICULUM
        : stage === 'words'
        ? WORDS_CURRICULUM
        : customWords;

    if (targetList.length > 0) {
      setSelectedItemId(targetList[0].id);
    }
  };

  const handleSelectItem = (item: StudyItem) => {
    setAdHocItem(null);
    setSelectedItemId(item.id);
    setActiveSyllableIdx(0);
  };

  const handleSpeak = async (text: string) => {
    setIsSpeaking(true);
    await speakKorean(text);
    setIsSpeaking(false);
  };

  const handleSyllableComplete = (accuracy: number) => {
    const charKey = `char:${currentChar}`;
    setMastery((prev) => {
      const existingChar = prev[charKey];
      const next: Record<string, MasteryRecord> = {
        ...prev,
        [charKey]: {
          completions: (existingChar?.completions || 0) + 1,
          lastPracticedAt: Date.now(),
          bestAccuracy: Math.max(existingChar?.bestAccuracy || 0, accuracy),
        },
      };

      if (itemChars.length === 1 || safeSyllableIdx === itemChars.length - 1) {
        const existingItem = prev[activeItem.id];
        next[activeItem.id] = {
          completions: (existingItem?.completions || 0) + 1,
          lastPracticedAt: Date.now(),
          bestAccuracy: Math.max(existingItem?.bestAccuracy || 0, accuracy),
        };
      }
      return next;
    });
  };

  const handleNextTarget = () => {
    if (safeSyllableIdx + 1 < itemChars.length) {
      setActiveSyllableIdx((idx) => idx + 1);
      return;
    }
    const idx = filteredItems.findIndex((i) => i.id === activeItem.id);
    if (idx >= 0 && idx + 1 < filteredItems.length) {
      handleSelectItem(filteredItems[idx + 1]);
    }
  };

  const hasNextTarget = useMemo(() => {
    if (safeSyllableIdx + 1 < itemChars.length) return true;
    const idx = filteredItems.findIndex((i) => i.id === activeItem.id);
    return idx >= 0 && idx + 1 < filteredItems.length;
  }, [safeSyllableIdx, itemChars.length, filteredItems, activeItem.id]);

  const nextTargetLabel =
    safeSyllableIdx + 1 < itemChars.length ? 'Prossima sillaba' : 'Prossimo elemento';

  const handleAddCustomWord = (item: StudyItem) => {
    setCustomWords((prev) => [item, ...prev]);
    setActiveStage('custom');
    setCategoryFilter('Tutte');
    setSearchQuery('');
    setAdHocItem(null);
    setSelectedItemId(item.id);
    setActiveSyllableIdx(0);
  };

  const handleDeleteCustomWord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomWords((prev) => {
      const next = prev.filter((w) => w.id !== id);
      if (selectedItemId === id && next.length > 0) {
        setSelectedItemId(next[0].id);
        setActiveSyllableIdx(0);
      }
      return next;
    });
  };

  const isSavedInCustom = useMemo(
    () => customWords.some((w) => w.hangul === activeItem.hangul),
    [customWords, activeItem.hangul]
  );

  const handleToggleSaveToCustom = () => {
    if (isSavedInCustom) {
      setCustomWords((prev) => prev.filter((w) => w.hangul !== activeItem.hangul));
      return;
    }
    const saved: StudyItem = {
      ...activeItem,
      id: `custom-${Date.now()}`,
      category: 'Lista Personale',
      stage: 'custom',
      isCustom: true,
      createdAt: Date.now(),
    };
    setCustomWords((prev) => [saved, ...prev]);
  };

  const handleSelectCustomSyllable = (syllable: string, roman: string) => {
    const temp: StudyItem = {
      id: `adhoc-${syllable}`,
      hangul: syllable,
      romanization: roman,
      meaningIt: `Sillaba personalizzata ${syllable}`,
      category: 'Costruttore',
      stage: 'syllables',
      notes: 'Creata nel costruttore interattivo di sillabe.',
    };
    setAdHocItem(temp);
    setSelectedItemId(temp.id);
    setActiveSyllableIdx(0);
  };

  const stageMasteredCount = useMemo(
    () => stageItems.filter((item) => (mastery[item.id]?.completions || 0) > 0).length,
    [stageItems, mastery]
  );

  const isWordStage = activeStage === 'words' || activeStage === 'custom';

  return (
    <div className="min-h-screen flex flex-col bg-[#DCE3EC] text-slate-900">
      {/* High-Contrast Dark Ink Top Navigation Bar (Strict 3-zone contract) */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleStageSwitch('letters');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            HangulScript
          </a>

          {/* Zone 2: 4 Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {(
              [
                { id: 'letters', label: 'Lettere' },
                { id: 'syllables', label: 'Accoppiamenti' },
                { id: 'words', label: 'Parole' },
                { id: 'custom', label: 'La Mia Lista' },
              ] as const
            ).map((nav) => {
              const isActive = activeStage === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => handleStageSwitch(nav.id)}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-white border-sky-400 font-semibold'
                      : 'text-slate-300 border-transparent hover:text-white'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi parola</span>
            </button>
          </div>
        </div>

        {/* Mobile Stage Switcher */}
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'letters', label: 'Lettere' },
              { id: 'syllables', label: 'Accoppiamenti' },
              { id: 'words', label: 'Parole' },
              { id: 'custom', label: 'La Mia Lista' },
            ] as const
          ).map((nav) => (
            <button
              key={`mob-${nav.id}`}
              type="button"
              onClick={() => handleStageSwitch(nav.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                activeStage === nav.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 bg-slate-800'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Two-Zone Educational Sandbox */}
      <main id="top" className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-7 flex flex-col gap-6">
        {/* Distinct Stage Summary Card */}
        <div className="bg-white border border-slate-300 rounded-2xl px-5 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              {STAGE_LABELS[activeStage].title}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {STAGE_LABELS[activeStage].subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
            <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 font-mono-tabular text-slate-700">
              Completati: <strong className="text-slate-950">{stageMasteredCount}</strong> /{' '}
              {stageItems.length}
            </div>
            <PWAInstallButton />
            {activeStage !== 'words' && activeStage !== 'custom' && (
              <button
                type="button"
                onClick={() =>
                  handleStageSwitch(activeStage === 'letters' ? 'syllables' : 'words')
                }
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer whitespace-nowrap transition-colors"
              >
                <span>
                  {activeStage === 'letters' ? 'Passa agli accoppiamenti' : 'Passa alle parole'}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Split Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT STAGE (7 cols): Active Target Card + Dark Slate Writing Pad */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            {/* Active Item Header Card */}
            <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-300 font-kr text-4xl sm:text-5xl font-bold text-slate-950 leading-none select-text shrink-0">
                    {activeItem.hangul}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-bold text-slate-950 truncate">
                      {activeItem.meaningIt}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                      <span className="font-mono-tabular font-semibold text-blue-800">
                        [{activeItem.romanization}]
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium">{activeItem.category}</span>
                      {activeItem.phoneticIt && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{activeItem.phoneticIt}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSpeak(activeItem.hangul)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isSpeaking
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Ascolta</span>
                  </button>

                  {activeItem.stage !== 'letters' && (
                    <button
                      type="button"
                      onClick={handleToggleSaveToCustom}
                      title={
                        isSavedInCustom
                          ? 'Rimuovi dalla tua lista'
                          : 'Salva nella tua lista personale'
                      }
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        isSavedInCustom
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Bookmark
                        className="w-4 h-4"
                        fill={isSavedInCustom ? 'currentColor' : 'none'}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-syllable picker for Words */}
              {itemChars.length > 1 && (
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">
                    Sillabe della parola (seleziona o scrivi in sequenza):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {itemChars.map((ch, idx) => {
                      const isCurrent = idx === safeSyllableIdx;
                      const isPracticed = (mastery[`char:${ch}`]?.completions || 0) > 0;
                      return (
                        <button
                          key={`word-char-${idx}-${ch}`}
                          type="button"
                          onClick={() => setActiveSyllableIdx(idx)}
                          className={`relative w-11 h-11 rounded-lg border font-kr text-xl font-bold transition-colors cursor-pointer flex items-center justify-center ${
                            isCurrent
                              ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                              : isPracticed
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-400 hover:border-emerald-500'
                              : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {ch}
                          {isPracticed && !isCurrent && (
                            <Check className="w-3 h-3 text-emerald-700 absolute top-1 right-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Slate Writing Studio Pad */}
            <WritingCanvas
              decomposed={decomposed}
              onSyllableComplete={handleSyllableComplete}
              hasNextSyllable={hasNextTarget}
              onNextSyllable={handleNextTarget}
              nextLabel={nextTargetLabel}
            />
          </section>

          {/* RIGHT DECK (5 cols): Distinct Dark-Header Panels */}
          <aside className="lg:col-span-5 flex flex-col gap-5">
            {/* Character Anatomy Card */}
            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Struttura del carattere corrente</h2>
                  <p className="text-xs text-slate-300">
                    {decomposed.isSingleJamo
                      ? 'Lettera singola (Jamo)'
                      : decomposed.final
                      ? 'Blocco sillabico a 3 componenti (con batchim)'
                      : 'Blocco sillabico a 2 componenti'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSpeak(currentChar)}
                  title={`Pronuncia ${currentChar}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-xs font-medium text-white hover:bg-slate-600 cursor-pointer shrink-0"
                >
                  <span className="font-kr text-base font-bold">{currentChar}</span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-200" />
                </button>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2.5">
                  {decomposed.initial && (
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3">
                      <div className="text-[11px] font-bold text-blue-800">Iniziale</div>
                      <div className="font-kr text-2xl font-bold text-slate-950 mt-0.5">
                        {decomposed.initial}
                      </div>
                      <div className="text-xs font-mono-tabular text-slate-700 truncate">
                        {JAMO_METADATA[decomposed.initial]?.romanization ||
                          romanizeHangul(decomposed.initial)}
                      </div>
                    </div>
                  )}

                  {decomposed.medial && (
                    <div className="rounded-xl bg-red-50/70 border border-red-200 p-3">
                      <div className="text-[11px] font-bold text-red-800">Vocale</div>
                      <div className="font-kr text-2xl font-bold text-slate-950 mt-0.5">
                        {decomposed.medial}
                      </div>
                      <div className="text-xs font-mono-tabular text-slate-700 truncate">
                        {JAMO_METADATA[decomposed.medial]?.romanization ||
                          romanizeHangul(decomposed.medial)}
                      </div>
                    </div>
                  )}

                  {decomposed.final && (
                    <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-3">
                      <div className="text-[11px] font-bold text-teal-800">Finale</div>
                      <div className="font-kr text-2xl font-bold text-slate-950 mt-0.5">
                        {decomposed.final}
                      </div>
                      <div className="text-xs font-mono-tabular text-slate-700 truncate">
                        {JAMO_METADATA[decomposed.final]?.romanization ||
                          romanizeHangul(decomposed.final)}
                      </div>
                    </div>
                  )}
                </div>

                {activeItem.notes && (
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5">
                    {activeItem.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Expandable Syllable Builder in Accoppiamenti */}
            {activeStage === 'syllables' && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowBuilder((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-900 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-700" />
                    <span>Costruttore libero di sillabe (combinazioni personalizzate)</span>
                  </span>
                  <span className="text-blue-700">{showBuilder ? 'Chiudi' : 'Apri'}</span>
                </button>
                {showBuilder && (
                  <SyllableBuilder onSelectSyllable={handleSelectCustomSyllable} />
                )}
              </div>
            )}

            {/* Quick Selector Panel (Letters, Syllables, or Quick Word List) */}
            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">
                  {activeStage === 'letters'
                    ? 'Indice delle Lettere'
                    : activeStage === 'syllables'
                    ? 'Sillabe Guidate'
                    : activeStage === 'words'
                    ? 'Selezione Rapida Parole'
                    : 'Accesso Rapido — La Mia Lista'}
                </h2>
                {activeStage === 'custom' && (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuova</span>
                  </button>
                )}
              </div>

              <div className="p-4 flex flex-col gap-3.5">
                {/* Category Filter Tabs */}
                {categories.length > 2 && (
                  <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg overflow-x-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-950'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Search Input for Words / Custom */}
                {isWordStage && (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cerca in coreano o italiano..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                )}

                {filteredItems.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-600">
                      {activeStage === 'custom'
                        ? 'Nessuna parola trovata nella tua lista personale.'
                        : 'Nessun risultato trovato.'}
                    </p>
                    {activeStage === 'custom' && (
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Aggiungi la tua prima parola</span>
                      </button>
                    )}
                  </div>
                ) : !isWordStage ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {filteredItems.map((item) => {
                      const isSelected = item.id === activeItem.id;
                      const isDone = (mastery[item.id]?.completions || 0) > 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          className={`relative flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                              : isDone
                              ? 'bg-emerald-50 text-slate-950 border-emerald-300 hover:border-emerald-400'
                              : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-kr text-xl font-bold leading-tight">
                            {item.hangul}
                          </span>
                          <span
                            className={`font-mono-tabular text-[11px] mt-0.5 truncate max-w-full ${
                              isSelected ? 'text-blue-100' : 'text-slate-600'
                            }`}
                          >
                            {item.romanization}
                          </span>
                          {isDone && (
                            <Check
                              className={`w-3 h-3 absolute top-1.5 right-1.5 ${
                                isSelected ? 'text-emerald-200' : 'text-emerald-700'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredItems.map((item) => {
                      const isSelected = item.id === activeItem.id;
                      const rec = mastery[item.id];
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectItem(item);
                            }
                          }}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`font-kr text-2xl font-bold shrink-0 ${
                                isSelected ? 'text-white' : 'text-slate-950'
                              }`}
                            >
                              {item.hangul}
                            </span>
                            <div className="min-w-0">
                              <div
                                className={`text-sm font-bold truncate ${
                                  isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {item.meaningIt}
                              </div>
                              <div
                                className={`text-xs font-mono-tabular truncate ${
                                  isSelected ? 'text-slate-300' : 'text-slate-600'
                                }`}
                              >
                                [{item.romanization}]
                                {rec && rec.completions > 0 && (
                                  <span
                                    className={`font-sans ml-1.5 font-medium ${
                                      isSelected ? 'text-emerald-300' : 'text-emerald-700'
                                    }`}
                                  >
                                    · {rec.completions}x ({rec.bestAccuracy}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpeak(item.hangul);
                              }}
                              title={`Ascolta ${item.hangul}`}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isSelected
                                  ? 'text-slate-200 hover:bg-slate-800'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            {item.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomWord(item.id, e)}
                                title="Elimina parola"
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'text-slate-300 hover:text-red-300 hover:bg-slate-800'
                                    : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <ChevronRight
                              className={`w-4 h-4 ${
                                isSelected ? 'text-sky-400' : 'text-slate-400'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Dedicated Full-Width Catalog for Parole & La Mia Lista */}
        {isWordStage && (
          <section className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <h2 className="text-base font-bold">
                    {activeStage === 'words'
                      ? 'Catalogo Completo del Vocabolario'
                      : 'Quaderno Personale — Tutte le Tue Parole'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {activeStage === 'words'
                      ? 'Clicca su una parola per caricarla sulla lavagna o salvarla nella tua lista.'
                      : 'Tutte le parole aggiunte manualmente o salvate dalle lezioni, sempre pronte per la pratica.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-tabular text-slate-300">
                  {filteredItems.length} {filteredItems.length === 1 ? 'parola' : 'parole'}
                </span>
                {activeStage === 'custom' && (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi parola</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-100/80">
              {filteredItems.length === 0 ? (
                <div className="bg-white border border-slate-300 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                  <p className="text-sm font-medium text-slate-700">
                    Nessuna parola corrisponde ai filtri selezionati.
                  </p>
                  {activeStage === 'custom' && (
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Aggiungi nuova parola coreana</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => {
                    const isSelected = item.id === activeItem.id;
                    const rec = mastery[item.id];
                    const charCount = extractHangulChars(item.hangul).length;
                    return (
                      <div
                        key={`catalog-${item.id}`}
                        onClick={() => {
                          handleSelectItem(item);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectItem(item);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-600/35'
                            : 'bg-white text-slate-950 border-slate-300 hover:border-blue-500 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div
                              className={`font-kr text-3xl font-bold leading-tight ${
                                isSelected ? 'text-white' : 'text-slate-950'
                              }`}
                            >
                              {item.hangul}
                            </div>
                            <div
                              className={`text-sm font-bold mt-1.5 ${
                                isSelected ? 'text-slate-100' : 'text-slate-900'
                              }`}
                            >
                              {item.meaningIt}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpeak(item.hangul);
                              }}
                              title={`Ascolta ${item.hangul}`}
                              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            {item.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomWord(item.id, e)}
                                title="Elimina dalla lista"
                                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-red-300'
                                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div
                          className={`pt-2.5 border-t flex items-center justify-between gap-2 text-xs ${
                            isSelected
                              ? 'border-slate-800 text-slate-300'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-mono-tabular truncate">
                            [{item.romanization}] · {charCount}{' '}
                            {charCount === 1 ? 'sillaba' : 'sillabe'}
                          </span>
                          <span
                            className={`font-semibold shrink-0 ${
                              isSelected
                                ? 'text-sky-400'
                                : rec && rec.completions > 0
                                ? 'text-emerald-700'
                                : 'text-blue-700'
                            }`}
                          >
                            {isSelected
                              ? 'In pratica'
                              : rec && rec.completions > 0
                              ? `${rec.bestAccuracy}% · Pratica`
                              : 'Scrivi ora'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <AddWordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddWord={handleAddCustomWord}
      />
      <OfflineIndicator />
    </div>
  );
}
