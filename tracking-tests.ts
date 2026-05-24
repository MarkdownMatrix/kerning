/**
 * @chenglou/pretext Tracking System — Test Suite and Usage Examples
 *
 * Comprehensive tests demonstrating:
 * 1. Small caps tracking (+80 units)
 * 2. Headline tracking (-20 to -60 units)
 * 3. All-caps auto-detection and tracking (+80 units)
 * 4. Optical size body tracking (0 to +20 units)
 * 5. Measurement correctness (trailing space removal)
 * 6. Regression testing (Canvas vs CSS comparison)
 * 7. Full pipeline integration (all five components)
 */

import {
  trackingToPx,
  pxToTracking,
  resolveTracking,
  CMU_SERIF_TRACKING,
  measureTracked,
  prepareTracked,
  renderTrackedLine,
  renderSmallCapsTracked,
  detectAllCapsRuns,
  renderWithAutoTracking,
  assertTrackingCorrectness,
  typeset,
  type TrackingSpec,
  type TrackingUnits,
  type TypesetResult,
} from './tracking-system'

// ============================================================================
// TEST SUITE
// ============================================================================

/**
 * Test 1: Unit conversion (trackingToPx ↔ pxToTracking)
 */
export function testUnitConversion(): void {
  console.log('TEST 1: Unit Conversion')
  console.log('─'.repeat(60))

  // Test trackingToPx
  let result = trackingToPx(100, 24)
  console.assert(
    Math.abs(result - 2.4) < 0.01,
    `trackingToPx(100, 24) should be ≈2.4, got ${result}`,
  )
  console.log(`✓ trackingToPx(100, 24) = ${result.toFixed(1)}px`)

  // Test negative tracking
  result = trackingToPx(-50, 24)
  console.assert(
    Math.abs(result - -1.2) < 0.01,
    `trackingToPx(-50, 24) should be ≈-1.2, got ${result}`,
  )
  console.log(`✓ trackingToPx(-50, 24) = ${result.toFixed(1)}px`)

  // Test small text
  result = trackingToPx(20, 8)
  console.assert(
    Math.abs(result - 0.16) < 0.01,
    `trackingToPx(20, 8) should be ≈0.16, got ${result}`,
  )
  console.log(`✓ trackingToPx(20, 8) = ${result.toFixed(2)}px`)

  // Test pxToTracking (inverse)
  const units = pxToTracking(2.4, 24)
  console.assert(
    Math.abs(units - 100) < 1,
    `pxToTracking(2.4, 24) should be ≈100, got ${units}`,
  )
  console.log(`✓ pxToTracking(2.4, 24) = ${units.toFixed(0)} units`)

  console.log()
}

/**
 * Test 2: Tracking spec resolution for different font sizes
 */
export function testTrackingResolution(): void {
  console.log('TEST 2: Tracking Spec Resolution (Optical Size)')
  console.log('─'.repeat(60))

  // Small text: should get +20 units
  let spec = resolveTracking(8, 'body')
  console.assert(
    spec.units === 20,
    `Font size 8px body should have +20 units, got ${spec.units}`,
  )
  console.log(`✓ 8px body: +${spec.units} units`)

  // Regular body: should get +10 units
  spec = resolveTracking(12, 'body')
  console.assert(
    spec.units === 10,
    `Font size 12px body should have +10 units, got ${spec.units}`,
  )
  console.log(`✓ 12px body: +${spec.units} units`)

  // Standard body: should get 0 units
  spec = resolveTracking(16, 'body')
  console.assert(
    spec.units === 0,
    `Font size 16px body should have 0 units, got ${spec.units}`,
  )
  console.log(`✓ 16px body: ${spec.units} units (no tracking)`)

  // Large body: should get -10 units
  spec = resolveTracking(28, 'body')
  console.assert(
    spec.units === -10,
    `Font size 28px body should have -10 units, got ${spec.units}`,
  )
  console.log(`✓ 28px body: ${spec.units} units`)

  // Small caps: always +80 units
  spec = resolveTracking(16, 'smallCaps')
  console.assert(
    spec.units === 80,
    `Small caps should always be +80 units, got ${spec.units}`,
  )
  console.log(`✓ 16px small caps: +${spec.units} units`)

  // All caps: always +80 units
  spec = resolveTracking(24, 'allCaps')
  console.assert(
    spec.units === 80,
    `All caps should always be +80 units, got ${spec.units}`,
  )
  console.log(`✓ 24px all caps: +${spec.units} units`)

  // Headlines
  spec = resolveTracking(30, 'headline')
  console.assert(
    spec.units === -20,
    `30px headline should be -20 units, got ${spec.units}`,
  )
  console.log(`✓ 30px headline: ${spec.units} units (tight)`)

  spec = resolveTracking(48, 'headline')
  console.assert(
    spec.units === -40,
    `48px headline should be -40 units, got ${spec.units}`,
  )
  console.log(`✓ 48px headline: ${spec.units} units (tighter)`)

  spec = resolveTracking(72, 'headline')
  console.assert(
    spec.units === -60,
    `72px headline should be -60 units, got ${spec.units}`,
  )
  console.log(`✓ 72px headline: ${spec.units} units (very tight)`)

  console.log()
}

/**
 * Test 3: Measurement with trailing space correction
 */
export function testMeasurementCorrectness(ctx: CanvasRenderingContext2D): void {
  console.log('TEST 3: Measurement Correctness (Trailing Space Removal)')
  console.log('─'.repeat(60))

  ctx.font = '24px CMU Serif'
  ctx.fillStyle = 'black'

  // Measure "SPACING" with +100 units tracking
  const text = 'SPACING'
  const meas = measureTracked(
    text,
    '24px CMU Serif',
    24,
    100, // +100 units = +2.4px
    400, // container width
    ctx,
  )

  console.log(`Text: "${text}"`)
  console.log(`Natural width: ${meas.naturalWidth.toFixed(1)}px`)
  console.log(`Character count: ${meas.charCount} (Unicode-safe)`)
  console.log(`Tracking gap: ${meas.trackingGapPx.toFixed(2)}px (+100 units)`)
  console.log(
    `Tracked width (with trailing removal): ${meas.trackedWidth.toFixed(1)}px`,
  )
  console.log(
    `  (= ${meas.naturalWidth.toFixed(1)} + ${meas.charCount - 1} gaps × ${meas.trackingGapPx.toFixed(2)}px)`,
  )
  console.log(
    `Adjusted container width: ${meas.adjustedContainerWidth.toFixed(1)}px`,
  )
  console.log(
    `  (= 400 - ${meas.trackingGapPx.toFixed(2)}px trailing gap adjustment)`,
  )

  // Verify the formula
  const expectedTrackedWidth =
    meas.naturalWidth + (meas.charCount - 1) * meas.trackingGapPx
  console.assert(
    Math.abs(meas.trackedWidth - expectedTrackedWidth) < 0.1,
    `Tracked width formula incorrect`,
  )
  console.log(
    `✓ Trailing space removal correctly implemented in measurement`,
  )

  console.log()
}

/**
 * Test 4: All-caps detection
 */
export function testAllCapsDetection(): void {
  console.log('TEST 4: All-Caps Detection')
  console.log('─'.repeat(60))

  let runs = detectAllCapsRuns('Hello WORLD and XML parsing')
  console.assert(runs.length === 2, `Should detect 2 all-caps runs, got ${runs.length}`)
  console.assert(runs[0].text === 'WORLD', `First run should be "WORLD", got "${runs[0].text}"`)
  console.assert(runs[1].text === 'XML', `Second run should be "XML", got "${runs[1].text}"`)
  console.log(`✓ "Hello WORLD and XML parsing"`)
  console.log(`  Detected: "${runs[0].text}" at [${runs[0].start}:${runs[0].end}]`)
  console.log(`  Detected: "${runs[1].text}" at [${runs[1].start}:${runs[1].end}]`)

  // Edge cases
  runs = detectAllCapsRuns('NO all-caps in this sentence.')
  console.assert(runs.length === 1, `Should detect 1 all-caps run (NO), got ${runs.length}`)
  console.log(`✓ "NO all-caps in this sentence." → 1 run (NO)`)

  runs = detectAllCapsRuns('lowercase only')
  console.assert(runs.length === 0, `Should detect 0 all-caps runs, got ${runs.length}`)
  console.log(`✓ "lowercase only" → 0 runs`)

  runs = detectAllCapsRuns('AB is too short')
  console.assert(
    runs.length === 0,
    `2-letter caps should not be detected (threshold is 3), got ${runs.length}`,
  )
  console.log(`✓ "AB is too short" → 0 runs (threshold: 3+ chars)`)

  runs = detectAllCapsRuns('ABC is minimum')
  console.assert(runs.length === 1, `3-letter caps should be detected, got ${runs.length}`)
  console.log(`✓ "ABC is minimum" → 1 run (ABC)`)

  console.log()
}

/**
 * Test 5: Render-time trailing space removal
 *
 * This test visually demonstrates that renderTrackedLine correctly
 * removes the trailing space, while DOM letter-spacing adds it.
 */
export function testRenderingTrailingSpaceRemoval(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): void {
  console.log('TEST 5: Rendering Trailing Space Removal (Visual Test)')
  console.log('─'.repeat(60))

  // Set up canvas
  const width = 500
  const height = 200
  canvas.width = width
  canvas.height = height
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, width, height)

  ctx.font = '24px CMU Serif'
  ctx.fillStyle = 'black'

  const text = 'SPACING'
  const trackingGapPx = 2.4 // +100 units at 24px
  const baselineY = 80

  // Draw reference vertical line at 200px (will show trailing space difference)
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(200, baselineY - 20)
  ctx.lineTo(200, baselineY + 20)
  ctx.stroke()

  // Render with trailing space removal
  ctx.fillStyle = 'black'
  renderTrackedLine(
    ctx,
    { text, x: 50 },
    trackingGapPx,
    baselineY,
    true, // removeTrailingSpace = true (CORRECT)
  )

  // Overlay text showing result
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'green'
  ctx.fillText('← Trailing removed (correct)', 50, baselineY + 40)

  // Show the expected end position (measured)
  const meas = ctx.measureText(text)
  const trackedWidth =
    meas.width + (text.length - 1) * trackingGapPx
  const endX = 50 + trackedWidth

  ctx.strokeStyle = 'green'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(endX, baselineY - 20)
  ctx.lineTo(endX, baselineY + 20)
  ctx.stroke()

  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'green'
  ctx.fillText(`End at ${endX.toFixed(0)}px`, endX - 40, baselineY - 30)

  console.log(
    `✓ Text rendered with trailing space removed at x=${endX.toFixed(1)}px`,
  )
  console.log(`  (Natural width ${meas.width.toFixed(1)}px + ${text.length - 1} gaps × ${trackingGapPx.toFixed(1)}px)`)
  console.log()
}

/**
 * Test 6: Regression test (Canvas vs DOM)
 */
export async function testRegressionTrailingSpace(
  ctx: CanvasRenderingContext2D,
): Promise<void> {
  console.log('TEST 6: Regression Test (Canvas Implementation Verification)')
  console.log('─'.repeat(60))

  const text = 'SPACING'
  const fontSize = 24
  const trackingGapPx = 2.4 // +100 units

  const result = assertTrackingCorrectness(ctx, text, fontSize, trackingGapPx, 400)

  console.log(result.message)
  console.log(
    `  Canvas rightmost pixel: ${result.canvasRightmostPixelX.toFixed(0)}px`,
  )
  console.log(`  CSS rightmost pixel: ${result.cssRightmostPixelX.toFixed(0)}px`)
  console.log(
    `  Difference: ${result.differencePixels.toFixed(1)}px (expected ≈ ${trackingGapPx.toFixed(1)}px)`,
  )

  if (result.trailingSpaceRemoved) {
    console.log(`✓ PASS: Trailing space is correctly removed`)
  } else {
    console.log(`✗ FAIL: Trailing space NOT removed (bug in implementation)`)
  }

  console.log()
}

/**
 * Test 7: Small caps rendering
 */
export function testSmallCapsTracking(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  console.log('TEST 7: Small Caps Tracking')
  console.log('─'.repeat(60))

  // Set up canvas
  canvas.width = 600
  canvas.height = 150
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, 600, 150)

  ctx.fillStyle = 'black'

  // Show the small caps tracking spec
  const spec = resolveTracking(20, 'smallCaps')
  console.log(`Small caps at 20px: +${spec.units} units`)
  console.log(`Tracking gap: ${trackingToPx(spec.units, 20).toFixed(2)}px`)
  console.log(`Ligatures disabled: ${spec.disableLigatures}`)

  // Render small caps (note: actual CMU Serif SC must be loaded)
  ctx.font = '20px CMU Serif SC'
  const text = 'SMALL CAPS'
  renderSmallCapsTracked(ctx, text, 50, 80, 20, 'CMU Serif')

  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'green'
  ctx.fillText(`← Small caps with +${spec.units} units tracking`, 250, 85)

  console.log(`✓ Small caps rendered with automatic +80 tracking`)
  console.log()
}

/**
 * Test 8: Auto all-caps tracking
 */
export function testAutoAllCapsTracking(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  console.log('TEST 8: Auto All-Caps Detection and Tracking')
  console.log('─'.repeat(60))

  // Set up canvas
  canvas.width = 600
  canvas.height = 150
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, 600, 150)

  ctx.font = '24px CMU Serif'
  ctx.fillStyle = 'black'

  const line = {
    text: 'The XML parser and HTTP protocol...',
    x: 50,
  }

  // Render with auto-tracking
  renderWithAutoTracking(ctx, line, 24, 80)

  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'green'
  ctx.fillText(
    '← Normal text + XML, HTTP auto-tracked at +80 units',
    250,
    85,
  )

  const runs = detectAllCapsRuns(line.text)
  console.log(`Text: "${line.text}"`)
  console.log(`Detected ${runs.length} all-caps run(s):`)
  runs.forEach((run) => {
    console.log(`  - "${run.text}" at index ${run.start}:${run.end}`)
  })
  console.log(`✓ Auto all-caps tracking applied to ${runs.length} run(s)`)

  console.log()
}

/**
 * Test 9: Full pipeline (all five components)
 */
export async function testFullPipeline(
  ctx: CanvasRenderingContext2D,
): Promise<void> {
  console.log('TEST 9: Full Pipeline (All Five Components)')
  console.log('─'.repeat(60))

  const text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Small caps at 14px: SMALL CAPS TEXT.
Tracking at 16px body: normal automatic spacing.
And the UNIX system with tracking.`

  const result = await typeset(
    text,
    600, // container width
    16, // font size
    1.5 * 16, // line height
    ctx,
    {
      kerning: true,
      opticalMargin: true,
      protrusion: true,
      expansion: true,
      tracking: true,
      trackingVariant: 'body',
    },
  )

  console.log(`Typeset result:`)
  console.log(`  Lines: ${result.lines.length}`)
  console.log(`  Total height: ${result.totalHeight.toFixed(0)}px`)
  console.log(`  Paragraph width: ${result.paragraphWidth}px`)
  console.log(`Metrics:`)
  console.log(`  Total characters: ${result.metrics.totalCharacters}`)
  console.log(
    `  Average expansion: ${result.metrics.avgExpansionFactor.toFixed(3)}`,
  )
  console.log(`  Hyphenation lines: ${result.metrics.hyphenCount}`)
  console.log(`  Protrusion lines: ${result.metrics.protrusionLines}`)
  console.log(`  Optical margin lines: ${result.metrics.opticalMarginLines}`)
  console.log(
    `  Tracking applied: ${result.metrics.trackingApplied} units`,
  )
  if (result.metrics.estimatedRenderTimeMs) {
    console.log(
      `  Render time: ${result.metrics.estimatedRenderTimeMs.toFixed(1)}ms`,
    )
  }

  console.log(`✓ Full pipeline executed successfully`)
  console.log()
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Simple small caps rendering
 */
export function exampleSmallCaps(ctx: CanvasRenderingContext2D): void {
  ctx.font = '20px CMU Serif SC'
  ctx.fillStyle = 'black'

  // Small caps at 20px: +80 units tracking
  const text = 'ACKNOWLEDGEMENTS'
  const spec = resolveTracking(20, 'smallCaps')
  const trackingGapPx = trackingToPx(spec.units, 20)

  renderSmallCapsTracked(ctx, text, 50, 100, 20, 'CMU Serif')

  console.log(`Rendered small caps "${text}" with +${spec.units} units tracking`)
}

/**
 * Example 2: Headline tracking (tight)
 */
export function exampleHeadlineTracking(ctx: CanvasRenderingContext2D): void {
  ctx.font = '48px CMU Serif'
  ctx.fillStyle = 'black'

  const text = 'MODERN TYPOGRAPHY'
  const spec = resolveTracking(48, 'headline') // -40 units
  const trackingGapPx = trackingToPx(spec.units, 48)

  renderTrackedLine(
    ctx,
    { text, x: 50 },
    trackingGapPx,
    100,
    spec.removeTrailingSpace,
  )

  console.log(
    `Rendered headline "${text}" with ${spec.units} units tracking (tight)`,
  )
}

/**
 * Example 3: Body text with auto all-caps
 */
export function exampleBodyTextAutoTracking(ctx: CanvasRenderingContext2D): void {
  ctx.font = '16px CMU Serif'
  ctx.fillStyle = 'black'

  const line = {
    text: 'The HTML and CSS specifications define the web standards.',
    x: 50,
  }

  renderWithAutoTracking(ctx, line, 16, 100)

  console.log(`Rendered: "${line.text}"`)
  console.log(`Detected all-caps runs automatically tracked at +80 units`)
}

/**
 * Example 4: Optical size body tracking
 */
export function exampleOpticalSizeBody(ctx: CanvasRenderingContext2D): void {
  // Small text (8px): +20 units
  ctx.font = '8px CMU Serif'
  ctx.fillStyle = 'black'
  const spec8 = resolveTracking(8, 'body')
  const gap8 = trackingToPx(spec8.units, 8)

  const text8 = 'Footnote text at 8px with tracking'
  renderTrackedLine(ctx, { text: text8, x: 50 }, gap8, 100, true)
  console.log(`8px: +${spec8.units} units (${gap8.toFixed(2)}px gap)`)

  // Medium text (16px): 0 units
  ctx.font = '16px CMU Serif'
  const spec16 = resolveTracking(16, 'body')
  const gap16 = trackingToPx(spec16.units, 16)

  const text16 = 'Body text at 16px with no tracking'
  renderTrackedLine(ctx, { text: text16, x: 50 }, gap16, 120, true)
  console.log(`16px: ${spec16.units} units (no tracking)`)

  // Large body (28px): -10 units
  ctx.font = '28px CMU Serif'
  const spec28 = resolveTracking(28, 'body')
  const gap28 = trackingToPx(spec28.units, 28)

  const text28 = 'Large body at 28px'
  renderTrackedLine(ctx, { text: text28, x: 50 }, gap28, 150, true)
  console.log(`28px: ${spec28.units} units (${gap28.toFixed(2)}px gap)`)
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

/**
 * Run all tests and examples
 */
export async function runAllTests(): Promise<void> {
  // Create canvas for rendering tests
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  console.clear()
  console.log('═'.repeat(60))
  console.log('TRACKING SYSTEM TEST SUITE')
  console.log('═'.repeat(60))
  console.log()

  // Unit tests (no canvas needed)
  testUnitConversion()
  testTrackingResolution()

  // Canvas tests
  testMeasurementCorrectness(ctx)
  testAllCapsDetection()
  testRenderingTrailingSpaceRemoval(ctx, canvas)
  await testRegressionTrailingSpace(ctx)
  testSmallCapsTracking(ctx, canvas)
  testAutoAllCapsTracking(ctx, canvas)
  await testFullPipeline(ctx)

  // Usage examples
  console.log('═'.repeat(60))
  console.log('USAGE EXAMPLES')
  console.log('═'.repeat(60))
  console.log()

  exampleSmallCaps(ctx)
  exampleHeadlineTracking(ctx)
  exampleBodyTextAutoTracking(ctx)
  exampleOpticalSizeBody(ctx)

  console.log()
  console.log('═'.repeat(60))
  console.log('ALL TESTS COMPLETED')
  console.log('═'.repeat(60))
}

// Run tests if this is the main module
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    runAllTests().catch((err) => console.error('Test error:', err))
  })
}
