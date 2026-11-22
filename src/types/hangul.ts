export type StageId = 'letters' | 'syllables' | 'words' | 'custom';

export type JamoRole = 'initial' | 'medial' | 'final';

export type VowelOrientation = 'vertical' | 'horizontal' | 'compound';

export interface Point {
  x: number;
  y: number;
}

export interface LocalStrokeDef {
  /** Polyline points in normalized [0..1] x [0..1] Jamo box */
  points: Point[];
  /** Optional cubic/quadratic smooth flag */
  smooth?: boolean;
  /** Short Italian instruction for this stroke */
  hint: string;
}

export interface JamoInfo {
  char: string;
  name: string;
  romanization: string;
  soundIt: string;
  category: 'basic-vowel' | 'compound-vowel' | 'basic-consonant' | 'double-consonant' | 'double-final';
  orientation?: VowelOrientation;
  strokes: LocalStrokeDef[];
}

export interface RenderedStroke {
  id: string;
  index: number;
  jamoChar: string;
  role: JamoRole;
  /** SVG path string in 0..100 viewBox */
  d: string;
  /** Sampled polyline points in 0..100 space for evaluation & arrow computation */
  points: Point[];
  start: Point;
  end: Point;
  /** Angle in degrees at the end of the stroke for arrowhead */
  endAngle: number;
  /** Angle in degrees near the start for directional cue */
  startAngle: number;
  length: number;
  hint: string;
}

export interface DecomposedChar {
  char: string;
  isHangul: boolean;
  isSingleJamo: boolean;
  initial?: string;
  medial?: string;
  final?: string;
  orientation?: VowelOrientation;
  strokes: RenderedStroke[];
  boxes: {
    initial?: { x: number; y: number; w: number; h: number };
    medial?: { x: number; y: number; w: number; h: number };
    final?: { x: number; y: number; w: number; h: number };
  };
}

export interface StudyItem {
  id: string;
  hangul: string;
  romanization: string;
  meaningIt: string;
  phoneticIt?: string;
  category: string;
  stage: StageId;
  notes?: string;
  isCustom?: boolean;
  createdAt?: number;
}

export interface UserDrawnStroke {
  points: Point[];
  /** Optional width profile for brush feel */
  widths?: number[];
  matchedStrokeIndex?: number;
}

export interface MasteryRecord {
  completions: number;
  lastPracticedAt: number;
  bestAccuracy: number;
}
