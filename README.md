Good. Now I have everything I need. Let me build the full implementation.Here's the full design and implementation. Let me walk you through every decision as I'd explain it in a real code review.

---

## §1 — Architecture Decision

Three candidate intercept points. Two are wrong, one is right.

**Option A — Before `prepare()`: inject ZWB adjusters.** Don't. Zero-width breaks mutate the string that pretext segments and measures. You'd have a `prepareWithSegments()` call measuring `"A\u200BV"` while your canvas draws `"AV"` — different strings. The line-break optimizer also treats U+200B as a break opportunity, so you've just made your heading silently wrappable at `"A"`. This isn't cleverness, it's sabotage.

**Option B — Patch `layoutWithLines()` internal x-arrays.** Don't. `PreparedTextWithSegments` internals are opaque by design. The internal segment model distinguishes at least eight break kinds — you'd be poking at a structure that can change between releases without notice. Worse, mutating shared prepared state means the same handle can't safely be reused at different sizes.

**Option C — Post-layout, at render time. ← This is the one.** `layoutWithLines()` returns `LayoutLine[]` with `.text`, `.width`, and `LayoutCursor` `.start`/`.end`. We split each `LayoutLine.text` into word-level `PreparedSegment[]`, set `ctx.fontKerning = "none"` to get raw advance widths, walk adjacent pairs through our kern table, accumulate offsets, and draw each segment at its corrected x via `ctx.fillText()`. Zero pretext internals touched. Survives every pretext minor version.

**The one real cost:** we call `ctx.measureText()` once per word-segment per line at render time. For a 40-line paragraph that's ~200–400 calls. At ~0.5µs each that's ≤0.2ms — not a problem. Cache `PreparedSegment[]` if you're animating.

---

## §2 — CMU Serif Kern Table (top 40 pairs)

The values are Computer Modern TFM kern data converted to em fractions at UPM=1000. The number is expressed in font units, one unit being a certain fraction of an em (one em is the type size currently used). Common values are 1000 and 2048 units/em.

CMU Serif, being the OpenType conversion of Knuth's original Metafont sources by Andrey Panov's cm-unicode project, preserves these kern values verbatim. Three tiers:

| Tier | Value | Pairs |
|---|---|---|
| LARGE | −0.111 em | `AV VA AW WA AY YA V. V,` |
| MEDIUM | −0.083 em | `Te To Ty Ta TA Ti Tr Ye Yo T. T,` |
| SMALL | −0.056 em | `Ve Va We Wa r. r, f. f,` |
| MICRO | −0.028 em | `fi fl ff` (ligature-adjacent, needed for kern-off mode) |

---

## §3 — Implementation Notes

**`lookupKern`**: falls back from `overrideTable` → `CMU_SERIF_KERN` → 0. A zero entry in the override table means "suppress this pair" — it does not fall through. Omit the key entirely to fall through.

**`getLastChar` / `getFirstChar`**: handle surrogate pairs correctly. CMU Serif doesn't have astral-plane glyphs, but defensive correctness matters — the moment you add emoji or CJK to a mixed-language product, a broken surrogate walk produces subtly wrong kern pair keys.

**RTL handling**: when both adjacent segments are RTL, the visual order is flipped. The pair key becomes `(firstChar(next), lastChar(seg))` — reversed — because "next" appears to the LEFT visually. Cross-bidi boundaries (one LTR, one RTL) get zero kern; that gap is owned by the Unicode Bidi Algorithm, not us.

**`ctx.fontKerning = "none"`**: The `fontKerning` property of the Canvas API specifies how font kerning information is used. Setting it to `"none"` disables font kerning information stored in the font. This is the correct kill switch — not `font-feature-settings` (which Canvas doesn't expose).

---

## §4 — What NOT to Do

**Mistake 1 — Double-applying native kern.** `ctx.fontKerning = "normal"` + manual x-shift = everything double-tightened. Pick one source of truth. `renderLine()` defaults `disableNativeKern = true` to prevent this.

**Mistake 2 — Rounding before accumulation.** At 24px, `0.028em = 0.672px`. Round that to 1px and you've introduced a 49% error per kern event. Over 40 characters that compiles into 3–5px of end-of-line drift, which is visible. Keep sub-pixel precision through the whole accumulation and only consider rounding at the final `fillText()` call, not before.

**Mistake 3 — Applying LTR kerns to RTL runs.** In an RTL run, logical "last char of seg[i]" is the rightmost glyph visually — the pair key flips. Skipping this produces wrong output on Arabic and Hebrew text. The implementation handles same-direction RTL correctly; mixed bidi within a single segment requires running the Unicode Bidi Algorithm first and splitting at direction-run boundaries before calling `segmentsFromLine()`.
