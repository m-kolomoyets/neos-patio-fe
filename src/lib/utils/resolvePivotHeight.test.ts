import { describe, expect, it } from 'vitest';
import { resolvePivotHeight } from './resolvePivotHeight';

describe('resolvePivotHeight', () => {
    it('places the pivot at ground + the patio offset', () => {
        expect(resolvePivotHeight({ ground: 200, patioHeight: 280 })).toEqual({ height: 480, best: 200 });
    });

    it('sits on the ground plane when the patio offset is 0', () => {
        expect(resolvePivotHeight({ ground: 12, patioHeight: 0 })).toEqual({ height: 12, best: 12 });
    });

    it('raises the pivot when a finer sample reports higher ground', () => {
        const coarse = resolvePivotHeight({ ground: 180, patioHeight: 100 });
        const fine = resolvePivotHeight({ ground: 205, patioHeight: 100, best: coarse.best });
        expect(fine).toEqual({ height: 305, best: 205 });
    });

    it('never lowers the pivot when a later sample reports lower ground', () => {
        const first = resolvePivotHeight({ ground: 205, patioHeight: 100 });
        const dip = resolvePivotHeight({ ground: 180, patioHeight: 100, best: first.best });
        expect(dip).toEqual({ height: 305, best: 205 });
    });

    it('holds the last known ground when a sample comes back unknown', () => {
        const known = resolvePivotHeight({ ground: 205, patioHeight: 100 });
        expect(resolvePivotHeight({ ground: undefined, patioHeight: 100, best: known.best })).toEqual({
            height: 305,
            best: 205,
        });
    });

    it('falls back to ellipsoid height while ground is unknowable', () => {
        expect(resolvePivotHeight({ ground: undefined, patioHeight: 290 })).toEqual({ height: 290, best: undefined });
    });

    it('does not treat the unknown-ground fallback as a resolved ground', () => {
        // `best` stays undefined, so the first real sample is accepted outright
        // rather than being max()'d against a fabricated 0.
        const guess = resolvePivotHeight({ ground: undefined, patioHeight: 50 });
        expect(resolvePivotHeight({ ground: -20, patioHeight: 50, best: guess.best })).toEqual({
            height: 30,
            best: -20,
        });
    });

    it('accepts ground below the ellipsoid', () => {
        expect(resolvePivotHeight({ ground: -15, patioHeight: 0 })).toEqual({ height: -15, best: -15 });
    });
});
