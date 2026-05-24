# Tracking System Integration with Prompts 1–4

## The Five-Component Micro-Typography Stack

The `@chenglou/pretext` tracking system (Prompt 5) is the final stage of a composable five-component stack. Each component refines the typesetting quality in a specific way:

1. **Kerning (Prompt 1)** — Kern pairs adjust spacing between specific character combinations (AV, To, etc.)
2. **Optical Margin (Prompt 2)** — Hanging punctuation alignment for visual balance
3. **Protrusion (Prompt 3)** — Character overhang into margins for visual edge-alignment
4. **Font Expansion (Prompt 4)** — Horizontal scaling (0.98–1.02) for micro-justification
5. **Tracking (Prompt 5)** — Uniform letter-spacing with trailing space removal

---

## Render Pipeline: Composition Order

The order in which these components are applied at render time is **critical**. All five must run in this exact sequence:

### Pseudocode: Render Loop

```
for each line:
  
  // Step 1: Pre-calculate kern adjustments
  // (Store kern offsets per segment; don't apply yet)
  kernOffsets = computeKernOffsets(line.text)
  
  // Step 2: Calculate optical margin shift
  // (Detect hanging punctuation, compute shift amount)
  opticalMarginX = resolveOpticalMargin(line.text)
  finalLineX = line.x + opticalMarginX
  
  // Step 3: Calculate protrusion adjustment
  // (Measure last character, apply protrusion spec)
  protrusionOffset = computeProtrusion(line.text, lastCharacter)
  adjustedMeasure = containerWidth - protrusionOffset
  
  // Step 4: Calculate font expansion factor
  // (Solve hz constraints to fit adjusted measure)
  expansionFactor = computeFontExpansion(line, adjustedMeasure)
  ctx.scale(expansionFactor, 1)
  
  // Step 5: Render with tracking (character-by-character)
  // Consumes all previous adjustments
  renderTrackedLine(
    ctx,
    { text: line.text, x: finalLineX },
    trackingGapPx,
    baseY,
    removeTrailingSpace
  )
  
  ctx.resetTransform()
```

### Why This Order?

**Tracking must be LAST** because:

1. **Tracking renders character-by-character** — it consumes pre-computed positions, not produce them
2. **All previous stages give tracking correct x positions** — kerning offset, optical margin shift, protrusion edge
3. **Expansion factor is pre-computed** — ctx.scale() is set up before renderTrackedLine() is called
4. **Width corrections from tracking don't propagate** — by the time tracking runs, all line-breaking is done

If tracking ran earlier:
- Its width changes (charCount − 1 gaps × trackingGapPx) would need to propagate through protrusion
- Protrusion depends on last-character position (affected by tracking)
- Expansion factor depends on final line measure (affected by tracking)
- Cascading dependencies = complexity and bugs

**Result:** Tracking last = clean separation of concerns, no circular dependencies.

---

## Data Flow Example: "Hello WORLD"

Let's trace a concrete line through the full pipeline:

### Input
```
text: "Hello WORLD"
font: 16px CMU Serif
container: 400px wide
options: all five systems enabled
```

### Step 1: Kerning (Prompt 1)
Kern pairs are looked up for consecutive characters. Example pairs:
- (H, e): no kern
- (e, l): no kern
- (W, O): -0.5px kern
- (O, R): no kern
- (L, D): no kern

**Output:** `kernOffsets = [-0.5, ...]` (per-segment kern values)

These are **stored** but not applied to x position yet. They will be consumed during renderTrackedLine().

### Step 2: Optical Margin (Prompt 2)
Detect hanging characters (quotation marks, bullets, dashes):
- First character: 'H' (not hanging)
- No hanging punctuation detected

**Output:** `opticalMarginX = 0` (no shift needed)

If the line started with a quotation mark, opticalMarginX would be negative (hang left).

### Step 3: Protrusion (Prompt 3)
Last character: 'D'
- Protrusion spec for 'D' at 16px: +30 units ≈ 0.48px

**Output:** `protrusionOffset = 0.48px`

The logical right edge of the line is pulled left by 0.48px to account for the visual protrusion of 'D'.

### Step 4: Font Expansion (Prompt 4)
Measure the line with all previous corrections:
- Natural width: ~72px (measured via ctx.measureText())
- Width with tracking: ~75px (including +20 units tracking for 8px body text)
- Protrusion adjustment: -0.48px → effective container = 399.52px

The hz algorithm (from Prompt 4) computes:
```
expansionFactor = solveHzConstraints(
  naturalWidth = 75px,
  expandedWidth = 399.52px
)
// Result: 1.005 (expand by 0.5%)
```

This factor will be applied via ctx.scale(1.005, 1).

### Step 5: Tracking (Prompt 5)
Render character-by-character:

Body text 16px: `resolveTracking(16, 'body')` → 0 units (no tracking)

```
H e l l o   W O R L D
↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑
Render each character with no inter-character gap (0 units)
BUT with kern offsets from Step 1 applied
AND with expansion factor from Step 4 active (1.005x scale)
AND from x position from Step 2 (0 shift)
```

The WORLD run might be detected as all-caps, but it's only 5 characters. The threshold for auto-detection is 3+, so it would be tracked at +80 units.

**Final Output:** Line rendered with all five micro-typographic refinements applied correctly.

---

## Potential Conflicts and How They're Resolved

### Conflict 1: Kerning + Tracking

**Issue:** Kerning is measured for glyphs at natural spacing. Tracking adds uniform gaps. Do they interfere?

**Resolution:** 
- Kerning values are INDEPENDENT of tracking
- Both are additive: `position = naturalAdvance + kernOffset + trackingGap`
- Kerning values are designed for natural spacing and remain valid even with tracking
- When you render character-by-character (Prompt 5), you lose automatic kerning from the font, so kern values must be explicitly applied or ignored
- If `applyKerningAfter: true` in TrackingSpec, kern pairs are looked up after tracking is calculated

**Best Practice:** Set `applyKerningAfter: false` for display text. For body text, use the font's built-in kerning only (don't try to re-apply it).

### Conflict 2: Optical Margin + Tracking

**Issue:** Optical margin shifts the line left/right. Does tracking width affect this?

**Resolution:**
- Optical margin shift (Step 2) happens BEFORE tracking (Step 5)
- The shift is a one-time x-offset applied to the entire line
- Tracking gaps don't affect the margin calculation
- Hanging punctuation alignment is based on the last character position AFTER all shifts

**Example:**
```
Correct order:
  1. Determine last character position (e.g., 298.4px) via protrusion + tracking width
  2. Apply optical margin shift to first character (e.g., -2px for hanging quote)
  3. Render line from shifted x position with tracking applied

Incorrect order (don't do this):
  1. Apply optical margin shift first
  2. Then apply protrusion (but x is already shifted, so protrusion offset is wrong)
```

### Conflict 3: Protrusion + Tracking

**Issue:** Protrusion adjusts the right edge of the line. Tracking changes line width. Which is first?

**Resolution:**
- **Protrusion is calculated BEFORE tracking width is known** (Step 3 before Step 5)
- The protrusion spec is fixed (e.g., 'A' always protrudes +40 units at any size)
- Tracking is applied at render time and doesn't change the protrusion calculation
- The formula is:
  ```
  adjustedMeasure = containerWidth - protrusionOffset
  // (This adjustedMeasure is used for expansion calculation)
  
  trackedWidth = naturalWidth + (charCount - 1) × trackingGapPx
  // (This is used for line breaking and rendering)
  
  Both are independent; no conflict.
  ```

**Key insight:** Protrusion adjusts the MEASURE (how wide the line can be), while tracking adjusts the RENDERING (how the glyphs are spaced). They operate on different axes.

### Conflict 4: Font Expansion + Tracking

**Issue:** Expansion changes glyph width via ctx.scale(). Does this affect tracking gap size?

**Resolution:**
- **Font expansion is calculated from the TRACKED width** (Step 4 uses output of Step 5 conceptually)
- But expansion is applied BEFORE rendering (Step 4 before Step 5)
- The scaling factor is:
  ```
  expansionFactor = targetWidth / measuredWidth
  
  where measuredWidth INCLUDES tracking:
    measuredWidth = naturalWidth + (charCount - 1) × trackingGapPx
  ```
- When ctx.scale(expansionFactor, 1) is active and renderTrackedLine() is called:
  - Character advances are scaled by expansionFactor
  - Tracking gaps are NOT scaled (they're added in advance space, not glyph space)
  - **Subtle but important:** The gap is in addition to glyph width, so it's multiplicative with scaling

**Example at 1.005 expansion:**
```
Natural glyph width: 20px
Scaled glyph width: 20px × 1.005 = 20.1px

Tracking gap: 2px (explicit, not scaled)
Effective spacing: 20.1px (glyph) + 2px (gap) = 22.1px

NOT: (20px + 2px) × 1.005 = 22.1px
```

In practice, this is fine because tracking gaps are small relative to glyph width, and the expansion factor is tiny (0.98–1.02).

**Best Practice:** Don't overthink this. The implementation applies expansion first (ctx.scale), then renderTrackedLine adds gaps additively. The math works out.

---

## Measurement Cache and Unit Conversions

All five systems use consistent units. The tracking system extends the Prompt 3 measurement cache:

### Original Cache (Prompt 3)
```
key: "${char}::${fontString}::${fontSize}"
value: CharacterMetrics { advance, protrusion, ... }
```

### Extended Cache (With Prompt 5)
```
key: "${char}::${fontString}::${fontSize}::${trackingUnits}"
value: CharacterMetrics { advance, protrusion, tracking, ... }
```

This ensures that the same character measured in different tracking contexts reuses cached metrics, improving performance.

---

## Full Pipeline Example Code

```typescript
// Complete render loop with all five systems
async function renderParagraph(
  text: string,
  containerWidth: number,
  ctx: CanvasRenderingContext2D,
  options: {
    kerning: boolean
    opticalMargin: boolean
    protrusion: boolean
    expansion: boolean
    tracking: boolean
  }
) {
  // Step 1: Break text into lines using Pretext
  const lines = await pretext.layoutWithLines(
    text,
    containerWidth,
    ctx
  )

  for (const line of lines) {
    // Step 1: Kerning (compute kern offsets, don't apply yet)
    const kernOffsets = options.kerning
      ? computeKernOffsets(line.text)
      : new Array(line.text.length).fill(0)

    // Step 2: Optical margin (determine x shift for hanging punctuation)
    const opticalMarginX = options.opticalMargin
      ? resolveOpticalMargin(line.text)
      : 0
    const finalLineX = line.x + opticalMarginX

    // Step 3: Protrusion (compute right-edge adjustment)
    const protrusionOffset = options.protrusion
      ? computeProtrusion(line.text)
      : 0
    const adjustedContainerWidth = containerWidth - protrusionOffset

    // Step 4: Font expansion (compute hz scaling factor)
    let expansionFactor = 1.0
    if (options.expansion) {
      const trackedWidth = options.tracking
        ? measureTracked(line.text, ctx.font, fontSize, trackingUnits, containerWidth, ctx).trackedWidth
        : ctx.measureText(line.text).width
      
      expansionFactor = computeFontExpansion(
        trackedWidth,
        adjustedContainerWidth
      )
      ctx.scale(expansionFactor, 1)
    }

    // Step 5: Tracking (render character-by-character)
    if (options.tracking) {
      const trackingSpec = resolveTracking(fontSize, 'body')
      const trackingGapPx = trackingToPx(trackingSpec.units, fontSize)
      renderTrackedLine(
        ctx,
        { text: line.text, x: finalLineX },
        trackingGapPx,
        line.y,
        trackingSpec.removeTrailingSpace
      )
    } else {
      // No tracking, just render normally
      ctx.fillText(line.text, finalLineX, line.y)
    }

    ctx.resetTransform()
  }
}
```

---

## Performance Considerations

### Measurement Overhead
Each component adds measurement calls:
- **Kerning:** O(n) character pairs
- **Optical margin:** O(1) first character check
- **Protrusion:** O(1) last character check
- **Font expansion:** O(1) line width measurement
- **Tracking:** O(n) character-by-character rendering

**Total:** O(n) complexity, but with small constants. The measurement cache from Prompt 3 amortizes most costs.

### Caching Strategy
1. Cache character advances: `"char::font::size" → width`
2. Cache kern pairs: `"char1+char2::font::size" → offset`
3. Cache protrusion specs: `"char::font::size" → protrusionUnits`
4. Cache tracking specs: `"fontSize::variant" → TrackingSpec` (just a table lookup, fast)

### Recommended Optimization
For long documents, precompute and cache all metrics once:
```typescript
// Pre-compute metrics for the entire font + size combination
const metricsCache = new Map()

for (const char of allCharactersInDocument) {
  for (const fontSize of [8, 10, 12, 14, 16, 18, 20, 24, ...]) {
    const key = `${char}::font::${fontSize}`
    metricsCache.set(key, {
      advance: ctx.measureText(char).width,
      protrusion: getProtrusionSpec(char, fontSize),
      kerning: getAllKernPairs(char, fontSize),
    })
  }
}
```

---

## Testing the Five-Component Stack

### Unit Tests
- Verify each component works independently
- Test corner cases (empty strings, special characters, emoji)
- Validate unit conversions (1000 UPM, em-based units)

### Integration Tests
- Render the same text with different component combinations
- Verify no regressions when disabling/enabling components
- Compare against LaTeX output (microtype package)

### Regression Tests
- Visual regression: compare rendered output pixel-by-pixel
- Measurement regression: verify width calculations match expected
- Trailing space removal: assertTrackingCorrectness() from Prompt 5

### Benchmark Tests
- Performance with large documents (1000+ lines)
- Memory usage with deep measurement caches
- Render time for complex typography (many all-caps runs, protrusion, expansion)

---

## Troubleshooting

### Symptom: Lines are too wide / too narrow
**Check:**
1. Is protrusion turned on? (reduces available measure)
2. Is expansion turned on? (may over-scale to fit)
3. Is tracking applied? (increases line width)

### Symptom: Hanging punctuation is misaligned
**Check:**
1. Is optical margin turned on?
2. Is trailing space removal working in tracking? (use assertTrackingCorrectness)
3. Is the first character's protrusion being applied?

### Symptom: Kerning looks wrong with tracking
**Check:**
1. Are ligatures disabled during tracked rendering? (disableLigatures: true)
2. Is applyKerningAfter set correctly? (usually false for display)
3. Is character-by-character rendering breaking kern pairs?

### Symptom: Font expansion is too aggressive / too timid
**Check:**
1. Are the hz constraints correctly calibrated?
2. Is the protrusion offset being subtracted from container width?
3. Is the tracking width being used in expansion calculation?

---

## Summary: The Five-Component Stack

| Component | Modifies | Purpose | Order |
|-----------|----------|---------|-------|
| **Kerning (1)** | Per-segment spacing | Reduce optical gaps between character pairs | Pre-compute |
| **Optical Margin (2)** | Line x position | Align hanging punctuation with visual edge | Step 2 |
| **Protrusion (3)** | Container measure | Allow characters to overhang into margin | Step 3 |
| **Font Expansion (4)** | Global scale factor | Micro-justify line width via hz algorithm | Step 4 |
| **Tracking (5)** | Glyph positions | Uniform letter-spacing with trailing removal | Step 5 (render) |

Each component is **independent** but **interdependent** on the others for full effect. Together, they produce typography that rivals professional software like InDesign and approaches LaTeX quality.

The implementation in `tracking-system.ts` is the final piece. With all five components integrated, `@chenglou/pretext` becomes a production-grade web typesetter.
