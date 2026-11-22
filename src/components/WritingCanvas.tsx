import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Eye,
  EyeOff,
  Grid,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { DecomposedChar, JamoRole, Point, RenderedStroke, UserDrawnStroke } from '../types/hangul';
import { evaluateFreehandCharacter, evaluateGuidedStroke } from '../utils/strokeEvaluator';

interface WritingCanvasProps {
  decomposed: DecomposedChar;
  onSyllableComplete?: (accuracy: number) => void;
  hasNextSyllable?: boolean;
  onNextSyllable?: () => void;
  nextLabel?: string;
}

type PracticeMode = 'guided' | 'free';
type GhostLevel = 'strong' | 'light' | 'hidden';

const ROLE_COLORS: Record<JamoRole, string> = {
  initial: '#1D4ED8', // Cobalt blue
  medial: '#DC2626',  // Crimson seal
  final: '#0F766E',   // Jade teal
};

const ROLE_LABELS: Record<JamoRole, string> = {
  initial: 'Iniziale',
  medial: 'Vocale',
  final: 'Finale',
};

function pointsToSmoothSvg(pts: Point[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) {
    return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${(pts[0].x + 0.01).toFixed(2)} ${(pts[0].y + 0.01).toFixed(2)}`;
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

function interpolatePointOnStroke(stroke: RenderedStroke, t: number): Point {
  const pts = stroke.points;
  if (pts.length === 0) return { x: 50, y: 50 };
  if (pts.length === 1 || t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];

  const exactIdx = t * (pts.length - 1);
  const idx = Math.floor(exactIdx);
  const frac = exactIdx - idx;
  const a = pts[idx];
  const b = pts[Math.min(pts.length - 1, idx + 1)];
  return {
    x: a.x + (b.x - a.x) * frac,
    y: a.y + (b.y - a.y) * frac,
  };
}

export const WritingCanvas: React.FC<WritingCanvasProps> = ({
  decomposed,
  onSyllableComplete,
  hasNextSyllable,
  onNextSyllable,
  nextLabel = 'Prossima sillaba',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [mode, setMode] = useState<PracticeMode>('guided');
  const [ghostLevel, setGhostLevel] = useState<GhostLevel>('light');
  const [showNumbers, setShowNumbers] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [colorByRole, setColorByRole] = useState(true);
  const [speed, setSpeed] = useState<0.7 | 1 | 1.5>(1);

  // Animation playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [animStrokeIdx, setAnimStrokeIdx] = useState(0);
  const [animProgress, setAnimProgress] = useState(0);
  const [inspectedStrokeIdx, setInspectedStrokeIdx] = useState<number | null>(null);

  // Interactive drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePoints, setActivePoints] = useState<Point[]>([]);
  const [guidedCompletedStrokes, setGuidedCompletedStrokes] = useState<UserDrawnStroke[]>([]);
  const [guidedAccuracies, setGuidedAccuracies] = useState<number[]>([]);
  const [freeStrokes, setFreeStrokes] = useState<UserDrawnStroke[]>([]);

  const [feedback, setFeedback] = useState<{
    type: 'neutral' | 'success' | 'error';
    text: string;
  } | null>(null);

  const [freeScore, setFreeScore] = useState<{ accuracy: number; message: string } | null>(null);

  const strokes = decomposed.strokes;
  const totalStrokes = strokes.length;
  const currentGuidedIdx = guidedCompletedStrokes.length;
  const isGuidedFinished = mode === 'guided' && totalStrokes > 0 && currentGuidedIdx >= totalStrokes;

  useEffect(() => {
    setIsDrawing(false);
    setActivePoints([]);
    setGuidedCompletedStrokes([]);
    setGuidedAccuracies([]);
    setFreeStrokes([]);
    setFeedback(null);
    setFreeScore(null);
    setInspectedStrokeIdx(null);
    setAnimStrokeIdx(0);
    setAnimProgress(0);
    setIsPlaying(true);
  }, [decomposed.char]);

  useEffect(() => {
    if (!isPlaying || totalStrokes === 0) return;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const stroke = strokes[animStrokeIdx];
      const baseDuration = stroke ? Math.max(0.55, Math.min(1.25, stroke.length / 70)) : 0.8;
      const duration = baseDuration / speed;

      setAnimProgress((prev) => {
        const next = prev + dt / duration;
        if (next >= 1) {
          if (inspectedStrokeIdx !== null) {
            setIsPlaying(false);
            return 1;
          }
          if (animStrokeIdx + 1 < totalStrokes) {
            setAnimStrokeIdx((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 1;
          }
        }
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, animStrokeIdx, totalStrokes, strokes, speed, inspectedStrokeIdx]);

  const handlePlayAll = useCallback(() => {
    setInspectedStrokeIdx(null);
    setAnimStrokeIdx(0);
    setAnimProgress(0);
    setIsPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (animStrokeIdx >= totalStrokes - 1 && animProgress >= 1) {
      handlePlayAll();
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying, animStrokeIdx, totalStrokes, animProgress, handlePlayAll]);

  const handleReplaySingleStroke = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalStrokes) return;
      setInspectedStrokeIdx(idx);
      setAnimStrokeIdx(idx);
      setAnimProgress(0);
      setIsPlaying(true);
    },
    [totalStrokes]
  );

  const handleClear = useCallback(() => {
    setActivePoints([]);
    setGuidedCompletedStrokes([]);
    setGuidedAccuracies([]);
    setFreeStrokes([]);
    setFeedback(null);
    setFreeScore(null);
  }, []);

  const handleUndo = useCallback(() => {
    setFeedback(null);
    setFreeScore(null);
    if (mode === 'guided') {
      setGuidedCompletedStrokes((prev) => prev.slice(0, -1));
      setGuidedAccuracies((prev) => prev.slice(0, -1));
    } else {
      setFreeStrokes((prev) => prev.slice(0, -1));
    }
  }, [mode]);

  const clientToSvgPoint = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (mode === 'guided' && isGuidedFinished) return;

    if (isPlaying) {
      setIsPlaying(false);
      setInspectedStrokeIdx(null);
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = clientToSvgPoint(e);
    setIsDrawing(true);
    setActivePoints([pt]);
    setFeedback(null);
    setFreeScore(null);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const pt = clientToSvgPoint(e);
    setActivePoints((prev) => {
      if (prev.length === 0) return [pt];
      const last = prev[prev.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) < 0.7) return prev;
      return [...prev, pt];
    });
  };

  const finishStroke = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (activePoints.length < 2) {
      setActivePoints([]);
      return;
    }

    if (mode === 'guided') {
      const target = strokes[currentGuidedIdx];
      if (!target) {
        setActivePoints([]);
        return;
      }

      const result = evaluateGuidedStroke(activePoints, target);
      if (result.isMatch) {
        const nextStrokes = [
          ...guidedCompletedStrokes,
          { points: activePoints, matchedStrokeIndex: currentGuidedIdx },
        ];
        const nextAccs = [...guidedAccuracies, result.accuracy];
        setGuidedCompletedStrokes(nextStrokes);
        setGuidedAccuracies(nextAccs);
        setActivePoints([]);

        if (nextStrokes.length >= totalStrokes) {
          const avg = Math.round(nextAccs.reduce((a, b) => a + b, 0) / nextAccs.length);
          setFeedback({
            type: 'success',
            text: `Carattere completato! Precisione media ${avg}%`,
          });
          onSyllableComplete?.(avg);
        } else {
          setFeedback({
            type: 'success',
            text: `${result.message} (${result.accuracy}%)`,
          });
        }
      } else {
        setFeedback({
          type: 'error',
          text: result.message,
        });
        setActivePoints([]);
      }
    } else {
      setFreeStrokes((prev) => [...prev, { points: activePoints }]);
      setActivePoints([]);
    }
  };

  const handleEvaluateFree = () => {
    const res = evaluateFreehandCharacter(
      freeStrokes.map((s) => s.points),
      strokes
    );
    setFreeScore(res);
    if (res.accuracy >= 70) {
      onSyllableComplete?.(res.accuracy);
    }
  };

  const getStrokeColor = (stroke: RenderedStroke, fallback = '#1D4ED8') => {
    return colorByRole ? ROLE_COLORS[stroke.role] : fallback;
  };

  const animCursor = useMemo(() => {
    if (!isPlaying && animProgress === 0) return null;
    const s = strokes[animStrokeIdx];
    if (!s) return null;
    return interpolatePointOnStroke(s, animProgress);
  }, [isPlaying, animProgress, strokes, animStrokeIdx]);

  const activeTargetStroke = mode === 'guided' && !isGuidedFinished ? strokes[currentGuidedIdx] : null;

  const avgAccuracy =
    guidedAccuracies.length > 0
      ? Math.round(guidedAccuracies.reduce((a, b) => a + b, 0) / guidedAccuracies.length)
      : null;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-md flex flex-col gap-4">
      {/* Mode & Visual Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setMode('guided');
              setFreeScore(null);
              setFeedback(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'guided'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Modalità Guidata
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('free');
              setFeedback(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'free'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Calligrafia Libera
          </button>
        </div>

        {/* Ghost template visibility */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Traccia guida:</span>
          <div className="inline-flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
            {(
              [
                { id: 'strong', label: 'Forte' },
                { id: 'light', label: 'Leggera' },
                { id: 'hidden', label: 'Nascosta' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGhostLevel(opt.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  ghostLevel === opt.id
                    ? 'bg-slate-200 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Writing Paper (White Hanji sheet resting on dark slate studio desk) */}
      <div className="relative mx-auto w-full max-w-[440px] aspect-square bg-white rounded-xl border-2 border-slate-700 shadow-inner overflow-hidden select-none">
        {/* Top-left subtle counter overlay */}
        <div className="pointer-events-none absolute top-3 left-3.5 z-10 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200 font-mono-tabular">
          {mode === 'guided' ? (
            <span>
              Tratto {Math.min(currentGuidedIdx + (isGuidedFinished ? 0 : 1), totalStrokes)} /{' '}
              {totalStrokes}
            </span>
          ) : (
            <span>
              Tratti: {freeStrokes.length} / {totalStrokes}
            </span>
          )}
        </div>

        {/* Top-right quick icon toggles */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowNumbers((v) => !v)}
            title="Mostra o nascondi numeri e frecce dei tratti"
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              showNumbers
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-300 hover:text-slate-900'
            }`}
          >
            {showNumbers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            title="Mostra zone strutturali della sillaba"
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              showZones
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-slate-600 border-slate-300 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setColorByRole((v) => !v)}
            title="Colora i tratti per componente (Iniziale, Vocale, Finale)"
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              colorByRole
                ? 'bg-slate-200 text-slate-950 border-slate-300 font-semibold'
                : 'bg-white text-slate-500 border-slate-300 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className="w-full h-full touch-none cursor-crosshair block"
          aria-label={`Area di scrittura interattiva per ${decomposed.char}`}
        >
          {/* Won-go-ji Practice Grid */}
          <g stroke="#CBD5E1" strokeWidth="0.45" fill="none">
            <rect x="4" y="4" width="92" height="92" rx="2" strokeDasharray="1.5 1.5" />
            <line x1="50" y1="4" x2="50" y2="96" strokeDasharray="1.8 1.8" />
            <line x1="4" y1="50" x2="96" y2="50" strokeDasharray="1.8 1.8" />
            <line x1="4" y1="4" x2="96" y2="96" stroke="#E2E8F0" strokeWidth="0.35" />
            <line x1="96" y1="4" x2="4" y2="96" stroke="#E2E8F0" strokeWidth="0.35" />
          </g>

          {/* Optional Jamo Structural Zones */}
          {showZones && (
            <g fill="none" strokeWidth="0.6" strokeDasharray="1.5 1.2">
              {decomposed.boxes.initial && (
                <rect
                  x={decomposed.boxes.initial.x}
                  y={decomposed.boxes.initial.y}
                  width={decomposed.boxes.initial.w}
                  height={decomposed.boxes.initial.h}
                  rx="1.5"
                  stroke="#1D4ED8"
                  fill="#DBEAFE"
                  fillOpacity="0.45"
                />
              )}
              {decomposed.boxes.medial && (
                <rect
                  x={decomposed.boxes.medial.x}
                  y={decomposed.boxes.medial.y}
                  width={decomposed.boxes.medial.w}
                  height={decomposed.boxes.medial.h}
                  rx="1.5"
                  stroke="#DC2626"
                  fill="#FEE2E2"
                  fillOpacity="0.45"
                />
              )}
              {decomposed.boxes.final && (
                <rect
                  x={decomposed.boxes.final.x}
                  y={decomposed.boxes.final.y}
                  width={decomposed.boxes.final.w}
                  height={decomposed.boxes.final.h}
                  rx="1.5"
                  stroke="#0F766E"
                  fill="#CCFBF1"
                  fillOpacity="0.45"
                />
              )}
            </g>
          )}

          {/* Ghost Reference Template */}
          {ghostLevel !== 'hidden' && (
            <g
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={ghostLevel === 'strong' ? 0.28 : 0.14}
            >
              {strokes.map((s) => (
                <path
                  key={`ghost-${s.id}`}
                  d={s.d}
                  stroke={colorByRole ? getStrokeColor(s) : '#334155'}
                  strokeWidth="6.2"
                />
              ))}
            </g>
          )}

          {/* Animated Guide Playback Layer */}
          {(isPlaying || inspectedStrokeIdx !== null) && (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {strokes.map((s, idx) => {
                if (inspectedStrokeIdx !== null && idx !== inspectedStrokeIdx) {
                  return null;
                }
                if (idx < animStrokeIdx) {
                  return (
                    <path
                      key={`anim-done-${s.id}`}
                      d={s.d}
                      stroke={getStrokeColor(s)}
                      strokeWidth="5.2"
                      opacity="0.75"
                    />
                  );
                }
                if (idx === animStrokeIdx) {
                  const partialPtsCount = Math.max(
                    1,
                    Math.round(animProgress * (s.points.length - 1)) + 1
                  );
                  const partialD = pointsToSmoothSvg(s.points.slice(0, partialPtsCount));
                  return (
                    <g key={`anim-active-${s.id}`}>
                      <path
                        d={s.d}
                        stroke={getStrokeColor(s)}
                        strokeWidth="4.8"
                        strokeDasharray="1.8 2"
                        opacity="0.32"
                      />
                      <path
                        d={partialD}
                        stroke={getStrokeColor(s)}
                        strokeWidth="5.6"
                        opacity="0.96"
                      />
                    </g>
                  );
                }
                return null;
              })}
              {animCursor && isPlaying && (
                <g transform={`translate(${animCursor.x}, ${animCursor.y})`}>
                  <circle r="3.4" fill="#1D4ED8" fillOpacity="0.24" />
                  <circle r="1.9" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="0.6" />
                </g>
              )}
            </g>
          )}

          {/* Active Guided Target Stroke Prompt */}
          {mode === 'guided' && activeTargetStroke && !isPlaying && (
            <g>
              <path
                d={activeTargetStroke.d}
                fill="none"
                stroke={getStrokeColor(activeTargetStroke)}
                strokeWidth="4.2"
                strokeDasharray="2.2 2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
              <g
                transform={`translate(${activeTargetStroke.end.x}, ${activeTargetStroke.end.y}) rotate(${activeTargetStroke.endAngle})`}
              >
                <path
                  d="M -2.8 -1.8 L 0.8 0 L -2.8 1.8"
                  fill="none"
                  stroke={getStrokeColor(activeTargetStroke)}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <circle
                cx={activeTargetStroke.start.x}
                cy={activeTargetStroke.start.y}
                r="4.2"
                fill={getStrokeColor(activeTargetStroke)}
                fillOpacity="0.22"
              >
                <animate
                  attributeName="r"
                  values="3.2;5.2;3.2"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

          {/* Stroke Numbers & Start Dots */}
          {showNumbers && !isPlaying && (
            <g>
              {strokes.map((s, idx) => {
                const isDoneInGuided = mode === 'guided' && idx < currentGuidedIdx;
                if (isDoneInGuided) return null;
                const isActiveTarget = mode === 'guided' && idx === currentGuidedIdx;
                const badgeColor = getStrokeColor(s);
                return (
                  <g
                    key={`num-${s.id}`}
                    transform={`translate(${s.start.x}, ${s.start.y})`}
                    opacity={mode === 'guided' ? (isActiveTarget ? 1 : 0.5) : 0.82}
                  >
                    <circle
                      r={isActiveTarget ? '2.9' : '2.3'}
                      fill={isActiveTarget ? badgeColor : '#FFFFFF'}
                      stroke={badgeColor}
                      strokeWidth="0.65"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="2.7"
                      fontWeight="700"
                      fill={isActiveTarget ? '#FFFFFF' : badgeColor}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {idx + 1}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* User Drawn Completed Strokes */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {mode === 'guided' &&
              guidedCompletedStrokes.map((us, i) => (
                <path
                  key={`u-guided-${i}`}
                  d={pointsToSmoothSvg(us.points)}
                  stroke="#0F172A"
                  strokeWidth="5.4"
                />
              ))}
            {mode === 'free' &&
              freeStrokes.map((us, i) => (
                <path
                  key={`u-free-${i}`}
                  d={pointsToSmoothSvg(us.points)}
                  stroke="#0F172A"
                  strokeWidth="5.4"
                />
              ))}

            {activePoints.length > 0 && (
              <path
                d={pointsToSmoothSvg(activePoints)}
                stroke="#0F172A"
                strokeWidth="5.6"
                opacity="0.95"
              />
            )}
          </g>
        </svg>

        {/* Guided Completion Overlay Strip */}
        {isGuidedFinished && (
          <div className="absolute inset-x-3 bottom-3 bg-slate-900/95 text-white border border-emerald-500/60 rounded-lg px-3.5 py-2.5 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                Completato{avgAccuracy !== null ? ` · Precisione ${avgAccuracy}%` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Ripeti
              </button>
              {hasNextSyllable && onNextSyllable && (
                <button
                  type="button"
                  onClick={onNextSyllable}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{nextLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Coaching / Stroke Feedback Line */}
      <div className="mx-auto w-full max-w-[440px]">
        {feedback ? (
          <div
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-100'
                : feedback.type === 'error'
                ? 'bg-red-950/80 border-red-700 text-red-100'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        ) : freeScore ? (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-blue-700 bg-blue-950/80 text-blue-100 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{freeScore.message}</span>
            </div>
            <span className="font-mono-tabular font-semibold text-white shrink-0">
              {freeScore.accuracy}%
            </span>
          </div>
        ) : activeTargetStroke ? (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-200">
            <span>
              <strong className="text-white">
                Tratto {currentGuidedIdx + 1} ({ROLE_LABELS[activeTargetStroke.role]}):
              </strong>{' '}
              {activeTargetStroke.hint}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300">
            <span>Scrivi liberamente la sillaba sul foglio, poi premi Verifica.</span>
          </div>
        )}
      </div>

      {/* Playback & Canvas Toolbar */}
      <div className="mx-auto w-full max-w-[440px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleReplaySingleStroke(Math.max(0, animStrokeIdx - 1))}
            disabled={totalStrokes === 0}
            title="Ripeti tratto precedente"
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={totalStrokes === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pausa' : 'Anima tratti'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleReplaySingleStroke(Math.min(totalStrokes - 1, animStrokeIdx + 1))}
            disabled={totalStrokes === 0}
            title="Ripeti tratto successivo"
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSpeed((s) => (s === 0.7 ? 1 : s === 1 ? 1.5 : 0.7))}
            title="Velocità animazione"
            className="px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-mono-tabular font-medium transition-colors cursor-pointer"
          >
            {speed}x
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={
              mode === 'guided'
                ? guidedCompletedStrokes.length === 0
                : freeStrokes.length === 0
            }
            title="Annulla ultimo tratto"
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Annulla</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="Pulisci foglio"
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pulisci</span>
          </button>
          {mode === 'free' && (
            <button
              type="button"
              onClick={handleEvaluateFree}
              disabled={freeStrokes.length === 0}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Verifica</span>
            </button>
          )}
        </div>
      </div>

      {/* Clickable Stroke Sequence Strip */}
      <div className="mx-auto w-full max-w-[440px] pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Sequenza dei tratti (clicca un numero per animarlo)</span>
          <span className="font-mono-tabular text-slate-300">{totalStrokes} tratti</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {strokes.map((s, idx) => {
            const isCompleted = mode === 'guided' && idx < currentGuidedIdx;
            const isActiveAnim = isPlaying && animStrokeIdx === idx;
            const isCurrentTarget = mode === 'guided' && idx === currentGuidedIdx && !isPlaying;
            return (
              <button
                key={`step-chip-${s.id}`}
                type="button"
                onClick={() => handleReplaySingleStroke(idx)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  isActiveAnim
                    ? 'bg-blue-600 text-white border-blue-500'
                    : isCompleted
                    ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                    : isCurrentTarget
                    ? 'bg-slate-700 text-white border-blue-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className="font-mono-tabular font-semibold">{idx + 1}</span>
                <span className="font-kr">{s.jamoChar}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
