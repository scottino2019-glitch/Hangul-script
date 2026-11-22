import { Point, RenderedStroke } from '../types/hangul';

export interface StrokeEvalResult {
  isMatch: boolean;
  reason: 'ok' | 'too-short' | 'wrong-start' | 'reversed' | 'off-path';
  message: string;
  accuracy: number;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function polylineLength(pts: Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += dist(pts[i - 1], pts[i]);
  }
  return len;
}

export function resamplePoints(pts: Point[], count = 32): Point[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: count }, () => ({ ...pts[0] }));

  const totalLen = polylineLength(pts);
  if (totalLen < 1e-4) {
    return Array.from({ length: count }, () => ({ ...pts[0] }));
  }

  const step = totalLen / (count - 1);
  const out: Point[] = [{ ...pts[0] }];
  let accumulated = 0;
  let prev = pts[0];

  for (let i = 1; i < pts.length; i++) {
    let curr = pts[i];
    let segLen = dist(prev, curr);

    while (accumulated + segLen >= step && out.length < count) {
      const ratio = (step - accumulated) / (segLen || 1);
      const nx = prev.x + ratio * (curr.x - prev.x);
      const ny = prev.y + ratio * (curr.y - prev.y);
      const newPt = { x: nx, y: ny };
      out.push(newPt);
      prev = newPt;
      segLen = dist(prev, curr);
      accumulated = 0;
    }

    accumulated += segLen;
    prev = curr;
  }

  while (out.length < count) {
    out.push({ ...pts[pts.length - 1] });
  }

  return out;
}

/**
 * Evaluates a user-drawn stroke (in 0..100 SVG space) against a target RenderedStroke.
 * Generous enough for mouse/finger usability while enforcing correct stroke direction and shape.
 */
export function evaluateGuidedStroke(
  userPts: Point[],
  target: RenderedStroke
): StrokeEvalResult {
  const userLen = polylineLength(userPts);
  const minRequiredLen = Math.max(4, target.length * 0.36);

  if (userPts.length < 2 || userLen < minRequiredLen) {
    return {
      isMatch: false,
      reason: 'too-short',
      message: 'Tratto troppo corto: segui la linea guida fino alla freccia.',
      accuracy: 0,
    };
  }

  const userSampled = resamplePoints(userPts, 32);
  const targetSampled = resamplePoints(target.points, 32);

  const uStart = userSampled[0];
  const uEnd = userSampled[userSampled.length - 1];
  const tStart = targetSampled[0];
  const tEnd = targetSampled[targetSampled.length - 1];

  const isClosedLoop = dist(tStart, tEnd) < 8 && target.length > 40;
  const startTol = Math.max(18, Math.min(26, target.length * 0.48));

  // Check reversed stroke for non-loop strokes
  if (!isClosedLoop) {
    const forwardScore = dist(uStart, tStart) + dist(uEnd, tEnd);
    const reverseScore = dist(uStart, tEnd) + dist(uEnd, tStart);
    if (reverseScore + 10 < forwardScore && dist(uStart, tEnd) < startTol) {
      return {
        isMatch: false,
        reason: 'reversed',
        message: 'Direzione inversa: inizia dal punto numerato e segui la freccia.',
        accuracy: 25,
      };
    }
  }

  if (dist(uStart, tStart) > startTol) {
    return {
      isMatch: false,
      reason: 'wrong-start',
      message: 'Punto di partenza impreciso: inizia vicino al cerchio blu.',
      accuracy: 30,
    };
  }

  // Average & peak point-to-point distance between resampled curves
  // For closed loops (ㅇ), allow matching either orientation slightly better only if starting at top,
  // or check closest-point distance from user points to target path
  let sumDist = 0;
  let maxDist = 0;

  if (isClosedLoop) {
    for (const up of userSampled) {
      let best = Infinity;
      for (const tp of targetSampled) {
        const d = dist(up, tp);
        if (d < best) best = d;
      }
      sumDist += best;
      if (best > maxDist) maxDist = best;
    }
    // Also check coverage of target circle
    let uncovered = 0;
    for (const tp of targetSampled) {
      let best = Infinity;
      for (const up of userSampled) {
        const d = dist(up, tp);
        if (d < best) best = d;
      }
      if (best > 16) uncovered++;
    }
    const meanDist = sumDist / userSampled.length;
    if (meanDist > 14 || uncovered > 8) {
      return {
        isMatch: false,
        reason: 'off-path',
        message: 'Completa il cerchio seguendo la guida tratteggiata.',
        accuracy: Math.max(15, Math.round(100 - meanDist * 4)),
      };
    }
    const acc = Math.max(70, Math.min(100, Math.round(100 - meanDist * 2.4)));
    return {
      isMatch: true,
      reason: 'ok',
      message: acc >= 90 ? 'Tratto perfetto!' : 'Ottimo tratto!',
      accuracy: acc,
    };
  }

  // Sequential curve distance
  for (let i = 0; i < userSampled.length; i++) {
    const d = dist(userSampled[i], targetSampled[i]);
    sumDist += d;
    if (d > maxDist) maxDist = d;
  }

  // Also allow slight timing shift by computing symmetric nearest-neighbor mean distance
  let nnSum = 0;
  for (const up of userSampled) {
    let best = Infinity;
    for (const tp of targetSampled) {
      const d = dist(up, tp);
      if (d < best) best = d;
    }
    nnSum += best;
  }

  const seqMean = sumDist / userSampled.length;
  const nnMean = nnSum / userSampled.length;
  const endDist = dist(uEnd, tEnd);

  if (nnMean > 13.5 || seqMean > 22 || endDist > startTol + 6) {
    return {
      isMatch: false,
      reason: 'off-path',
      message: 'Tratto fuori guida: prova a seguire più da vicino il tracciato.',
      accuracy: Math.max(20, Math.round(100 - nnMean * 4)),
    };
  }

  const accuracy = Math.max(72, Math.min(100, Math.round(100 - nnMean * 2.5)));
  return {
    isMatch: true,
    reason: 'ok',
    message: accuracy >= 90 ? 'Tratto perfetto!' : 'Ben fatto!',
    accuracy,
  };
}

/**
 * Evaluates freehand strokes against all target strokes of a character.
 */
export function evaluateFreehandCharacter(
  userStrokes: Point[][],
  targetStrokes: RenderedStroke[]
): { accuracy: number; message: string } {
  if (userStrokes.length === 0 || targetStrokes.length === 0) {
    return { accuracy: 0, message: 'Disegna il carattere sul foglio prima di verificare.' };
  }

  const allUserPts = userStrokes.flat();
  const allTargetPts = targetStrokes.flatMap((s) => s.points);

  let userToTarget = 0;
  for (const up of allUserPts) {
    let best = Infinity;
    for (const tp of allTargetPts) {
      const d = dist(up, tp);
      if (d < best) best = d;
    }
    userToTarget += best;
  }
  const meanUserToTarget = userToTarget / Math.max(1, allUserPts.length);

  let targetToUser = 0;
  for (const tp of allTargetPts) {
    let best = Infinity;
    for (const up of allUserPts) {
      const d = dist(up, tp);
      if (d < best) best = d;
    }
    targetToUser += best;
  }
  const meanTargetToUser = targetToUser / Math.max(1, allTargetPts.length);

  const countPenalty = Math.abs(userStrokes.length - targetStrokes.length) * 6;
  const combinedError = (meanUserToTarget + meanTargetToUser) * 0.5;
  const rawScore = Math.round(100 - combinedError * 3.2 - countPenalty);
  const accuracy = Math.max(15, Math.min(100, rawScore));

  if (accuracy >= 85) {
    return { accuracy, message: 'Calligrafia eccellente e proporzionata!' };
  }
  if (accuracy >= 65) {
    return {
      accuracy,
      message:
        userStrokes.length !== targetStrokes.length
          ? `Buona forma! Nota che questo carattere usa ${targetStrokes.length} tratti.`
          : 'Buon risultato! Prova a bilanciare meglio gli spazi.',
    };
  }
  return {
    accuracy,
    message: 'Attiva leggermente la guida fantasma per affinare proporzioni e ordine dei tratti.',
  };
}
