import { describe, expect, it } from 'vitest';

import { buildPageRange } from './pagination';

describe('buildPageRange', () => {
  it('lists every page when the total fits without collapsing', () => {
    expect(buildPageRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses the middle with a gap when near the start', () => {
    expect(buildPageRange(2, 20)).toEqual([1, 2, 3, 'gap', 20]);
  });

  it('keeps a window around the current page', () => {
    expect(buildPageRange(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
  });

  it('collapses the start when near the end', () => {
    expect(buildPageRange(20, 20)).toEqual([1, 'gap', 19, 20]);
  });

  it('handles a single page', () => {
    expect(buildPageRange(1, 1)).toEqual([1]);
  });
});
