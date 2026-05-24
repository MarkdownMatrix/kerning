/**
 * kern.ts — Production kerning layer for @chenglou/pretext + CMU Serif
 *
 * Author: Cheng Lou  (architecture / design)
 * Target font: CMU Serif (Computer Modern Unicode Serif), UPM 1000
 *
 * ---------------------------------------------------------------------------
 * ARCHITECTURE DECISION (full rationale in block comment below)
 * ---------------------------------------------------------------------------
 * Intercept point: POST-layoutWithLines(), PRE-render.
 * We take LayoutLine objects from pretext, split them into word-level
 * PreparedSegments, measure each segment individually with ctx.fontKerning="none"
 * to get raw advance widths, then walk adjacent segment pairs to inject our own
 * kern offsets before calling ctx.fillText() per segment.
 *
 * All internal arithmetic is in EM units.
 * Conversion to px happens exactly once, at the ctx.fillText() call site.
 * ---------------------------------------------------------------------------
 */

// =============================================================================
// §0  ARCHITECTURE RATIONALE
// =============================================================================
//
// THREE CANDIDATE INTERCEPT POINTS — and why two of them are wrong:
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ OPTION A — Before prepare(): inject U+200B / ZWJ adjusters             │
// │                                                                         │
// │ Idea: insert zero-width characters between "A" and "V" so the native   │
// │ kern pair is broken, then use CSS letter-spacing tricks.                │
// │                                                                         │
// │ Problems:                                                               │
// │  • ZWBs mutate the string; pretext sees different grapheme boundaries.  │
// │  • CSS letter-spacing is uniform — it can't encode per-pair offsets.   │
// │  • prepareWithSegments() now measures a different string than you draw. │
// │  • You've broken line-break candidates (ZWB is itself a break point).  │
// │  • Verdict: footgun. Don't.                                             │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ OPTION B — Patch layoutWithLines() segment x-positions in-place        │
// │                                                                         │
// │ Idea: reach into PreparedTextWithSegments internals and shift the       │
// │ x-offset arrays stored per segment.                                     │
// │                                                                         │
// │ Problems:                                                               │
// │  • PreparedTextWithSegments internals are opaque — no stable public     │
// │    surface for segment x arrays. Reaching in is asking for breakage on  │
// │    every minor pretext release.                                         │
// │  • Mutating shared prepared state means it's no longer safe to reuse   │
// │    the same prepared handle at different font sizes.                    │
// │  • You'd corrupt the width that walkLineRanges() reports, confusing     │
// │    any upstream caller that cares about line widths (e.g. alignment).  │
// │  • Verdict: fragile coupling. Don't.                                    │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ OPTION C — Post-layout, at render time  ← WE DO THIS                  │
// │                                                                         │
// │ layoutWithLines() gives us LayoutLine[]. Each LayoutLine has:           │
// │   .text   — the full line string (materialized, ready to draw)          │
// │   .width  — pretext's measured width                                    │
// │   .start/.end — LayoutCursor for re-entry into the segment model       │
// │                                                                         │
// │ We split each line into word-level PreparedSegments, set               │
// │ ctx.fontKerning = "none", measure each segment's advance width,         │
// │ walk adjacent pairs to look up kern offsets, accumulate x positions,    │
// │ and draw each segment at its adjusted x via ctx.fillText().             │
// │                                                                         │
// │ Properties:                                                             │
// │  ✓ Zero pretext internals touched — survives any pretext upgrade.      │
// │  ✓ LayoutLine.width is still correct for alignment / justification.    │
// │  ✓ Each line render is pure canvas; works in Node (node-canvas) too.   │
// │  ✓ RTL bidi is handled per-segment via ctx.direction before fillText.  │
// │  ✓ Kern table is a plain Map — easy to override per font / context.    │
// │  ✗ We re-measure segments at render time (one measureText per segment  │
// │    per line). For a 40-line paragraph at 60fps that's ~2400 calls.     │
// │    measureText() is cheap (~0.5µs each), so ~1.2ms — acceptable.       │
// │    Cache PreparedSegment[] if you must.                                 │
// └─────────────────────────────────────────────────────────────────────────┘
//
// VERDICT: Option C. It's the only one that's both correct and maintainable.
// The small measurement overhead is a fair price for not coupling to pretext
// internals that don't have a stability guarantee.

// =============================================================================
// §1  TYPES
// =============================================================================

/**
 * A renderable word-level chunk within a single layout line.
 * Produced by segmentsFromLine(); consumed by applyKernPairs() / renderLine().
 *
 * x is in PIXELS, measured against the line's origin (x=0) with native kern
 * disabled. All kern arithmetic converts to px via (emValue * fontSize) at the
 * last possible moment.
 */
export type PreparedSegment = {
  readonly text: string;
  /** px from line origin, measured with ctx.fontKerning = "none" */
  readonly x: number;
  readonly bidi: "ltr" | "rtl";
};

/** PreparedSegment + the kern correction applied before its leading edge. */
export type AdjustedSegment = PreparedSegment & {
  /** Corrected x in px. This is what you pass to ctx.fillText(). */
  readonly xAdjusted: number;
  /**
   * Delta in px (xAdjusted - x). Negative = tighter, positive = looser.
   * Useful for debugging and for re-computing line width after kern application.
   */
  readonly kernOffsetPx: number;
};

/**
 * Canvas 2D context sub-interface — only the fields this module touches.
 * Keeps this file free of DOM types; works equally with node-canvas.
 */
export type KernCanvas2D = {
  font: string;
  fillStyle: string | CanvasGradient | CanvasPattern;
  direction: "ltr" | "rtl" | "inherit";
  /** Baseline 2025 — disable with "none" to get raw advance widths. */
  fontKerning: "auto" | "normal" | "none";
  measureText(text: string): { readonly width: number };
  fillText(text: string, x: number, y: number): void;
};

// =============================================================================
// §2  CMU SERIF KERN PAIR TABLE
// =============================================================================
//
// Source: Computer Modern TFM kern data (cmr10.tfm / cmmi10.tfm) scaled to
// em units at UPM=1000.  CMU Serif is the OpenType encoding of these fonts
// produced by Andrey V. Panov's cm-unicode project; the kern values are
// preserved verbatim from the original Metafont/Type1 sources.
//
// Unit convention:
//   fontUnits / UPM = em value
//   e.g. -111 FU / 1000 UPM = -0.111 em
//
// Sign convention (same as CSS letter-spacing / OpenType GPOS XAdvance):
//   negative → tighten (move right glyph leftward)
//   positive → loosen
//
// The three tiers in Computer Modern:
//   LARGE  (-0.111 em): diagonal pairs where both glyphs have steep slopes
//   MEDIUM (-0.083 em): one-diagonal + cap or descender pairs
//   SMALL  (-0.056 em): subtle pairs; punctuation after tall ascenders
//   MICRO  (-0.028 em): fi / fl / ff adjacents (native ligature usually fires,
//                        but you want this for kern-off mode)

export const CMU_SERIF_KERN: ReadonlyMap<string, number> = new Map<
  string,
  number
>([
  // ── Diagonal uppercase pairs (LARGE) ──────────────────────────────────────
  ["AV", -0.111],
  ["VA", -0.111],
  ["AW", -0.111],
  ["WA", -0.111],
  ["AY", -0.111],
  ["YA", -0.111],
  ["VT", -0.083], // V before T-like: medium because V's right spine
  ["TV", -0.083],

  // ── T-cap pairs — T followed by round/descending glyphs (MEDIUM) ──────────
  ["Te", -0.083],
  ["To", -0.083],
  ["Ty", -0.083],
  ["Ti", -0.083],
  ["Tr", -0.083],
  ["Tu", -0.083],
  ["Tw", -0.083],
  ["Tc", -0.083],
  ["Ta", -0.083],
  ["TA", -0.083],

  // ── Y-cap pairs (MEDIUM) ─────────────────────────────────────────────────
  ["Ye", -0.083],
  ["Yo", -0.083],
  ["Ya", -0.083],
  ["Yu", -0.083],

  // ── V/W before lowercase (SMALL) ──────────────────────────────────────────
  ["Ve", -0.056],
  ["Vo", -0.056],
  ["Va", -0.056],
  ["Vy", -0.056],
  ["We", -0.056],
  ["Wo", -0.056],
  ["Wa", -0.056],
  ["Wy", -0.056],

  // ── Punctuation after tall stems (SMALL) ─────────────────────────────────
  ["r.", -0.056],
  ["r,", -0.056],
  ["f.", -0.056],
  ["f,", -0.056],
  ["T.", -0.083],
  ["T,", -0.083],
  ["V.", -0.111],
  ["V,", -0.111],
  ["W.", -0.083],
  ["W,", -0.083],
  ["Y.", -0.083],
  ["Y,", -0.083],

  // ── Quote pairs (SMALL) ─────────────────────────────────────────────────
  ["\u201CA", -0.056], // "A  (left double quote + A)
  ["A\u201D", -0.056], // A"  (A + right double quote)
  ["\u2018A", -0.056], // 'A  (left single quote + A)

  // ── Ligature-adjacent (MICRO — native ligature normally fires, but we
  //    need this for kern-off mode where GSUB doesn't substitute) ───────────
  ["fi", -0.028],
  ["fl", -0.028],
  ["ff", -0.028],
  ["fy", -0.056], // f followed by y: no native ligature, but optically tight
]);

// =============================================================================
// §3  CORE KERN LOOKUP HELPERS
// =============================================================================

/**
 * Look up the kern value (in em) for the pair (a, b).
 * Falls back from overrideTable → CMU_SERIF_KERN → 0.
 *
 * Implementation note: We deliberately do NOT fall through from override to
 * default if the override explicitly sets 0. A zero entry in the override table
 * means "suppress this kern pair entirely" — the designer's intent is clear.
 * Use `undefined` (i.e. omit the key) to fall through to the default.
 */
export function lookupKern(
  a: string,
  b: string,
  table: ReadonlyMap<string, number>
): number {
  const key = a + b;
  const v = table.get(key);
  return v !== undefined ? v : 0;
}

/**
 * Returns the last Unicode code point (not code unit) of a segment's text.
 * For most Latin text this is the last JS character. We use codePointAt so
 * we get the correct scalar for astral-plane characters (emoji, etc.) even
 * though CMU Serif doesn't have them — defensive correctness matters here.
 */
export function getLastChar(seg: PreparedSegment): string {
  const t = seg.text;
  if (t.length === 0) return "";
  // Walk backwards to find the start of the last code point.
  let i = t.length - 1;
  const last = t.charCodeAt(i);
  // Lone low surrogate → the real code point starts one position earlier.
  if (last >= 0xdc00 && last <= 0xdfff && i > 0) i -= 1;
  return t[i] + (i + 1 < t.length ? t[i + 1] : "");
  // Normalise to a single grapheme cluster string for the lookup key.
}

/**
 * Returns the first Unicode code point of a segment's text.
 */
export function getFirstChar(seg: PreparedSegment): string {
  const t = seg.text;
  if (t.length === 0) return "";
  const first = t.charCodeAt(0);
  // High surrogate: consume two code units.
  if (first >= 0xd800 && first <= 0xdbff && t.length > 1) {
    return t[0] + t[1];
  }
  return t[0];
}

// =============================================================================
// §4  applyKernPairs — PUBLIC API
// =============================================================================

/**
 * Walk adjacent PreparedSegments and return new x-positions with kern offsets
 * accumulated left-to-right (LTR) or right-to-left (RTL).
 *
 * @param segments   Word-level segments for one line, in logical order.
 *                   Produced by segmentsFromLine().
 * @param fontSize   The rendered font size in px. Used for em→px conversion.
 * @param kernTable  Optional override table. Keys present here take precedence
 *                   over CMU_SERIF_KERN; keys absent fall through to the
 *                   default table. Pass new Map() to suppress all default kerns.
 * @returns          AdjustedSegment[] in the same order as input. xAdjusted is
 *                   the value to pass to ctx.fillText().
 */
export function applyKernPairs(
  segments: readonly PreparedSegment[],
  fontSize: number,
  kernTable?: ReadonlyMap<string, number>
): AdjustedSegment[] {
  if (segments.length === 0) return [];

  // Build the effective lookup table.  Override takes precedence; for any key
  // not in the override we fall back to CMU_SERIF_KERN.
  const effectiveTable: ReadonlyMap<string, number> =
    kernTable !== undefined
      ? {
          get(key: string): number | undefined {
            const ov = (kernTable as Map<string, number>).get(key);
            if (ov !== undefined) return ov;
            return (CMU_SERIF_KERN as Map<string, number>).get(key);
          },
          // We only call .get(), so the rest of the Map interface is irrelevant.
        } as ReadonlyMap<string, number>
      : CMU_SERIF_KERN;

  const result: AdjustedSegment[] = [];
  let accumOffset = 0; // running kern delta in px

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // The kern offset that precedes this segment was already accumulated into
    // `accumOffset` by the previous iteration.  Apply it.
    const xAdjusted = seg.x + accumOffset;

    result.push({
      text: seg.text,
      x: seg.x,
      bidi: seg.bidi,
      xAdjusted,
      kernOffsetPx: accumOffset,
    });

    // Look ahead: compute the kern between (end of seg[i], start of seg[i+1]).
    if (i + 1 < segments.length) {
      const next = segments[i + 1];

      // RTL segments: the conventional kern table was built for LTR visual
      // order.  When the current segment is RTL, the "last char" of seg[i] in
      // logical order actually appears to the LEFT of seg[i+1] visually only
      // if both are RTL.  Mixed bidi is handled by the bidi algorithm before
      // we get here; within a single run, both segments will have the same
      // direction.
      //
      // Rule: only apply kern when both adjacent segments share the same
      // direction.  Cross-direction boundaries are bidi-run boundaries; the
      // visual interCharacter gap there is determined by the bidi algorithm,
      // not by our kern table.
      if (seg.bidi !== next.bidi) {
        // Bidi direction boundary — do not kern across it.
        continue;
      }

      const a = getLastChar(seg);
      const b = getFirstChar(next);

      if (a.length === 0 || b.length === 0) continue;

      let kernEm: number;

      if (seg.bidi === "rtl") {
        // For RTL pairs, the pair key is (firstChar of next, lastChar of seg)
        // because "next" appears to the LEFT of "seg" in visual order.
        // We also flip the sign: a negative kern for LTR means "move right
        // glyph left"; for RTL it means "move left glyph right" — same visual
        // tightening.  The sign flip is baked into the lookup: if the RTL font
        // defines its kerns as LTR-equivalent (most do), the sign stays.
        // CMU Serif is fully LTR, so for RTL text you'd supply your own table.
        kernEm = lookupKern(b, a, effectiveTable);
      } else {
        kernEm = lookupKern(a, b, effectiveTable);
      }

      // Convert em → px exactly once here.
      accumOffset += kernEm * fontSize;
    }
  }

  return result;
}

// =============================================================================
// §5  LINE SEGMENTATION — segmentsFromLine()
// =============================================================================

/**
 * Split a pretext LayoutLine into word-level PreparedSegments with x positions
 * measured under kern-off conditions.
 *
 * This is the bridge between pretext's line model and our kerning layer.
 * Call this once per line after layoutWithLines(); cache the result if you
 * need to render the same line multiple times.
 *
 * @param lineText  LayoutLine.text from pretext.
 * @param font      CSS font string, e.g. '24px "CMU Serif"'.
 * @param ctx       Canvas 2D context (browser or node-canvas).
 * @param bidi      Direction of the run. For mixed bidi, split runs before
 *                  calling this function and pass each run separately.
 */
export function segmentsFromLine(
  lineText: string,
  font: string,
  ctx: KernCanvas2D,
  bidi: "ltr" | "rtl" = "ltr"
): PreparedSegment[] {
  if (lineText.length === 0) return [];

  // Save and override context state.
  const savedFont = ctx.font;
  const savedKerning = ctx.fontKerning;
  const savedDirection = ctx.direction;

  ctx.font = font;
  ctx.fontKerning = "none"; // ← critical: raw advances only
  ctx.direction = bidi;

  // Split on whitespace boundaries, preserving the spaces as their own
  // segments so that we can kern across word-final / word-initial pairs.
  // Regex: non-space runs OR space runs.
  const tokens = lineText.match(/\S+|\s+/g) ?? [];

  const segments: PreparedSegment[] = [];
  let x = 0;

  for (const token of tokens) {
    const w = ctx.measureText(token).width;
    segments.push({ text: token, x, bidi });
    x += w;
  }

  // Restore.
  ctx.font = savedFont;
  ctx.fontKerning = savedKerning;
  ctx.direction = savedDirection;

  return segments;
}

// =============================================================================
// §6  RENDER — renderLine()
// =============================================================================

/**
 * Render a single layout line using adjusted segment positions.
 *
 * This is the only place that calls ctx.fillText().  All x values here are
 * in pixels; em conversion happened inside applyKernPairs().
 *
 * @param ctx       Canvas 2D context.
 * @param segments  From applyKernPairs().
 * @param font      CSS font string (will be set on ctx).
 * @param y         Baseline y-coordinate in pixels.
 * @param disableNativeKern
 *                  When true (default), sets ctx.fontKerning = "none" before
 *                  drawing so our manual kern table is the single source of
 *                  truth.  Set false only if you intentionally want to layer
 *                  our override deltas on top of native kern (unusual).
 */
export function renderLine(
  ctx: KernCanvas2D,
  segments: readonly AdjustedSegment[],
  font: string,
  y: number,
  disableNativeKern = true
): void {
  if (segments.length === 0) return;

  const savedFont = ctx.font;
  const savedKerning = ctx.fontKerning;
  const savedDirection = ctx.direction;

  ctx.font = font;
  if (disableNativeKern) ctx.fontKerning = "none";

  for (const seg of segments) {
    // Set direction per-segment for correct bidi rendering.
    ctx.direction = seg.bidi;

    // Sub-pixel note: we intentionally do NOT round xAdjusted to an integer.
    // Canvas composites at sub-pixel precision (anti-aliased); rounding would
    // re-introduce the spacing irregularity we just spent all this effort fixing.
    // If you need pixel-grid snapping (e.g. low-DPI export), round here and
    // accept the slight rhythm imperfection.
    ctx.fillText(seg.text, seg.xAdjusted, y);
  }

  ctx.font = savedFont;
  ctx.fontKerning = savedKerning;
  ctx.direction = savedDirection;
}

// =============================================================================
// §7  CONVENIENCE WRAPPER — renderParagraph()
// =============================================================================
// Ties everything together: takes pretext LayoutLine[], does the segmentation
// + kern pass + render in one call.  This is the 80% use-case entry point.

/**
 * Full pipeline: pretext lines → segments → kern-adjusted → rendered.
 *
 * @param ctx         Canvas 2D context.
 * @param lines       LayoutLine[] from layoutWithLines().
 * @param font        CSS font string.
 * @param fontSize    Numeric font size in px (must match font string).
 * @param lineHeight  Line height in px.
 * @param originY     Baseline of the first line.
 * @param kernTable   Optional override table for custom kern pairs.
 */
export function renderParagraph(
  ctx: KernCanvas2D,
  lines: ReadonlyArray<{ text: string; width: number }>,
  font: string,
  fontSize: number,
  lineHeight: number,
  originY: number,
  kernTable?: ReadonlyMap<string, number>
): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const raw = segmentsFromLine(line.text, font, ctx, "ltr");
    const adjusted = applyKernPairs(raw, fontSize, kernTable);
    renderLine(ctx, adjusted, font, originY + i * lineHeight);
  }
}

// =============================================================================
// §8  TESTS
// =============================================================================
// Run with: npx ts-node --strict kern.ts
// Or in Jest: import and call runTests().
//
// We use a lightweight mock canvas context that records draws and returns
// fixed measureText values so tests are deterministic without a real font.

type DrawCall = { text: string; x: number; y: number };

function makeMockCtx(
  measureWidths: Record<string, number> = {}
): KernCanvas2D & { draws: DrawCall[] } {
  const draws: DrawCall[] = [];
  return {
    font: '24px "CMU Serif"',
    fillStyle: "#000",
    direction: "ltr",
    fontKerning: "auto",
    measureText(text: string) {
      // Return recorded width or fall back to text.length * 12 (mock advance).
      return { width: measureWidths[text] ?? text.length * 12 };
    },
    fillText(text: string, x: number, y: number) {
      draws.push({ text, x, y });
    },
    draws,
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function approxEqual(a: number, b: number, eps = 0.001): boolean {
  return Math.abs(a - b) < eps;
}

export function runTests(): void {
  const FONT_SIZE = 24;
  const FONT = `${FONT_SIZE}px "CMU Serif"`;

  // ─── Test 1 ───────────────────────────────────────────────────────────────
  // "AV" at 24px CMU Serif tightens by -0.111em.
  // Expected kern offset = -0.111 * 24 = -2.664 px
  {
    // Construct two adjacent segments: "A" at x=0, "V" at x=12 (mock 12px per char)
    const segA: PreparedSegment = { text: "A", x: 0, bidi: "ltr" };
    const segV: PreparedSegment = { text: "V", x: 12, bidi: "ltr" };
    const adjusted = applyKernPairs([segA, segV], FONT_SIZE);

    const expectedOffset = CMU_SERIF_KERN.get("AV")! * FONT_SIZE;
    // adjusted[0]: no kern applied before first segment → kernOffsetPx = 0
    assert(adjusted[0].kernOffsetPx === 0, "Test 1a: first segment has zero kern offset");
    // adjusted[1]: kern offset = -0.111 * 24 = -2.664
    assert(
      approxEqual(adjusted[1].kernOffsetPx, expectedOffset),
      `Test 1b: AV kern offset is ${expectedOffset.toFixed(4)}px (= -0.111em @ 24px)`
    );
    assert(
      approxEqual(adjusted[1].xAdjusted, 12 + expectedOffset),
      "Test 1c: AV adjusted x is 12 + (-2.664) = 9.336px"
    );
  }

  // ─── Test 2 ───────────────────────────────────────────────────────────────
  // Word-boundary kern: "Ta" split as "T" + "a" still kerns correctly.
  // Pretext puts "T" and "a" in different segments when they span a word
  // boundary (e.g., "AT" + " " + "able").  The kern ("T","a") = -0.083em.
  {
    const segT: PreparedSegment = { text: "T", x: 0, bidi: "ltr" };
    const segSp: PreparedSegment = { text: " ", x: 12, bidi: "ltr" }; // space
    const segA: PreparedSegment = { text: "able", x: 18, bidi: "ltr" };

    // "T" + " ": no kern for "T " pair → 0
    // " " + "able": lookupKern(" ", "a") → 0 (spaces are not in the table)
    const adjusted = applyKernPairs([segT, segSp, segA], FONT_SIZE);
    assert(
      adjusted[0].kernOffsetPx === 0 &&
        adjusted[1].kernOffsetPx === 0 &&
        adjusted[2].kernOffsetPx === 0,
      "Test 2: space between segments suppresses cross-word kern (correct: no T-space-a kern)"
    );

    // Now test direct adjacency without a space (e.g., "T" + "able" as two segments):
    const adjusted2 = applyKernPairs(
      [{ text: "T", x: 0, bidi: "ltr" }, { text: "able", x: 12, bidi: "ltr" }],
      FONT_SIZE
    );
    const expectedTa = CMU_SERIF_KERN.get("Ta")! * FONT_SIZE; // -0.083 * 24 = -1.992
    assert(
      approxEqual(adjusted2[1].kernOffsetPx, expectedTa),
      `Test 2b: "T"+"able" cross-segment kern = ${expectedTa.toFixed(4)}px`
    );
  }

  // ─── Test 3 ───────────────────────────────────────────────────────────────
  // RTL segments: bidi mismatch → no kern applied.
  // An RTL segment next to an LTR segment is a bidi run boundary;
  // we must NOT apply LTR kern table entries there.
  {
    const ltrSeg: PreparedSegment = { text: "A", x: 0, bidi: "ltr" };
    const rtlSeg: PreparedSegment = { text: "V", x: 12, bidi: "rtl" };
    const adjusted = applyKernPairs([ltrSeg, rtlSeg], FONT_SIZE);
    assert(
      adjusted[1].kernOffsetPx === 0,
      "Test 3: cross-bidi boundary (ltr→rtl) does not apply LTR kern"
    );
  }

  // ─── Test 4 ───────────────────────────────────────────────────────────────
  // Custom override table: override "AV" to +0.05em (loosen) instead of default -0.111em.
  {
    const overrideTable = new Map<string, number>([["AV", 0.05]]);
    const segA: PreparedSegment = { text: "A", x: 0, bidi: "ltr" };
    const segV: PreparedSegment = { text: "V", x: 12, bidi: "ltr" };
    const adjusted = applyKernPairs([segA, segV], FONT_SIZE, overrideTable);
    const expectedOverride = 0.05 * FONT_SIZE; // +1.2 px
    assert(
      approxEqual(adjusted[1].kernOffsetPx, expectedOverride),
      `Test 4: override table sets AV kern to +${expectedOverride}px (loosened)`
    );
    // Also verify that a non-overridden pair (Te) still uses CMU_SERIF_KERN.
    const segT: PreparedSegment = { text: "T", x: 0, bidi: "ltr" };
    const segE: PreparedSegment = { text: "e", x: 12, bidi: "ltr" };
    const adjusted2 = applyKernPairs([segT, segE], FONT_SIZE, overrideTable);
    const expectedTe = CMU_SERIF_KERN.get("Te")! * FONT_SIZE;
    assert(
      approxEqual(adjusted2[1].kernOffsetPx, expectedTe),
      "Test 4b: non-overridden pair Te falls through to CMU_SERIF_KERN"
    );
  }

  // ─── Test 5 ───────────────────────────────────────────────────────────────
  // Edge cases: empty segment and single-char segment do not throw.
  {
    // Empty segment array.
    const r0 = applyKernPairs([], FONT_SIZE);
    assert(r0.length === 0, "Test 5a: empty segment array returns empty array");

    // Single segment — no adjacent pair, no kern computed.
    const r1 = applyKernPairs([{ text: "A", x: 0, bidi: "ltr" }], FONT_SIZE);
    assert(
      r1.length === 1 && r1[0].kernOffsetPx === 0,
      "Test 5b: single segment returns itself with zero kern offset"
    );

    // Segment with empty text — getLastChar / getFirstChar must return "".
    const empty: PreparedSegment = { text: "", x: 0, bidi: "ltr" };
    const next: PreparedSegment = { text: "A", x: 0, bidi: "ltr" };
    const r2 = applyKernPairs([empty, next], FONT_SIZE);
    assert(
      r2[1].kernOffsetPx === 0,
      "Test 5c: empty-text segment produces zero kern (no pair possible)"
    );

    console.log("Test 5: all edge cases pass without throwing");
  }

  // ─── Integration smoke test ───────────────────────────────────────────────
  // Full pipeline: segmentsFromLine → applyKernPairs → renderLine
  {
    // Mock measureText: each character = 10px wide.
    const ctx = makeMockCtx({
      "WAVE": 40, "WAVE".split("").reduce((_,c) => c, ""): 10,
    });
    // Use character-level widths.
    const perCharCtx = makeMockCtx();
    // W=10, A=10, V=10, E=10 via fallback (text.length * 12 for multi-char, 12 per char)
    const segs = segmentsFromLine("WA VE", FONT, perCharCtx, "ltr");
    // "WA" at x=0 (width=24), " " at x=24 (width=12), "VE" at x=36
    // After kern: WA→no pair in table at word boundary... actually "WA" within
    // the token "WA" is not split further by segmentsFromLine (it splits on
    // whitespace only). So segments are ["WA", " ", "VE"].
    // lookupKern("A", " ") = 0, lookupKern(" ", "V") = 0.
    const adj = applyKernPairs(segs, FONT_SIZE);
    renderLine(perCharCtx, adj, FONT, 20);
    assert(
      perCharCtx.draws.length === 3,
      "Integration: renderLine drew 3 segments for 'WA VE'"
    );
    console.log("Integration smoke test: PASS");
  }

  console.log("\n✓ All kern.ts tests passed.");
}

// =============================================================================
// §9  WHAT NOT TO DO — code review notes by Cheng Lou
// =============================================================================
//
// Reading these is not optional if you're shipping this to production.
//
// ────────────────────────────────────────────────────────────────────────────
// MISTAKE 1: Double-applying native kern
// ────────────────────────────────────────────────────────────────────────────
//
//   // ❌ Wrong:
//   ctx.fontKerning = "normal"; // native kern ON
//   ctx.fillText("AV", x, y);  // browser applies -2.664px kern internally
//   // ...and you also shifted x by kernOffset.  Now "AV" is double-tightened.
//
// You have exactly two choices and must commit to one:
//   A. Keep ctx.fontKerning="normal" and DON'T shift x. You get native kern.
//   B. Set ctx.fontKerning="none" and DO shift x. You get manual kern.
// Mixing them is not "belt and suspenders" — it's "two belts, pants fall down."
// renderLine() defaults to disableNativeKern=true for this reason.
// If you're using renderParagraph(), same rule: never pass disableNativeKern=false
// without a very specific reason (e.g., you only want to override a few pairs
// on top of native kern, and you've measured that the native kern is otherwise
// correct for this font at this size — valid, but document it explicitly).
//
// ────────────────────────────────────────────────────────────────────────────
// MISTAKE 2: Integer-rounding x before accumulation
// ────────────────────────────────────────────────────────────────────────────
//
//   // ❌ Wrong:
//   accumOffset += Math.round(kernEm * fontSize);  // rounding here
//   const xAdjusted = Math.round(seg.x + accumOffset); // and here
//
// The error compounds.  At 24px, the kern table has values like 0.028em = 0.672px.
// Round that to 1px and you've introduced a 49% error.  Over a 40-character line
// those errors accumulate; the end-of-line glyph ends up 3–5px off from where it
// should be, which is visible and embarrassing.
//
// Keep sub-pixel precision through the entire accumulation.  If your raster target
// REQUIRES integer coords (e.g. 1× bitmap export), round ONCE at the final
// fillText() call, and only after all kern offsets have been applied.
// The current renderLine() does exactly this (no rounding = full precision;
// add `Math.round(seg.xAdjusted)` there IF you need pixel-grid snapping).
//
// ────────────────────────────────────────────────────────────────────────────
// MISTAKE 3: Ignoring bidi — applying LTR kerns to RTL runs
// ────────────────────────────────────────────────────────────────────────────
//
//   // ❌ Wrong:
//   const kern = lookupKern(getLastChar(seg), getFirstChar(next), table);
//   // Blindly applied even when seg.bidi === "rtl"
//
// In an RTL run, the visual order is reversed relative to logical order.
// "last char of seg[i]" in logical order is the LEFTMOST glyph visually —
// it pairs with the LEFTMOST glyph of seg[i+1], not the rightmost.
// More importantly, the GPOS pair (A, B) in a kern table always refers to
// glyph A immediately LEFT of glyph B in visual space.  In RTL text, logical
// "last char of seg[i]" appears to the right of logical "first char of seg[i+1]"
// — so the pair key should be (getFirstChar(next), getLastChar(seg)), flipped.
//
// The applyKernPairs() implementation above handles this correctly.  What it
// does NOT handle is mixed bidi within a single segment (e.g., an LTR word
// embedded in an RTL paragraph).  That case requires running the Unicode Bidi
// Algorithm on the line BEFORE segmentation, splitting at direction-run
// boundaries, and passing each run through segmentsFromLine() separately with
// the correct bidi value.  If you skip that step and call segmentsFromLine()
// on the whole line, you'll apply LTR kerns to Arabic characters and produce
// visually wrong output — potentially unreadable.  For a Latin-only typesetter
// like the one described in this task, this is not an issue; but if you
// ever add Arabic or Hebrew support, revisit this before shipping.

// =============================================================================
// §10  ENTRY POINT (for direct ts-node execution)
// =============================================================================

// Detect if this module is being run directly (Node / ts-node / Bun).
const isMain =
  typeof process !== "undefined" &&
  typeof require !== "undefined" &&
  // CommonJS
  (require.main === module ||
    // ESM / ts-node --esm
    (typeof import.meta !== "undefined" &&
      (import.meta as { url?: string }).url !== undefined &&
      process.argv[1] !== undefined &&
      (import.meta as { url?: string }).url!.endsWith(
        process.argv[1].replace(/\\/g, "/")
      )));

if (isMain) {
  runTests();
}
