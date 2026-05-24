You are Cheng Lou, creator of @chenglou/pretext, world-class typography engineer
based in California. You have studied every version of the LaTeX microtype package
changelog, you know the difference between tracking and kerning at the metal-type
level (tracking was physically moving slugs apart on a compositing stick; kerning
was filing notches into them), and you understand why naive CSS letter-spacing
produces typographically incorrect results that would make Robert Bringhurst
physically uncomfortable. You write production TypeScript with zero handwaving.
let search online latest before actual implement step. 

---
## Context
The user is building a **production-grade web typesetter** with `@chenglou/pretext`
+ **CMU Serif**, completing the final piece of a five-component micro-typography
stack (Kerning → Optical Margin → Character Protrusion → Font Expansion → Tracking).
### What LaTeX tracking actually is
In metal type, **tracking** (also called letter-spacing or set-width adjustment)
means inserting equal amounts of space between every character in a run. LaTeX's
microtype implements it via `\textls[value]{text}` and the `tracking=true` option.
Three things make LaTeX tracking different from CSS `letter-spacing`:
**Difference 1 — trailing space removal:**
CSS `letter-spacing` adds space *after every character including the last one*,
which pushes the text visually rightward and misaligns the right edge. LaTeX removes
the tracking space after the last character of every word and every line. This is
not a minor detail — at 0.15em tracking, the last character of a line protrudes
0.15em beyond the intended right margin with naive CSS.
**Difference 2 — measurement feedback:**
When LaTeX tracks text, the wider spacing changes where line breaks occur. CSS
`letter-spacing` on a DOM element does affect layout width, but Pretext's
`prepare()` measures text using `ctx.measureText()` — which does NOT include
`letter-spacing` from CSS (canvas ignores CSS). You must include tracking in the
font measurement string or apply it manually as spacing between segments.
**Difference 3 — optical tracking compensation:**
LaTeX's microtype scales tracking amount with optical size. Small text (8pt) needs
more tracking for legibility; large display text (36pt+) needs less or none.
Tight tracking on display text (`\textls[-50]{CHAPTER}`) is a stylistic choice for
headings, never applied to body text.
### The four tracking use cases in real typography
1. **Small caps tracking** — small caps always need positive tracking (~+80 to +120
   units per 1000) to compensate for the reduced optical size. CMU Serif's small
   caps (`font-variant-caps: small-caps`) are true drawn small caps, not scaled
   capitals, but they still need tracking.
2. **Headline tracking** — display text (>24px) sometimes uses tight negative
   tracking (-20 to -40 units) for a modern editorial look. LaTeX uses this for
   chapter headings in many book classes.
3. **Spaced capitals / all-caps tracking** — all-caps runs need +60 to +100 units
   of tracking because capital letters were designed to sit next to lowercase;
   without tracking they appear cramped against each other.
4. **Optical size body tracking** — at 8–10px (footnotes, captions), +10 to +20
   units of tracking improves legibility by preventing letters from merging.
### What Pretext measures and what it misses
`ctx.measureText(text)` measures the text **as a single string** including all
internal font kerning. It does not know about your intended tracking. If you want
Pretext to lay out tracked text correctly (so line breaks happen at the right
places), you must either:
**Option A:** Manually insert `\u200B` (zero-width space) segments between
characters and measure each character individually, summing widths + tracking gap.
This gives Pretext correct segment widths but multiplies `prepare()` cost by
the number of characters.
**Option B:** Measure a sample string, compute `trackingPx = trackingEm × fontSize`,
and add `trackingPx × (charCount - 1)` to the measured width. Then pass an
adjusted `containerWidth` to `layoutWithLines()` that is slightly narrower by
the tracking overhang estimate. This is O(1) overhead and correct for uniform text.
**Option C:** Use CSS `letter-spacing` on a DOM element as the source of truth,
and bypass Pretext measurement entirely for tracked runs — letting the browser
do both measurement and rendering. Lose Pretext's performance advantage but gain
exact correctness for mixed tracked/untracked runs.
For CMU Serif body text with small caps and headline variants, Option B is the
correct tradeoff. Option A is correct for display headings where exact break
positions matter more than performance.
---
## Your task
Design and implement a **complete, production-ready tracking system** for
`@chenglou/pretext` + CMU Serif that integrates cleanly with the four previous
components. Deliver:
### 1. The metal-type tracking model (Cheng Lou design doc style)
Write 300 words explaining the **historical origin** of tracking in metal type
composition and why the "remove trailing space" rule is not a quirk but a
fundamental correctness requirement. Use a concrete example:
Given the word "SPACING" tracked at +100 units (1000 UPM) at 24px:
- Show the naive CSS result: total advance = `naturalWidth + 7 × trackingPx`
  (space after every character including 'G')
- Show the correct LaTeX result: total advance = `naturalWidth + 6 × trackingPx`
  (no trailing space after last character)
- Compute the pixel difference at 24px CMU Serif
- Explain why this difference matters for optical margin alignment (Prompt 2)
  and protrusion (Prompt 3) — they both depend on last-character position
### 2. Tracking unit system
LaTeX uses thousandths of an em (`\textls[100]` = 0.1em tracking). Define:
```ts
// Tracking values in thousandths of an em (LaTeX microtype convention)
// Positive = expand, Negative = tighten
type TrackingUnits = number  // e.g. 100 = 0.1em, -50 = -0.05em
export function trackingToPx(units: TrackingUnits, fontSize: number): number
// Returns: (units / 1000) × fontSize
// Example: trackingToPx(100, 24) → 2.4px
export function pxToTracking(px: number, fontSize: number): TrackingUnits
// Inverse: pxToTracking(2.4, 24) → 100
```
### 3. Optical size tracking table for CMU Serif
Write the complete tracking recommendation table for CMU Serif based on LaTeX
microtype defaults:
```ts
interface TrackingSpec {
  units: TrackingUnits     // in thousandths of em
  removeTrailingSpace: boolean  // always true for correct typography
  applyKerningAfter: boolean    // re-apply kern pairs after tracking (Prompt 1)
}
const CMU_SERIF_TRACKING: {
  body: Record<string, TrackingSpec>        // keyed by font size range
  smallCaps: TrackingSpec                   // fixed spec for small caps runs
  allCaps: TrackingSpec                     // fixed spec for all-caps runs
  headline: Record<string, TrackingSpec>   // keyed by font size range
} = {
  body: {
    '8-10':  { units: 20,  removeTrailingSpace: true, applyKerningAfter: true },
    '10-14': { units: 10,  removeTrailingSpace: true, applyKerningAfter: true },
    '14-24': { units: 0,   removeTrailingSpace: true, applyKerningAfter: false },
    '24+':   { units: -10, removeTrailingSpace: true, applyKerningAfter: false },
  },
  smallCaps: { units: 80,  removeTrailingSpace: true, applyKerningAfter: true },
  allCaps:   { units: 80,  removeTrailingSpace: true, applyKerningAfter: true },
  headline: {
    '24-36': { units: -20, removeTrailingSpace: true, applyKerningAfter: false },
    '36-60': { units: -40, removeTrailingSpace: true, applyKerningAfter: false },
    '60+':   { units: -60, removeTrailingSpace: true, applyKerningAfter: false },
  },
}
export function resolveTracking(
  fontSize: number,
  variant: 'body' | 'smallCaps' | 'allCaps' | 'headline'
): TrackingSpec
```
### 4. Measurement-correct tracking with Pretext (Option B implementation)
Write the full measurement correction layer:
```ts
export interface TrackedMeasurement {
  naturalWidth: number       // what ctx.measureText() returns
  trackingGapPx: number      // per-character gap in px
  trackedWidth: number       // naturalWidth + (charCount - 1) × trackingGapPx
  charCount: number          // Unicode-safe character count
  adjustedContainerWidth: number  // containerWidth shrunk to account for tracking
}
export function measureTracked(
  text: string,
  fontString: string,
  fontSize: number,
  trackingUnits: TrackingUnits,
  containerWidth: number,
  ctx: CanvasRenderingContext2D
): TrackedMeasurement
```
Then write `prepareTracked()` that feeds the adjusted container width to Pretext:
```ts
export function prepareTracked(
  text: string,
  fontString: string,
  fontSize: number,
  trackingSpec: TrackingSpec,
  containerWidth: number,
  ctx: CanvasRenderingContext2D
): {
  prepared: PreparedText           // from pretext prepare()
  adjustedContainerWidth: number   // to pass to layoutWithLines()
  trackingGapPx: number            // to use at render time
}
```
Explain in inline comments why `adjustedContainerWidth` is
`containerWidth - trackingGapPx` (not `containerWidth / factor`) — the tracking
gap on the last character of each line must be subtracted from available measure
because we will NOT render it (trailing space removal rule).
### 5. Render-time tracking with trailing space removal
Write the core render function:
```ts
export function renderTrackedLine(
  ctx: CanvasRenderingContext2D,
  line: { text: string; x: number },
  trackingGapPx: number,
  baseY: number,
  removeTrailingSpace: boolean
): void
```
Implementation must:
**Step 1 — character-by-character rendering with accumulated x offset:**
```ts
const chars = [...line.text]  // surrogate-safe spread
let cursorX = line.x
chars.forEach((char, i) => {
  ctx.fillText(char, cursorX, baseY)
  const advance = ctx.measureText(char).width
  const isLast = i === chars.length - 1
  const isSpace = char === ' ' || char === '\u00A0'
  // Add tracking gap after every char EXCEPT:
  // - the last character of the line (trailing space removal)
  // - optionally: spaces themselves (LaTeX does not track word spaces)
  if (!isLast || !removeTrailingSpace) {
    if (!isSpace) {
      cursorX += advance + trackingGapPx
    } else {
      cursorX += advance  // word spaces: no extra tracking
    }
  }
}
```
Explain why word spaces receive no tracking gap — tracking is for letter-spacing
within words, not for word spacing. Adding tracking to spaces would compound with
any justification word-spacing from Prompt 4.
**Step 2 — kerning re-application:**
If `trackingSpec.applyKerningAfter === true`, after computing `cursorX` for each
character position, apply the kern pair lookup from Prompt 1. Write
`applyKernToTrackedCursor()` that adjusts `cursorX` by the kern offset for the
pair `(chars[i], chars[i+1])`.
Explain why kerning must come AFTER tracking offset is applied — if you kern
first then add tracking, the tracking gap disrupts the kern pair relationship
because the glyphs are no longer at their natural relative positions.
**Step 3 — ligature handling:**
CMU Serif has standard OpenType ligatures: fi fl ff ffi ffl. When tracking is
applied, ligatures should be **disabled** — tracked text should render each
letter separately, not merge into a ligature. Show how to disable ligatures
on the canvas context:
```ts
// Before tracking render:
const originalFont = ctx.font
ctx.font = ctx.font + ' ' // trigger re-parse (workaround)
// Actually: rebuild font string with liga=0
const trackedFontString = fontString.replace(
  /font-feature-settings:[^;]*/,
  'font-feature-settings: "kern" 1, "liga" 0, "clig" 0'
)
ctx.font = trackedFontString
// ... render tracked ...
ctx.font = originalFont
```
Explain why ligatures must be disabled during tracking: "fi" as a ligature is
a single glyph — you cannot insert a tracking gap between 'f' and 'i' if they
have been merged. LaTeX microtype does the same: `\textls` disables ligatures
within its argument.
### 6. Small caps integration
CMU Serif has **true drawn small caps** — not scaled capitals. Write:
```ts
export function renderSmallCapsTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number
): void
```
Steps:
1. Set `ctx.font` to CMU Serif with `font-variant: small-caps`
   (or use the dedicated CMU Serif SC font face if loaded)
2. Resolve tracking: `resolveTracking(fontSize, 'smallCaps')` → +80 units
3. Call `renderTrackedLine()` with the small caps font context
4. Re-enable ligatures after (small caps text may have its own ligature pairs)
Explain why small caps tracking (+80 units) is non-negotiable: without it,
small caps text appears cramped and looks like a typographic error rather than
a deliberate stylistic choice. Show a before/after comparison in ASCII:
```
Without tracking: SMALL CAPS TEXT ← letters touching, looks like mistake
With +80 units:   S M A L L  C A P S  T E X T ← airy, authoritative
```
### 7. All-caps run detection and auto-tracking
Write `detectAndTrackAllCaps()` that scans `line.text` for runs of 3+ consecutive
uppercase letters and auto-applies tracking:
```ts
export function detectAllCapsRuns(text: string): Array<{
  start: number  // character index
  end: number
  text: string
}>
export function renderWithAutoTracking(
  ctx: CanvasRenderingContext2D,
  line: { text: string; x: number },
  fontSize: number,
  baseY: number
): void
// Renders mixed tracked/untracked segments:
// normal text → no tracking (body 14-24 = 0 units)
// ALL CAPS runs → +80 units tracking automatically
// small-caps spans → +80 units (detected via font-variant)
```
### 8. Full pipeline integration
Extend the `typeset()` orchestrator to include tracking as the final stage:
```ts
export async function typeset(
  text: string,
  containerWidth: number,
  fontSize: number,
  lineHeight: number,
  ctx: CanvasRenderingContext2D,
  options?: {
    kerning?: boolean           // Prompt 1: kern pair table
    opticalMargin?: boolean     // Prompt 2: hanging punctuation
    protrusion?: boolean        // Prompt 3: character protrusion
    expansion?: boolean         // Prompt 4: hz font expansion
    tracking?: boolean          // Prompt 5: letter-spacing ← new
    trackingVariant?: 'body' | 'smallCaps' | 'allCaps' | 'headline'
    trackingOverride?: TrackingUnits  // manual override, bypasses table
  }
): Promise<TypesetResult>
```
Show the **exact composition order** of all five systems at render time:
```
For each line:
  1. Resolve kern pairs            (Prompt 1) → adjusted segment x positions
  2. Apply optical margin shift    (Prompt 2) → adjusted line.x origin
  3. Apply character protrusion    (Prompt 3) → further adjusted line.x + measure
  4. Apply font expansion scale    (Prompt 4) → ctx.scale(expansionFactor, 1)
  5. Render with tracking gaps     (Prompt 5) → char-by-char with gap + trailing removal
```
Explain why tracking must be **last** in render order: tracking renders
character-by-character, so it naturally consumes the x positions already
corrected by all previous stages. Inserting tracking earlier would require
re-propagating its width changes through protrusion and expansion calculations.
Write `TypesetResult`:
```ts
export interface TypesetResult {
  lines: TypesetLine[]
  totalHeight: number
  paragraphWidth: number
  metrics: {
    avgExpansionFactor: number    // from Prompt 4
    hyphenCount: number           // lines ending in hyphen
    trackingApplied: TrackingUnits
    protrusionLines: number       // lines with non-zero protrusion
    opticalMarginLines: number    // lines with hanging punctuation
  }
}
export interface TypesetLine {
  text: string
  x: number                  // final render x (after all adjustments)
  y: number
  expansionFactor: number    // from Prompt 4
  trackingGapPx: number      // from Prompt 5
  leftProtrudeAmount: number // from Prompt 3
  kernAdjustments: number[]  // per-segment kern offsets from Prompt 1
}
```
### 9. Visual regression test for tracking
Write `assertTrackingCorrectness(ctx, lines, trackingGapPx, fontSize)` that:
- Renders two versions of the same line to offscreen canvases:
  version A = `renderTrackedLine()` with trailing space removal
  version B = CSS `letter-spacing: ${trackingGapPx}px` on a DOM span
- Compares rightmost ink pixel of each:
  - Version A rightmost ink should be ≤ version B rightmost ink (A never protrudes)
  - The difference should equal approximately `trackingGapPx ± 0.5px`
    (the trailing space that CSS adds but LaTeX removes)
- Returns `{ trailingSpaceRemoved: boolean; differencePixels: number }`
This test **proves** that your implementation removes trailing space correctly,
which is the single most common bug in web tracking implementations.
### 10. What NOT to do
Write 6 code review comments as Cheng Lou reviewing a junior's implementation that:
- Set `ctx.letterSpacing = '0.1em'` directly and called it done — canvas
  `letterSpacing` was only added in Chrome 99 / Safari 16.4, and it adds trailing
  space after the last character, breaking optical margin alignment from Prompt 2
- Tracked word spaces along with letters — word spacing and letter-spacing are
  orthogonal axes in typography; tracking word spaces compounds with justification
  word-spacing from Prompt 4 and produces rivers of white
- Left ligatures enabled during tracking — "fi" ligature is one glyph, you cannot
  insert a gap inside it; the text renders with inconsistent spacing where ligatures
  occur vs where they don't
- Applied tracking before kerning — kern pairs are defined for glyphs at natural
  spacing; once you add tracking gaps, the kern table values are no longer valid
  for the new inter-glyph distances
- Used `text.length` instead of `[...text].length` for character count — "fi"
  ligature precomposed, emoji, and any non-BMP character counts as 2 in
  `text.length` but 1 in `[...text].length`; tracking gap count is off by N
- Did not disable ligatures for small caps tracked runs — CMU Serif SC has its
  own ligature set; with tracking enabled these ligatures merge letters that should
  be visually separated, and at +80 units the merged glyph looks like a mistake
---
## Constraints
- TypeScript strict mode, no `any`
- Unicode-safe: `[...text]` spread everywhere for character iteration and counting
- CMU Serif + CMU Serif SC (small caps variant) loaded via `FontFace` API
- Ligatures (`liga`, `clig`) disabled on canvas context during tracked rendering
- `ctx.letterSpacing` NOT used — implement character-by-character manually for
  correctness and browser compatibility (Firefox still lacks `ctx.letterSpacing`)
- Trailing space removal: enforced unconditionally — never an option to skip
- Word spaces: no tracking gap added — tracking is letter-spacing only
- `resolveTracking()` called once per paragraph, not per character
- Measurement cache from Prompt 3 extended to include tracking variants:
  key format `${char}::${fontString}::${fontSize}::${trackingUnits}`
- Full `typeset()` orchestrator composes all five prompts in correct order with
  zero mutation conflicts between stages
- `TypesetResult.metrics` must be populated accurately — these numbers are used
  to compare output quality against LaTeX reference renders
- Zero `// TODO` placeholders — every function fully implemented and
  copy-paste runnable
