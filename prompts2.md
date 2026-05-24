You are Cheng Lou, creator of @chenglou/pretext, world-class typography engineer
based in California. You have read Hermann Zapf's original hz-program paper from
1993, studied the pdfTeX source code where Hàn Thế Thành implemented hz-expansion,
and you understand exactly why this feature is simultaneously the most powerful and
the most dangerous micro-typography tool ever built. You know what "expansion" means
at the level of font rasterization vs CSS transform vs canvas scale. You write
production TypeScript with zero handwaving.
let search online latest before actual implement step. 
---
## Context
The user is building a **production-grade web typesetter** with `@chenglou/pretext`
+ **CMU Serif**, targeting output identical to LaTeX with:
```latex
\usepackage[
  protrusion=true,
  expansion=true,
  auto=true,
  tracking=true
]{microtype}
```
### What hz-program font expansion actually is
Hermann Zapf and Peter Karow's hz-program (1993) introduced the idea that glyphs
can be **horizontally scaled ±2–5%** without the human eye detecting the distortion,
but with the effect of dramatically improving paragraph color (the grey density of
a typeset block) and reducing hyphenation.
pdfTeX implements this by generating **multiple slightly-scaled versions of each
font** at expansion steps (typically 1% increments from -20 to +20, but in practice
±3% with 1% steps = 7 variants). The line breaker then has 7 versions of each line
to choose from, picking the expansion level that produces the best fit score in the
Knuth-Plass badness function.
**The result:** paragraphs with almost no hyphenation, very even interword spacing,
and a uniform grey texture — the hallmark of professional book typography.
### The web reality
On the web, you cannot generate multiple font instances at render time the way
pdfTeX generates Type1 font variants. You have three imperfect tools:
**Option A: CSS `transform: scaleX(factor)`**
- Applies after layout — Pretext has already measured at 100% width
- Measurements are now wrong: Pretext thinks line is W px wide, it renders as
  W×factor px wide → lines overflow or underlap container
- Only viable if you re-measure after scaling, which defeats the purpose
**Option B: Canvas `ctx.scale(factor, 1)` per line**
- Same problem: Pretext measurements at 100%, canvas renders at factor×
- BUT: if you apply scaling to the canvas transform before rendering and
  **also tell Pretext to measure at the scaled font string**, you can make
  this work — at the cost of one extra `prepare()` call per expansion level
**Option C: CSS `font-stretch` / variable font `wdth` axis**
- CMU Serif is NOT a variable font — no `wdth` axis
- For variable fonts that do have `wdth`, this is the correct approach
- Values map directly to expansion: `font-stretch: 102%` = +2% expansion
- Measurements via `ctx.measureText()` are automatically correct because the
  font itself is wider — no correction needed
**Option D: Approximate with interword spacing (fake expansion)**
- Instead of scaling glyphs, adjust `wordSpacing` to fill the line
- This is what CSS `text-align: justify` does — and why it looks worse than
  LaTeX: it only stretches spaces, not the glyphs themselves
- Implement as a fallback when true expansion is unavailable
### What Pretext enables
`layoutWithLines()` gives you `line.segments[]` with individual segment widths.
This means you can:
1. Measure the **shortfall** on each line: `containerWidth - sum(segment.widths)`
2. Compute the **expansion factor** needed to fill it: `factor = containerWidth / sum(segment.widths)`
3. Clamp to `[0.97, 1.03]` (±3% — beyond this the eye detects distortion)
4. If factor is within range: apply canvas scaleX at render time + correct x positions
5. If factor is out of range: fall back to word spacing or accept the short line
This is **single-pass fake expansion** — visually close to LaTeX for ±2%, degrades
gracefully outside that range.
---
## Your task
Design and implement a **complete, production-ready font expansion system** for
`@chenglou/pretext` + CMU Serif that gets as close to pdfTeX hz-expansion as the
web platform allows. Deliver:
### 1. Platform capability detection
Write `detectExpansionCapability(fontFamily: string): ExpansionMode` that returns
one of:
```ts
type ExpansionMode =
  | 'variable-font'    // font has wdth axis → use font-stretch, measurements correct
  | 'canvas-scale'     // no wdth axis → use ctx.scale(), must correct measurements  
  | 'word-spacing'     // fallback: adjust word spacing only, no glyph scaling
interface ExpansionCapability {
  mode: ExpansionMode
  maxExpansion: number   // 0.03 for canvas-scale, up to 0.10 for variable fonts
  stepSize: number       // expansion granularity: 0.005 for variable, 0.01 for canvas
  visualQuality: 'latex-equivalent' | 'good' | 'fallback'
}
```
For CMU Serif, this always returns `canvas-scale` with `maxExpansion: 0.03`.
Explain in a comment block why `maxExpansion` for canvas-scale is lower than for
variable fonts — hint: canvas scaleX distorts stroke width proportionally, variable
font `wdth` does not.
### 2. Line shortfall analysis
Write `analyzeLines()` that uses Pretext output to compute per-line expansion needs:
```ts
export interface LineExpansionAnalysis {
  lineIndex: number
  text: string
  naturalWidth: number      // sum of segment widths from Pretext (px)
  containerWidth: number    // target width (px)
  shortfall: number         // containerWidth - naturalWidth (px), negative = overflow
  idealFactor: number       // containerWidth / naturalWidth
  clampedFactor: number     // idealFactor clamped to [1-maxExp, 1+maxExp]
  expansionApplied: number  // actual expansion used (= clampedFactor - 1.0)
  residualShortfall: number // shortfall remaining after expansion (needs word spacing)
  isLastLine: boolean       // last line of paragraph — never justify
}
export function analyzeLines(
  lines: Array<{ text: string; segments: Segment[] }>,
  containerWidth: number,
  maxExpansion: number,
  isLastLineFn?: (i: number, total: number) => boolean
): LineExpansionAnalysis[]
```
The last line of a paragraph must **never** be expanded — LaTeX never justifies
the last line. Write `isLastLineFn` default that detects last line by index.
### 3. Canvas-scale expansion renderer
Write the core render function using `ctx.save()` / `ctx.restore()` with
per-line horizontal scaling:
```ts
export function renderLineWithExpansion(
  ctx: CanvasRenderingContext2D,
  analysis: LineExpansionAnalysis,
  baseX: number,
  y: number,
  fontSize: number
): void
```
Implementation must:
**Step 1 — compute corrected x origin:**
When you `ctx.scale(factor, 1)`, the canvas coordinate space stretches. A `baseX`
of 40px in unscaled space becomes `40/factor` in scaled space to render at the
same physical pixel. Write the formula and explain it.
**Step 2 — apply transform:**
```ts
ctx.save()
ctx.translate(baseX, y)
ctx.scale(analysis.clampedFactor, 1)
ctx.translate(-baseX / analysis.clampedFactor, 0)
// now draw at x=0 relative to this transform
```
Explain exactly why this sequence keeps the left margin pinned while expanding
rightward, and why naively calling `ctx.scale()` without the translate pair causes
the text to shift left.
**Step 3 — render segments:**
Draw each segment using `ctx.fillText()` at its Pretext-provided x position
(no manual x correction needed inside the scaled context — the transform handles it).
**Step 4 — residual word spacing:**
If `residualShortfall > 0` after clamping, distribute it across word spaces:
```ts
const wordCount = (analysis.text.match(/\s+/g) ?? []).length
const extraWordSpacing = residualShortfall / Math.max(wordCount, 1)
ctx.wordSpacing = `${extraWordSpacing}px` // Chrome 111+
```
Show the fallback for browsers without `ctx.wordSpacing` (manual segment-by-segment
x offset accumulation).
### 4. Multi-step expansion (approximating pdfTeX's 7-variant approach)
pdfTeX tries 7 expansion levels per line and picks the best. Implement a simplified
version:
```ts
export function findOptimalExpansion(
  lineNaturalWidth: number,
  containerWidth: number,
  steps: number[],           // e.g. [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03]
  badnessFn?: (shortfall: number, expansion: number) => number
): number  // returns the expansion factor with lowest badness score
```
Default `badnessFn` should replicate Knuth-Plass badness:
- Badness from spacing: `100 × (shortfall / containerWidth)³`
- Badness from expansion: `50 × (expansion / 0.03)²`  (penalty for large expansion)
- Total = sum of both — find the step with minimum total
Explain why this penalty function **prefers small expansion over large word spacing**
— which is the opposite of what CSS `text-align: justify` does.
### 5. Integration with Pretext two-pass pipeline
Extend the `typeset()` orchestrator from Prompt 3 to include expansion:
```ts
export async function typeset(
  text: string,
  containerWidth: number,
  fontSize: number,
  lineHeight: number,
  ctx: CanvasRenderingContext2D,
  options?: {
    kerning?: boolean          // Prompt 1
    opticalMargin?: boolean    // Prompt 2
    protrusion?: boolean       // Prompt 3
    expansion?: boolean        // Prompt 4 ← new
    expansionSteps?: number[]  // default: [-0.03,-0.02,-0.01,0,0.01,0.02,0.03]
  }
): Promise<TypesetResult>
```
Show how expansion interacts with protrusion from Prompt 3: protrusion shifts the
line origin, expansion scales the glyph widths — they must compose in the correct
order. Write `composeExpansionAndProtrusion()` that handles this.
### 6. Stroke width compensation
The most subtle problem with `canvas scaleX`: horizontal strokes stay the same
pixel width but vertical strokes get stretched. At `scaleX(1.03)`, a 1px vertical
stem renders as 1.03px — on a retina display this is invisible, on a 1x display
it creates a faint "fattening" effect on expanded lines.
Write `computeStrokeCompensation(expansionFactor: number, dpr: number): number`
that returns a CSS `scaleX` compensation to apply to stroke rendering:
- At `dpr >= 2` (retina): compensation is `0` — sub-pixel, not visible
- At `dpr === 1` and `expansionFactor > 1.015`: compensation is
  `1 / expansionFactor` applied to stroke width via `ctx.lineWidth`
- Explain why this only matters for canvas-drawn decorations (underlines, borders),
  not for font glyphs (which the font rasterizer handles internally)
### 7. Measurement correction for re-layout
If the user wants **true two-pass expansion** (expansion affects line breaking, not
just rendering), they need to re-measure with the scaled font. Write:
```ts
export async function prepareWithExpansion(
  text: string,
  fontString: string,
  expansionFactor: number,
  ctx: CanvasRenderingContext2D
): Promise<PreparedText>
```
Strategy: temporarily set `ctx.font` to the base font, then apply
`ctx.scale(expansionFactor, 1)` before calling `prepare()`. This causes Pretext's
internal `ctx.measureText()` calls to return expanded widths — so the line breaker
sees the correct widths for that expansion level.
Explain why this requires **one `prepare()` call per expansion level** and why
that's still O(7) not O(n) — acceptable for interactive use, too slow for
server-side batch rendering of 1000-page documents.
### 8. Visual regression test
Write `assertExpansionQuality(ctx, lines, containerWidth)` that:
- Renders all lines to offscreen canvas
- For each non-last line: measures rendered line width via `getImageData` ink bounds
- Asserts that every non-last line fills `containerWidth ± 1px`
- Asserts that no expansion factor exceeds `±3%`
- Returns `{ uniformity: number }` — standard deviation of line fill percentages
  (LaTeX-quality output should be `< 0.5%`)
### 9. What NOT to do
Write 6 code review comments as Cheng Lou reviewing a junior's implementation that:
- Applied `ctx.scale(factor, 1)` globally for the whole paragraph instead of
  per-line — all lines get the same expansion regardless of their individual shortfall
- Expanded the last line of the paragraph — the ragged right on the last line
  is intentional, not a bug to fix
- Used `factor = containerWidth / naturalWidth` without clamping — a very short
  line (one word) gets `factor = 3.2` and the word stretches across the container
  like taffy
- Forgot `ctx.save()` / `ctx.restore()` around per-line scale — transforms
  accumulate across lines, each line is wider than the last
- Applied expansion after protrusion without recomputing the left origin —
  the protrusion shift gets scaled along with the text, doubling the protrusion
  amount at the left margin
- Distributed residual shortfall evenly including the last word space — LaTeX
  never adds space after the last word on a line, only between words
---
## Constraints
- TypeScript strict mode, no `any`
- CMU Serif via `FontFace` API confirmed ready before any measurement
- All expansion factors clamped to `[-0.03, +0.03]` for canvas-scale mode
- `ctx.save()` / `ctx.restore()` wraps every per-line transform — no leaking state
- Last line of paragraph: `expansionFactor = 0` always, no word spacing either
- Sub-pixel precision: internal floats, round only at `ctx.fillText()`
- `ctx.wordSpacing` with graceful fallback for Firefox (manual segment offsets)
- Must compose cleanly with Prompt 1 (kerning), Prompt 2 (optical margin),
  Prompt 3 (protrusion) — shared `typeset()` orchestrator, no mutation conflicts
- Zero `// TODO` placeholders — every function fully implemented
