# Segoe Soft UI — FontLab Redesign Guide
### A Step-by-Step Type Design Brief for Senior Product Teams

**Typeface Working Title:** `Segoe Soft UI` / `Fluent Soft Sans` / `MarkdownOffice Sans`  
**Tool:** FontLab 8 (or FontLab VI)  
**Objective:** Redesign a Segoe UI–inspired humanist sans that is softer, safer, warmer, and more comfortable for long-form reading in enterprise productivity software.

---

## Table of Contents

1. [Project Setup in FontLab](#1-project-setup-in-fontlab)
2. [Importing Segoe UI as Reference](#2-importing-segoe-ui-as-reference)
3. [Establishing Global Metrics](#3-establishing-global-metrics)
4. [Softening Terminals — Global Strategy](#4-softening-terminals--global-strategy)
5. [Lowercase Glyph-by-Glyph Redesign](#5-lowercase-glyph-by-glyph-redesign)
6. [Uppercase Glyph-by-Glyph Redesign](#6-uppercase-glyph-by-glyph-redesign)
7. [Numeral Redesign for Dashboards](#7-numeral-redesign-for-dashboards)
8. [Spacing and Side Bearings](#8-spacing-and-side-bearings)
9. [Building the Weight System](#9-building-the-weight-system)
10. [Setting Up Variable Font Axes](#10-setting-up-variable-font-axes)
11. [Optical Size Tuning](#11-optical-size-tuning)
12. [Hinting and Rendering Optimization](#12-hinting-and-rendering-optimization)
13. [Exporting the Font Family](#13-exporting-the-font-family)
14. [Quality Assurance Checklist](#14-quality-assurance-checklist)

---

## 1. Project Setup in FontLab

### 1.1 Create a New Font

```
File → New Font
```

- Set **Units Per Em (UPM):** `2000`
  > Use 2000 UPM (not the standard 1000) for more precision when handling soft curves and subtle terminal rounding. FontLab handles this natively.
- **Font Family Name:** `MarkdownOffice Sans`
- **Style Name:** `Regular`

### 1.2 Configure Font Info

```
File → Font Info → Names
```

Fill in:

| Field | Value |
|---|---|
| Family Name | `MarkdownOffice Sans` |
| Designer | Your Name |
| Description | Humanist UI sans. Inspired by Segoe UI. Softer, warmer, enterprise-ready. |
| License | Your license |

### 1.3 Set Up the Grid

```
View → Grid → Edit Grid
```

- **Main grid:** `10 units`
- **Subdivision:** `5 units`
- **Snap to grid:** ON

> Tip: FontLab's Contour snapping helps maintain optical consistency when you soften terminals manually. A 10-unit grid at 2000 UPM gives you 0.5% precision per unit.

### 1.4 Configure Font Window Display

```
View → Show → Metrics Panel
View → Show → Coordinates Panel
```

Enable:
- [x] Show nodes
- [x] Show handles (BCPs)
- [x] Show guidelines
- [x] Show metrics lines

---

## 2. Importing Segoe UI as Reference

> **Legal note:** Use Segoe UI solely as a proportional and spacing reference. Do not copy or derive outlines. All contours must be original.

### 2.1 Open Reference Font

```
File → Open → segoeui.ttf (from your Windows installation)
```

Open it in a **separate FontLab window** as a read-only reference.

### 2.2 Set Up Side-by-Side Comparison

```
Window → Tile Vertically
```

Left window: your new font.  
Right window: Segoe UI reference.

### 2.3 Create a Tracing Layer (Optional)

In your new font, for each glyph:

```
Layers panel → Add Layer → Name: "Segoe Reference"
```

- Copy the Segoe outline into this layer at **50% opacity** (set in Layer options).
- Lock this layer.
- Draw your new outlines in the **main layer** above.

> This gives you proportional reference without tracing. Delete the reference layer before export.

---

## 3. Establishing Global Metrics

### 3.1 Set Vertical Metrics

```
File → Font Info → Metrics
```

Set these values (at 2000 UPM):

| Metric | Value | Notes |
|---|---|---|
| Units Per Em | `2000` | |
| Ascender | `1900` | Generous ascenders for grace |
| Cap Height | `1380` | Slightly lower than Segoe for softer weight |
| x-Height | `1040` | High x-height for UI readability |
| Descender | `-480` | Slightly deeper for rhythm |
| Line Gap | `0` | Control through OS/2 values |

> **Why these numbers?** Segoe UI has a compressed lowercase feel. Setting x-height at `1040/2000 = 52%` (vs Segoe's ~54%) slightly releases vertical pressure without sacrificing UI density.

### 3.2 Create Master Guidelines

```
Guides → Add Guide (horizontal)
```

Add guides at:
- `0` — Baseline
- `1040` — x-Height
- `1380` — Cap Height
- `1480` — Ascender line
- `-480` — Descender line
- `800` — Mid-cap guide (for optical corrections in uppercase)
- `520` — Mid-lowercase guide (for aperture checking)

### 3.3 Set Optical Correction Zones

Create **blue zones** for PostScript hinting:

```
File → Font Info → PS Hinting → Blue Zones
```

| Zone | Bottom | Top |
|---|---|---|
| Baseline zone | `-20` | `20` |
| x-Height zone | `1020` | `1060` |
| Cap Height zone | `1360` | `1400` |
| Ascender zone | `1460` | `1500` |
| Descender zone | `-500` | `-460` |

---

## 4. Softening Terminals — Global Strategy

This is the most important step. Establish your terminal softening conventions **before** drawing any glyphs. Consistency here defines the personality of the typeface.

### 4.1 Understanding Terminal Types in Segoe UI

Segoe UI uses three terminal styles you need to redesign:

| Terminal Type | Segoe Behavior | Your Redesign |
|---|---|---|
| Horizontal cut | Hard 90° horizontal slice | Rotate 5–8° → soft oblique angle |
| Diagonal cut | Sharp angled cut matching stroke angle | Slightly rounded end, soften the BCP tension |
| Vertical stem | Clean blunt end | Introduce 2–4 unit convex rounding |
| Curved terminal | Tight loop exit | Open the exit angle by 10–15° |

### 4.2 The Terminal Softening Technique in FontLab

For each terminal node:

**Step 1 — Identify the terminal node.**
In the Contour tool, click the end node of any open or curved stroke.

**Step 2 — Check the handle direction.**
```
Node Properties panel → BCP coordinates
```
The outgoing and incoming handles should be pulling the terminal toward a smooth curve.

**Step 3 — Apply a micro-rounding.**

For a horizontally-cut terminal (e.g., bottom of `l`):
- Select the two corner nodes forming the flat end.
- Use **Contour → Corners → Round Corners**
  ```
  Contour → Corners → Round Corners → Radius: 8–12 units (at 2000 UPM)
  ```
- This translates to approximately 4–6 units at 1000 UPM — subtle but perceptible.

> Do **not** use FontLab's auto-round for all corners. Apply it only to terminals. Structural joins in letters like `n`, `m`, `h` require manual BCP adjustment (covered in glyph-level steps).

### 4.3 Create a Terminal Style Guide Glyph

Before drawing production glyphs, create a test glyph in a Private Use Area slot (e.g., U+E001):

- Draw four terminal types: horizontal, oblique, vertical, curved.
- Finalize your softening decisions here.
- Use this as your visual reference throughout the project.

### 4.4 The "Breath Point" — A Key Design Rule

For every terminal:

> The terminal must feel like the stroke **exhales gently** rather than **cuts sharply**.

In practice: ensure the BCP (Bézier control point) handle on the inside of any terminal is pulled back by approximately `15–20%` of the stem width. This prevents the needle-like thinning that Segoe UI shows at curved exits.

---

## 5. Lowercase Glyph-by-Glyph Redesign

### 5.1 Lowercase `a` (Double-Story)

**Segoe UI problem:** The upper hook is tight. The bowl's lower-right exit is crisp and can feel sharp at small sizes.

**Step-by-step:**

1. Draw the bowl first. Make it slightly wider than Segoe (`~960 units wide` vs Segoe's implied narrowness).
2. The ball terminal at the top of the bowl: do **not** use a perfectly horizontal slice.
   ```
   Rotate the top terminal cut to approximately -7°
   ```
3. At the shoulder join (where the arc meets the stem), push the inside BCP handle slightly outward (`+10 units`) to create a rounder entry.
4. The spur at the bottom of the lower bowl — soften with:
   ```
   Contour → Corners → Round Corners → Radius: 6 units
   ```
5. Check the aperture (the open space at the right). It should be wider than Segoe — open the exit angle by `10–12°`.

**Quality check:** At 14px, the `a` should read clearly without the upper hook appearing to "spike."

---

### 5.2 Lowercase `e`

**Segoe UI problem:** The crossbar (horizontal arm) is high and the aperture is tight, creating slight visual pressure.

**Step-by-step:**

1. Set the crossbar height at `50%` of x-height (`520 units` at 2000 UPM).
   > Segoe places it slightly higher. Lowering by 1–2% opens the aperture optically.
2. Draw the main bowl. Make the widest point of the curve slightly lower than Segoe's — at `35–38%` of x-height rather than `40%`. This pushes visual weight downward for a more relaxed feeling.
3. The terminal end of the crossbar:
   - Do not cut it horizontally.
   - Apply a `5° upward tilt` to the end cut, so it points slightly toward the counter (like a soft Frutiger-style terminal).
4. The upper-left arc of `e`: use a slightly more generous curve tension. Ensure the leftmost BCP handle extends to at least `70%` of the bowl width.
5. Aperture: The exit gap at right should be `slightly wider than Segoe`. Open it by nudging the terminal exit node `15–20 units` to the right.

---

### 5.3 Lowercase `r`

**Segoe UI problem:** The shoulder curves up sharply and the terminal end can feel like a small hook pointing inward.

**Step-by-step:**

1. Draw the vertical stem normally to x-height.
2. At the shoulder departure point (approximately `85–90%` of x-height):
   - Draw the arch as a shallow curve going rightward.
   - The arch should travel approximately `350–380 units` to the right (at 2000 UPM).
3. At the terminal of `r`:
   - Avoid any downward hook tendency.
   - Apply a **flat oblique cut** at approximately `20°` from vertical — not horizontal, not too steep.
   - Use Round Corners with `Radius: 10 units` at this terminal only.
4. Inside the shoulder join: push the inside BCP (the concave area under the arch) outward by `8–12 units` relative to Segoe. This is the "humanist shoulder" — it makes `r` feel less mechanical.

---

### 5.4 Lowercase `n`, `m`, `h`

These three share the same arch structure. Redesign them together.

**Segoe UI problem:** The arch shoulder can feel stiff. The inside curve at the join between stem and arch is sometimes too tight.

**Step-by-step for `n`:**

1. Draw the first stem from baseline to x-height.
2. At the arch origin point (approximately `90%` of x-height on the left stem), begin the arch curve.
   - The arch should be slightly higher and more generous than Segoe's — set the highest point of the arch at `x-height + 2%` (`1060 units`) to give a lifted, airy feel.
3. The critical join: inside the arch where it meets the second stem:
   - Select the nodes forming the inside curve.
   - Push the inside BCP handle `12–15 units` outward (rightward for the interior).
   - This creates a rounded, comfortable concave transition — the key difference from Segoe.
4. The terminal at the bottom of the second stem (open end for `n`):
   - Apply a **5° oblique cut** rotated slightly toward the inside.
   - Round with `Radius: 8 units`.
5. For `m`: repeat the arch twice. Ensure both arches are metrically identical. Use FontLab's component/copy function.
6. For `h`: the arch is the same as `n`. The first stem extends to ascender height. Ensure the transition from tall stem to arch is smooth — use a gentle S-curve at the departure point.

---

### 5.5 Lowercase `u`

**Step-by-step:**

1. `u` is essentially an inverted `n`. Flip the arch drawing procedure.
2. At the bowl bottom (the curved base):
   - Make the radius slightly more generous than Segoe.
   - Set the lowest BCP pair to create a flatter bottom arc — this lifts visual weight slightly.
3. The terminal at top-right (the exit of `u`):
   - Apply the same `5° oblique cut + Radius: 8 units` treatment as `n`.

---

### 5.6 Lowercase `g` (Single-Story Recommended)

> **Recommendation:** Use a **single-story `g`** for maximum legibility at small UI sizes.
> A double-story `g` can be provided as a stylistic alternate (OpenType `ss01`).

**Step-by-step (single-story):**

1. Draw the upper bowl. Width: approximately `880–920 units` (at 2000 UPM).
2. The bowl should sit between baseline and x-height. Slightly open the counter.
3. At the lower right of the bowl, the descending tail:
   - Draw a gentle arc going down and to the left.
   - The tail should end at approximately `descender / 2` (around `-240 units`).
   - The tail terminal: soft oblique cut, `Radius: 10 units`.
4. The ear (small stroke at upper right of bowl):
   - Keep it short — approximately `180 units` long.
   - Use a `gentle S-curve` to avoid a spiky end.
   - Terminal: horizontal cut, `Radius: 6 units`.
5. Aperture at right side of bowl: open it `10°` wider than Segoe. This is the key warmth adjustment for `g`.

---

### 5.7 Lowercase `s`

**Segoe UI problem:** The spine can feel very crisp. The top and bottom terminals create visual tension.

**Step-by-step:**

1. The spine (the diagonal S-curve): avoid making it too steep. Use a moderate diagonal angle — approximately `12–15°` from vertical.
2. The top curve:
   - The terminal cut should be at approximately `20–25°` from horizontal (a gentle angle, not severe).
   - Apply `Radius: 8 units`.
3. The bottom curve:
   - Mirror the top terminal angle (rotate `180°`).
   - Ensure optical symmetry — `s` should feel balanced, not top-heavy.
4. The center transition (spine flex point):
   - This is the most delicate part. The two BCP handles at the spine center should be close to collinear (smooth node).
   - Set the handle lengths to approximately `55–60%` of the respective arc spans.
5. Apertures top and bottom: open both by nudging the terminal nodes outward by `15 units`. This is the most direct way to make `s` feel less tense.

---

### 5.8 Lowercase `t`

**Step-by-step:**

1. The vertical stem: draw it from descender (for `t`, approximately `-80 units` below baseline for a short descender) to approximately `120%` of x-height for the top.
2. The crossbar:
   - Position at approximately `75–78%` of x-height (`780–810 units`).
   - Width: extend approximately `280 units` left and `320 units` right of the stem for natural asymmetry.
   - Crossbar ends: apply a gentle oblique cut at both ends (`8°` from horizontal). Round with `Radius: 6 units`.
3. The top terminal:
   - In Segoe UI, this is a horizontal cut. In your redesign: use a `soft concave curve` — very subtle, just 6–8 units of depth.
   - This gives `t` a quiet, humanist feeling without looking calligraphic.
4. The bottom exit of the stem (below the crossbar): apply the same oblique terminal treatment as `r`.

---

### 5.9 Lowercase `k`

**Step-by-step:**

1. Draw the vertical stem.
2. The diagonal arm (upper right):
   - It should join the stem at approximately `65–70%` of x-height.
   - The diagonal angle should be approximately `35°` from vertical.
   - The terminal (upper right end): oblique cut, `Radius: 8 units`.
3. The diagonal leg (lower right):
   - Soften the join with the stem — do not use a sharp V-cut meeting point.
   - Instead, use a **small loop or curved connector** (Frutiger-style): add a tiny concave curve of `~30 units radius` at the stem join.
   - The leg terminal (lower right): oblique cut, `Radius: 8 units`.

---

### 5.10 Lowercase `v`, `w`, `y`

**Segoe UI problem:** Diagonal letters carry "razor-sharp" apex/nadir energy.

**Step-by-step for `v`:**

1. Draw the two diagonal strokes.
2. At the bottom apex (nadir):
   - Do **not** use a sharp point.
   - Use **Round Corners → Radius: 4–6 units** at the nadir.
   - This is a micro-adjustment — barely visible individually, but creates warmth across the font.
3. At the top terminals (both left and right):
   - Apply oblique cuts at `20°` from vertical.
   - Round with `Radius: 8 units`.

**For `w`:** Apply the same logic. The two interior apexes should both be micro-rounded (Radius: 4 units). The top peak of the interior stroke should also be rounded.

**For `y`:** The upper two arms follow `v` rules. The descending tail should have a graceful S-curve and a soft terminal (oblique cut, Radius: 10 units).

---

### 5.11 Lowercase `o`, `c`, `d`, `p`, `q`, `b`

These are the **round letters** — the warmth of the entire typeface lives here.

**Design principle:** Avoid perfect geometric circles. Use `superelliptical` curves with the widest point pushed approximately `4–6%` below center optical axis.

**Step-by-step for `o`:**

1. Draw using **4 nodes** at optical extremes (top, bottom, left, right).
2. The left and right extremes should be at `50%` of x-height.
3. The top and bottom: slightly flatten (less than a perfect circle).
   - Top arc: `1030 units` (4% below x-height top of arc compared to geometric).
   - Bottom arc: `10 units` above baseline.
4. BCP handles:
   - Horizontal handles (at left/right nodes): set to approximately `55%` of half-width.
   - Vertical handles (at top/bottom nodes): set to approximately `55%` of half-height.
   > This `55%` magic number (approximation of 4/3 × tan(π/8)) gives the most optically perfect circle in Bézier form.
5. Stroke modulation: introduce `very subtle` contrast — inner stroke thinning of no more than `10%` of stem width. This creates warmth without calligraphic stiffness.

**For `c`:** Start from `o`. Open the right side at approximately `20–25%` aperture. Terminals: top uses a gentle `15°` oblique cut; bottom uses a mirror. Apply `Radius: 8 units` to both.

**For `d`, `b`, `p`, `q`:** These are bowl + stem combinations. The bowls follow `o` rules. The stem-to-bowl join: use a smooth S-curve transition, not an abrupt join. The inside curve where bowl meets stem should be pulled `8–10 units` outward.

---

## 6. Uppercase Glyph-by-Glyph Redesign

### 6.1 Design Philosophy for Uppercase

Uppercase letters must feel **authoritative but not severe**. The target is the confidence of Segoe UI with the warmth of Frutiger.

---

### 6.2 Uppercase `A`

**Step-by-step:**

1. Draw the two diagonal stems. Angle: approximately `67°` from horizontal.
2. At the apex:
   - Do not sharpen to a geometric point.
   - Cut the apex flat at approximately `8%` of cap height from the top.
   - Round the flat cut corners: `Radius: 10 units`.
3. The crossbar: position at `35–37%` of cap height (slightly low for stability).
4. Diagonal terminal cuts: oblique at `20°`. `Radius: 8 units`.
5. The inner V-triangle (counter): make it slightly more open than Segoe — push the crossbar position to give the counter more air.

---

### 6.3 Uppercase `E`, `F`, `L`, `T`

These four share horizontal arm characteristics.

**For all arm terminals:**

- Avoid the hard `90°` flat end of Segoe's arms.
- Apply a very subtle `3–5°` tilt to each arm terminal end cut.
- `Radius: 6 units` on the cut corners.

**`E` specifically:**
- The middle arm should be slightly shorter than the top arm (`85%` of top arm length) and slightly shorter than the bottom arm (`90%`).
- This classical optical correction prevents `E` from looking bottom-heavy.
- The spine where arms meet: introduce `4 units` of fillet rounding at each inside junction.

**`T` specifically:**
- The top arm terminals: use the same oblique cut as the crossbar of lowercase `t`.
- The junction of the top arm and vertical stem: add a slight `bracket` — a small curved transition of `Radius: 15 units`. This softens the hard T-junction that Segoe UI keeps very crisp.

---

### 6.4 Uppercase `B`, `P`, `R`

**Step-by-step for `B`:**

1. The vertical stem: standard width.
2. Upper bowl: slightly smaller than lower bowl (`45% : 55%` ratio).
3. Each bowl-to-stem join (both top and bottom of each bowl): use a **generous bracket curve** — `Radius: 20–25 units`. This is much softer than Segoe's tight join.
4. The middle horizontal (between the two bowls): do not cut it flatly into the stem. Use a slight curve — the middle terminal has a `10°` oblique cut.

**For `P` and `R`:** Same bowl treatment. For `R`'s leg: follow the `k` leg principle — a slightly curved leg with a soft nadir.

---

### 6.5 Uppercase `C`, `G`, `O`, `Q`

Follow the same principles as lowercase `o` and `c`.

**`O` at uppercase scale:**
- Use the same superelliptical construction, scaled to cap height.
- Slight optical flattening top and bottom (approximately `3–5%`).
- Very low stroke contrast (maximum `8%`).

**`G`:**
- The spur (horizontal arm at right): keep it modest — `50–55%` of cap height.
- Spur terminal: horizontal cut, `Radius: 6 units`.
- The aperture opening: set at approximately `22–25%` of the full circle.

---

### 6.6 Uppercase `M`, `N`, `W`

**`M` step-by-step:**

1. The four strokes: draw the two outer verticals first.
2. The two inner diagonals meet at a nadir at approximately `50–55%` of cap height.
3. At the nadir (central low point of `M`):
   - Apply `Radius: 6 units` — micro-rounding to soften the sharp V.
4. At the apex of each diagonal meeting the outer stems (the "shoulder" of M):
   - Ensure a smooth transition — use a `small S-curve` rather than an abrupt angle change.

---

### 6.7 Uppercase `V`, `X`, `Y`

Follow the same logic as lowercase `v`, `y`. All diagonal apexes and nadirs: `Radius: 4–8 units`.

For `X`: the center crossover is the critical zone.
- In Segoe UI, the X-center can feel very tight.
- In your redesign: widen the cross zone by `8–10 units` — a slightly thicker center prevents the fragile wire-crossing look.

---

## 7. Numeral Redesign for Dashboards

### 7.1 General Numeral Design Principles

| Property | Value |
|---|---|
| Numeral style | `Lining figures` (primary); `Old-style figures` (alternate via OpenType `onum`) |
| Tabular vs Proportional | Both, via OpenType `tnum` / `pnum` |
| Height | Align to cap height (`1380 units`) |
| Width | Tabular set width: `1000 units` for all figures |

---

### 7.2 Numeral `2`

**Segoe UI problem:** The curve-to-diagonal transition can feel sharp.

**Step-by-step:**
1. Draw the upper bowl (approximately the top `55%` of the numeral).
2. The exit from the bowl into the diagonal stroke: use a gentle S-curve transition — do not make this a hard angular break.
3. The diagonal base stroke and horizontal foot: the corner where diagonal meets foot — `Radius: 10 units`.
4. The foot terminal (right end): oblique cut `5°`, `Radius: 6 units`.

---

### 7.3 Numeral `4`

**Segoe UI problem:** The triangular counter can feel harsh.

**Step-by-step:**
1. The diagonal arm (upper left): draw it to stop at approximately `55%` of numeral height, then turn horizontal to meet the vertical stem.
2. The corner where diagonal meets horizontal: `Radius: 12 units` — this is the key softening point.
3. The vertical stem continues through the horizontal arm and terminates below.
4. All terminal cuts: oblique at `12°`, `Radius: 6 units`.
5. Open the triangular counter slightly by adjusting the horizontal arm's position downward by `2–3%`.

---

### 7.4 Numeral `5`

**Step-by-step:**
1. The upper horizontal arm: same oblique terminal treatment as `E` arms.
2. The bowl: follow `o`/`c` principles — generous superelliptical curve.
3. The transition from vertical stem to bowl: this must be smooth — use an S-curve, `Radius: 20 units` at the bracket.
4. Open the lower aperture of `5`'s bowl by `10–12°`.

---

### 7.5 Numeral `7`

**Segoe UI problem:** The top horizontal arm and the diagonal can create a razor-like sensation.

**Step-by-step:**
1. The top horizontal arm: terminal at the right end — oblique cut `8°`, `Radius: 8 units`.
2. The arm-to-diagonal join (the left corner of the arm): `Radius: 10–12 units`.
3. The diagonal stroke: a **slight concave curvature** (very gentle — approximately `15 units` of curvature at 2000 UPM) makes the diagonal feel more humanist.
4. The terminal at the bottom of the diagonal: oblique cut `20°`, `Radius: 8 units`.
5. Optional: add a horizontal midbar as a stylistic alternate (OpenType `ss02`), common in European typography.

---

### 7.6 Numerals `6`, `8`, `9`

These need **more open apertures**.

**For `6`:**
1. The upper aperture (where the tail meets the bowl): open it by setting the entry angle of the tail at `25–28°` from vertical (wider than Segoe's tighter entry).
2. The upper terminal of the tail: oblique cut `10°`, `Radius: 8 units`.

**For `8`:**
1. The upper bowl should be slightly smaller than the lower bowl (`45% : 55%`).
2. The center waist (crossover zone): widen it by `10 units` — same principle as `X`.
3. The four join points where the two bowls meet the waist: use `Radius: 12–15 units`.

**For `9`:**
1. Mirror of `6` principles.
2. The tail exit at bottom: make it a smooth arc, not a sharp diagonal. A gentle S-curve terminating at `descender_midpoint`.
3. Open the aperture at top-right by `12–15°`.

---

## 8. Spacing and Side Bearings

### 8.1 Spacing Philosophy

> "Space is the breath of a typeface." — Adrian Frutiger

The new font should breathe slightly more than Segoe UI without losing productivity-software density.

### 8.2 Recommended Side Bearing Values (at 2000 UPM)

**Lowercase:**

| Glyph | Left SB | Right SB |
|---|---|---|
| `n` | 130 | 130 |
| `o` | 120 | 120 |
| `e` | 120 | 120 |
| `a` | 115 | 115 |
| `r` | 130 | 80 |
| `s` | 100 | 100 |
| `t` | 80 | 80 |
| `i` | 130 | 130 |
| `l` | 130 | 130 |

**Uppercase:**

| Glyph | Left SB | Right SB |
|---|---|---|
| `H` | 160 | 160 |
| `O` | 140 | 140 |
| `A` | 160 | 160 |
| `I` | 160 | 160 |

### 8.3 Setting Metrics in FontLab

```
Metrics → Edit Metrics
```

For each glyph:
1. Open the glyph in the Glyph window.
2. In the Metrics panel at the bottom, type the exact Left SB and Right SB values.
3. Use the **Metrics toolbar** to set kerning classes simultaneously.

### 8.4 Kerning Classes

```
Metrics → Kerning Classes
```

Create these classes:

**Left kerning classes:**
- `@L_A` : A, Á, Â, Ã...
- `@L_V` : V, W
- `@L_T` : T
- `@L_F` : F
- `@L_n` : n, m, h, r, u, k
- `@L_o` : o, c, e, d, q, b, p

**Right kerning classes:**
- `@R_A` : A, Á...
- `@R_V` : V, W, Y
- `@R_o` : o, c, e, d, q, b, p
- `@R_n` : n, m, h, r, u

### 8.5 Key Kerning Pairs (in units at 2000 UPM)

| Pair | Kern Value |
|---|---|
| `AV` | -120 |
| `VA` | -120 |
| `AW` | -100 |
| `WA` | -100 |
| `To` | -80 |
| `Te` | -80 |
| `Ta` | -80 |
| `Wa` | -60 |
| `Ye` | -80 |
| `f"` | -60 |
| `rv` | -30 |

---

## 9. Building the Weight System

### 9.1 Weight Interpolation Strategy

FontLab's **Multiple Masters** workflow is the foundation of your variable font.

```
File → Font Info → Masters
```

You will create **two masters** first:
- **Regular (wght: 400)**
- **Bold (wght: 700)**

Intermediate instances (Light 300, Medium 500, Semibold 600) are interpolated.

### 9.2 Setting Up Masters

**Step 1 — Duplicate your Regular master:**
```
Masters panel → Duplicate Master → Name: Bold
```

**Step 2 — Redesign the Bold master.**

In Bold:
- Increase all stem widths by approximately `55–60%` (e.g., Regular vertical stem: `160 units` → Bold: `250 units`).
- Reduce counter sizes proportionally to maintain open apertures.
- Keep the same node structure as Regular — same number of nodes, same positions, just moved.

> **Critical:** FontLab interpolates based on node order and index. Do not add or remove nodes between masters. Every contour must have identical topology.

**Step 3 — Verify interpolation:**
```
Preview → Variable Font Preview
```

Slide the weight axis and check for smooth interpolation. Watch for:
- Crossing contours
- Counter collapse (counters becoming too small in bold)
- Spacing that becomes too tight

### 9.3 Weight Stem Width Reference Table

| Weight | Name | wght value | Stem Width (at 2000 UPM) |
|---|---|---|---|
| 300 | Light | 300 | 110 units |
| 400 | Regular | 400 | 160 units |
| 500 | Medium | 500 | 190 units |
| 600 | Semibold | 600 | 220 units |
| 700 | Bold | 700 | 255 units |

> Light (300) should never fall below `110 units` stem width. Thinner weights feel cold and fragile — contrary to the design goal.

### 9.4 Weight-Specific Spacing Adjustments

Tighten spacing slightly as weight increases:

| Weight | n Left SB | n Right SB |
|---|---|---|
| Light | 145 | 145 |
| Regular | 130 | 130 |
| Medium | 120 | 120 |
| Semibold | 112 | 112 |
| Bold | 105 | 105 |

---

## 10. Setting Up Variable Font Axes

### 10.1 Define Custom Axes in FontLab

```
File → Font Info → Variation Axes
```

Add the following axes:

#### Axis 1: Weight (wght) — Registered Axis

| Property | Value |
|---|---|
| Tag | `wght` |
| Name | Weight |
| Minimum | `300` |
| Default | `400` |
| Maximum | `700` |

#### Axis 2: Optical Size (opsz) — Registered Axis

| Property | Value |
|---|---|
| Tag | `opsz` |
| Name | Optical Size |
| Minimum | `9` |
| Default | `14` |
| Maximum | `28` |

> For `opsz`, you need to create **two additional masters** — one tuned for small sizes (9pt) and one for large sizes (28pt). See Section 11.

#### Axis 3: Softness (SOFT) — Custom Axis

| Property | Value |
|---|---|
| Tag | `SOFT` |
| Name | Softness |
| Minimum | `0` |
| Default | `50` |
| Maximum | `100` |

> The `SOFT` axis controls terminal rounding and aperture openness. At 0: terminals approach Segoe-level sharpness (professional maximum). At 100: maximum softness (comfort maximum). This axis allows UI systems to tune the font personality.

#### Axis 4: Grade (GRAD) — Custom Axis

| Property | Value |
|---|---|
| Tag | `GRAD` |
| Name | Grade |
| Minimum | `-1` |
| Default | `0` |
| Maximum | `+1` |

> Grade changes stroke weight without changing width — useful for dark mode (negative grade) and low-contrast displays (positive grade).

### 10.2 Creating the Softness Axis Masters

The `SOFT` axis requires two masters at default weight:

**Master: SOFT=0 (Minimum Softness)**
- Terminal radii reduced to `2–3 units`
- Apertures match Segoe UI reference
- Corner radii at join points: `3–4 units`

**Master: SOFT=100 (Maximum Softness)**
- Terminal radii at full designed values (`8–12 units`)
- Apertures at maximum designed openness
- Corner radii at join points: `8–12 units`

> You are now working with a **4-axis design space**. FontLab 8 handles this natively through its Variation Axes panel.

### 10.3 Defining Variable Font Instances (Named Instances)

```
File → Font Info → Named Instances
```

Create these instances for the exported variable font:

| Instance Name | wght | opsz | SOFT | GRAD |
|---|---|---|---|---|
| Light | 300 | 14 | 50 | 0 |
| Regular | 400 | 14 | 50 | 0 |
| Medium | 500 | 14 | 50 | 0 |
| Semibold | 600 | 14 | 50 | 0 |
| Bold | 700 | 14 | 50 | 0 |
| Regular UI | 400 | 12 | 60 | 0 |
| Regular Display | 400 | 24 | 40 | 0 |
| Regular Dark | 400 | 14 | 50 | -1 |

---

## 11. Optical Size Tuning

### 11.1 Small Size Master (opsz=9)

Create a dedicated master for small optical sizes.

In the small-size master, apply these adjustments relative to the Regular default:

**Apertures:**
- Open all aperture angles by an additional `8–10°`
- `e` crossbar: lower by `2%` of x-height for better distinction from `c`
- `a` bowl: widen by `30 units`
- `g` ear: shorten by `20 units`

**Spacing:**
- Increase all side bearings by `12–15 units`
- Increase kerning values (reduce compensation) by `15%`

**Stem weights:**
- Add `8–10 units` to Regular stem width (prevents stems from looking too thin at small raster sizes)

**Counters:**
- Expand counters by `15–20 units` across all round letters

**Contrast:**
- Reduce stroke modulation to near-zero at opsz=9. Flat strokes render better at small sizes.

### 11.2 Large Size Master (opsz=28)

In the large-size master:

**Proportions:**
- Slightly narrow the overall glyph widths (about `2–3%`) for a more elegant, refined appearance at display sizes.

**Spacing:**
- Tighten side bearings by `10 units` from default.

**Curves:**
- Increase stroke modulation slightly (`12–15%` contrast) for a more elegant, premium feel at display sizes.

**Terminals:**
- Refine terminal cuts to be slightly more precise — they will be visible at large sizes and should look intentionally crafted.

---

## 12. Hinting and Rendering Optimization

### 12.1 PostScript Hinting

```
Tools → Hinting → Add PS Hints
```

For vertical stems (lowercase):
- Select left and right edges of stem.
- Add **VStem hint**: `VStem → width: 160 units`.

For horizontal stems (crossbars, serifs if any):
- Add **HStem hint**: `HStem → height at x-height`.

### 12.2 TrueType Hinting (for Windows ClearType)

```
Tools → TrueType Hinting
```

FontLab 8 has an **auto-hinting engine**. For this font:
1. Run **Auto TT Hint** on all glyphs.
2. Manually review at `ppem 12, 13, 14, 16` (the critical UI sizes).
3. Adjust Y-direction hints at x-height, cap height, and baseline for clean raster alignment.

### 12.3 Testing Rendering Across Platforms

**In FontLab preview:**
```
Preview → Show Rasterization → 14px
```

Test at:
- 12px
- 13px
- 14px
- 16px
- 20px
- 24px (display)

Check for:
- [ ] `e` aperture readable (not merging with bowl)
- [ ] `a` double-story clearly distinct
- [ ] `r` not resembling `n` at small sizes
- [ ] `6`, `9` openings clear
- [ ] `8` waist not collapsing
- [ ] Weight contrast still readable
- [ ] Spacing comfortable (no crowding)

### 12.4 Anti-Aliasing Mode Targets

| Platform | AA Mode | Priority |
|---|---|---|
| macOS | Subpixel (legacy) / Grayscale (Retina) | Grayscale primary |
| Windows | ClearType | TrueType hinting critical |
| Web/Chromium | FreeType Grayscale | PostScript hints |
| Figma | Grayscale | Smooth, slightly blurry is acceptable |

---

## 13. Exporting the Font Family

### 13.1 Export Variable Font (VF)

```
File → Export Font As
```

Settings:

| Option | Value |
|---|---|
| Format | `OpenType TT (.ttf)` — Variable Font |
| Include variable font tables | ✅ ON |
| STAT table | ✅ ON (critical for variable font naming) |
| Features | ✅ OpenType layout features |
| Autohint | ✅ ON |

### 13.2 Export Static Instances

```
File → Export Instances
```

Export each named instance as:
- `MarkdownOfficeSans-Light.ttf`
- `MarkdownOfficeSans-Regular.ttf`
- `MarkdownOfficeSans-Medium.ttf`
- `MarkdownOfficeSans-Semibold.ttf`
- `MarkdownOfficeSans-Bold.ttf`

And web-optimized:
- `MarkdownOfficeSans-VF.woff2` (variable font, subset to Latin)

### 13.3 Subsetting for Web Performance

```
Tools → Subset → Latin Extended
```

For web deployment, subset to:
- Basic Latin (U+0020–U+007E)
- Latin-1 Supplement (U+00A0–U+00FF)
- Latin Extended-A (U+0100–U+017F)
- Common punctuation and symbols
- Numerals (tabular + proportional)
- Currency symbols

Target file size for variable font WOFF2: `< 120KB`.

---

## 14. Quality Assurance Checklist

Run through this checklist before finalizing the font.

### 14.1 Glyph Completeness

- [ ] All lowercase a–z complete
- [ ] All uppercase A–Z complete
- [ ] Numerals 0–9 (lining and old-style)
- [ ] Tabular figures aligned
- [ ] Common punctuation: . , ; : ! ? ' " ( ) [ ] { }
- [ ] Currency: $ € £ ¥ ₹
- [ ] Mathematical: + − × ÷ = < > ≤ ≥
- [ ] Accented Latin for Western and Eastern European languages
- [ ] Arrows: → ← ↑ ↓ (for UI use)
- [ ] Ellipsis: … (as a single glyph)

### 14.2 Design Consistency

- [ ] All terminals follow the defined softening convention
- [ ] No glyph retains a razor-sharp terminal inconsistent with the design brief
- [ ] All arch joins (n, m, h, u) have the correct inside BCP softening
- [ ] All round glyphs use superelliptical construction (not geometric circles)
- [ ] Apertures are more open than Segoe UI reference in: e, a, s, c, g, 6, 8, 9
- [ ] Diagonal apexes/nadirs (v, w, y, A, V, W) have micro-rounding applied
- [ ] Spacing feels breathable in all UI contexts

### 14.3 Technical Validation

```
Tools → Font Audit
```

- [ ] No open contours
- [ ] No duplicate nodes
- [ ] No extremely short segments (< 4 units)
- [ ] All contours drawn in correct direction (counterclockwise for outer, clockwise for inner)
- [ ] Extrema nodes placed at all optical extremes (top, bottom, left, right of every curve)
- [ ] No interpolation errors across variable font masters

### 14.4 Metrics Validation

- [ ] Consistent baseline alignment across all glyphs
- [ ] x-height consistent (test using `o`, `n`, `e` against guideline)
- [ ] Cap height consistent across all uppercase
- [ ] Tabular numerals all equal width
- [ ] Spacing comfortable at 12px, 14px, 16px, 20px

### 14.5 Specimen Test String

Test the following strings at multiple sizes and weights:

```
Regular business documents | AI-native productivity
MarkdownOffice Suite 2025 — Enterprise Edition

Entropy grows. Knowledge endures.
abcdefghijklmnopqrstuvwxyz
ABCDEFGHIJKLMNOPQRSTUVWXYZ
0123456789 $42,800.00 — €19.99

The quick brown fox jumps over the lazy dog.
Pack my box with five dozen liquor jugs.

In 2025, revenue grew 14.6% across Q3–Q4.
Dashboard • Sidebar • Ribbon • Status Bar
```

**Review at:**
- 12px (status bars, file trees)
- 14px (primary UI text)
- 16px (document body)
- 20px (document titles)
- 32px (display/heading)

---

## Appendix: Recommended CSS Font Stack

```css
/* MarkdownOffice Sans variable font */
@font-face {
  font-family: 'MarkdownOffice Sans';
  src: url('MarkdownOfficeSans-VF.woff2') format('woff2-variations');
  font-weight: 300 700;
  font-style: normal;
  font-display: swap;
  font-optical-sizing: auto;
}

:root {
  --font-ui: 'MarkdownOffice Sans', 'Segoe UI Variable', 'Segoe UI',
             system-ui, -apple-system, sans-serif;
  --font-mono: 'Cascadia Code', 'Fira Code', monospace;
}

/* UI body text */
body {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 400;
  font-variation-settings: 'opsz' 14, 'SOFT' 50, 'GRAD' 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Document body (long reading) */
.document-body {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.65;
  font-variation-settings: 'opsz' 16, 'SOFT' 60, 'GRAD' 0;
}

/* Ribbon / Toolbar labels */
.ribbon-label {
  font-size: 12px;
  font-weight: 500;
  font-variation-settings: 'opsz' 12, 'SOFT' 50, 'GRAD' 0;
  letter-spacing: 0.01em;
}

/* Headings */
h1 {
  font-size: 28px;
  font-weight: 600;
  font-variation-settings: 'opsz' 28, 'SOFT' 40, 'GRAD' 0;
  letter-spacing: -0.02em;
}

/* Dashboard numbers */
.dashboard-value {
  font-size: 32px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  font-variation-settings: 'opsz' 28, 'SOFT' 45, 'GRAD' 0;
}

/* Dark mode adjustment */
@media (prefers-color-scheme: dark) {
  body {
    font-variation-settings: 'opsz' 14, 'SOFT' 55, 'GRAD' -1;
  }
}
```

---

*Brief prepared for the MarkdownOffice Design Systems Team.*  
*Version 1.0 — FontLab 8 Implementation Guide*  
*Classification: Internal Product Design Reference*
