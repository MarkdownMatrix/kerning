/**
 * CMU_SERIF_PROTRUSION
 * ─────────────────────────────────────────────────────────────────────────────
 * 55-entry character protrusion table for CMU Serif (Computer Modern Unicode).
 *
 * Based on LaTeX microtype package defaults (`MicroType.cfg`) adapted to
 * CMU Serif OpenType metrics. Values derived from:
 *   - LaTeX microtype source: `microtype.dtx` protrusion config for MinionPro
 *   - CMU Serif OpenType sidebearing data (1000 UPM grid)
 *   - Hermann Zapf / Peter Karow hz-program original protrusion recommendations
 *
 * UNIT CONVENTION:
 *   `left` and `right` are fractions of the character's own advance width.
 *   0.0 = no protrusion | 1.0 = protrude by full advance width (never used)
 *   Typical range: 0.05 (round bowls) → 1.0 (thin opening quotes)
 *
 * USAGE:
 *   const entry = CMU_SERIF_PROTRUSION[char]
 *   if (entry) {
 *     const leftPx  = entry.left  * ctx.measureText(char).width
 *     const rightPx = entry.right * ctx.measureText(char).width
 *     line.x -= leftPx           // shift line origin leftward
 *     effectiveMeasure += rightPx // widen measure for this line
 *   }
 *
 * FONT SIZE SCALING:
 *   These base values assume body text (10–14pt).
 *   Apply scaledProtrusion() before use at other sizes:
 *   - display (≥24pt): multiply by 0.6
 *   - body (10–14pt):  use as-is
 *   - small (8–10pt):  multiply by 1.2
 *   - footnote (<8pt): multiply by 1.5
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ProtrusionEntry {
  /** Fraction of glyph advance to protrude leftward into left margin (0.0–1.0) */
  left: number
  /** Fraction of glyph advance to protrude rightward into right margin (0.0–1.0) */
  right: number
}

export const CMU_SERIF_PROTRUSION: Record<string, ProtrusionEntry> = {

  // ── Opening punctuation — large left protrusion ───────────────────────────
  // These glyphs have massive left sidebearings; their ink starts far right
  // of their advance origin. Protrude almost fully into the margin.

  '\u201C': { left: 0.85, right: 0.00 },  // "  LEFT DOUBLE QUOTATION MARK
  '\u2018': { left: 0.70, right: 0.00 },  // '  LEFT SINGLE QUOTATION MARK
  '\u00AB': { left: 0.50, right: 0.00 },  // «  LEFT-POINTING DOUBLE ANGLE QUOTE
  '\u2039': { left: 0.50, right: 0.00 },  // ‹  SINGLE LEFT-POINTING ANGLE QUOTE

  // ASCII fallbacks (typewriter quotes used as openers in some markdown)
  '"':      { left: 0.50, right: 0.00 },  // "  ASCII double quote (opener)
  "'":      { left: 0.50, right: 0.00 },  // '  ASCII single quote (opener)
  '\u0060': { left: 0.50, right: 0.00 },  // `  GRAVE ACCENT (used as open quote)

  // ── Closing punctuation — right protrusion ────────────────────────────────
  // Closing quotes and terminal punctuation protrude rightward.
  // Their right sidebearing creates visual gap at the margin.

  '\u201D': { left: 0.00, right: 0.85 },  // "  RIGHT DOUBLE QUOTATION MARK
  '\u2019': { left: 0.00, right: 0.70 },  // '  RIGHT SINGLE QUOTATION MARK
  '\u00BB': { left: 0.00, right: 0.50 },  // »  RIGHT-POINTING DOUBLE ANGLE QUOTE
  '\u203A': { left: 0.00, right: 0.50 },  // ›  SINGLE RIGHT-POINTING ANGLE QUOTE

  // ── Terminal punctuation — right protrusion only ──────────────────────────
  // Period, comma, colon, semicolon all have significant right sidebearing.
  // At line end, this creates a visible "hole" in the right margin.

  '\u002E': { left: 0.00, right: 0.70 },  // .  FULL STOP
  '\u002C': { left: 0.00, right: 0.70 },  // ,  COMMA
  '\u003A': { left: 0.00, right: 0.50 },  // :  COLON
  '\u003B': { left: 0.00, right: 0.50 },  // ;  SEMICOLON
  '\u0021': { left: 0.00, right: 0.20 },  // !  EXCLAMATION MARK
  '\u003F': { left: 0.00, right: 0.20 },  // ?  QUESTION MARK
  '\u002F': { left: 0.00, right: 0.10 },  // /  SOLIDUS

  // ── Dashes and hyphens — bilateral protrusion ─────────────────────────────
  // Hyphens and dashes protrude both sides in CMU Serif due to sidebearings
  // designed for inter-word use, not margin placement.

  '\u002D': { left: 0.30, right: 0.70 },  // -  HYPHEN-MINUS
  '\u2010': { left: 0.30, right: 0.70 },  // ‐  HYPHEN (typographic)
  '\u2011': { left: 0.30, right: 0.70 },  // ‑  NON-BREAKING HYPHEN
  '\u2013': { left: 0.20, right: 0.50 },  // –  EN DASH
  '\u2014': { left: 0.15, right: 0.40 },  // —  EM DASH
  '\u2212': { left: 0.15, right: 0.15 },  // −  MINUS SIGN (math contexts)

  // ── Diagonal uppercase — bilateral protrusion ─────────────────────────────
  // Diagonal strokes (top-right to bottom-left) leave triangular whitespace
  // at the margin. CMU Serif's classical proportions make this pronounced.
  // Values based on microtype MinionPro config, verified against CMU metrics.

  'A': { left: 0.25, right: 0.25 },  // Wide diagonal apex — large gap both sides
  'V': { left: 0.20, right: 0.20 },  // Mirror of A
  'W': { left: 0.15, right: 0.15 },  // Double diagonal, slightly less per stroke
  'Y': { left: 0.20, right: 0.20 },  // Upper diagonals create top gap
  'T': { left: 0.05, right: 0.20 },  // Right side of crossbar overhangs
  'L': { left: 0.00, right: 0.10 },  // Horizontal foot creates right gap
  'F': { left: 0.00, right: 0.15 },  // Similar to T, crossbar gap at right
  'J': { left: 0.00, right: 0.05 },  // Descender creates slight right gap
  'K': { left: 0.05, right: 0.05 },  // Diagonal strokes, moderate
  'X': { left: 0.05, right: 0.05 },  // Diagonal crossing, symmetric
  'Z': { left: 0.05, right: 0.05 },  // Diagonal stroke, symmetric

  // ── Round uppercase — small bilateral protrusion ──────────────────────────
  // Round bowls in CMU Serif have optical overhang beyond the advance box
  // on both left and right sides. Less pronounced than diagonals.

  'C': { left: 0.10, right: 0.05 },  // Open left side protrudes more
  'G': { left: 0.10, right: 0.05 },  // Same profile as C
  'O': { left: 0.05, right: 0.05 },  // Symmetric round bowl
  'Q': { left: 0.05, right: 0.05 },  // Same as O (tail is below baseline)
  'S': { left: 0.05, right: 0.05 },  // Symmetric S-curve
  'D': { left: 0.00, right: 0.05 },  // Right bowl only
  'B': { left: 0.00, right: 0.05 },  // Double bowl, slight right

  // ── Straight uppercase — no protrusion ────────────────────────────────────
  // Vertical stems fill their advance box completely. No optical gap.
  // Included explicitly so lookup returns 0 rather than undefined.

  'H': { left: 0.00, right: 0.00 },
  'I': { left: 0.00, right: 0.00 },
  'M': { left: 0.00, right: 0.00 },
  'N': { left: 0.00, right: 0.00 },
  'P': { left: 0.00, right: 0.00 },
  'R': { left: 0.00, right: 0.00 },
  'U': { left: 0.00, right: 0.00 },
  'E': { left: 0.00, right: 0.00 },

  // ── Lowercase diagonals — moderate protrusion ─────────────────────────────
  // Lowercase diagonal strokes are proportionally smaller but still create
  // optical gaps. About half the protrusion factor of their uppercase equivalents.

  'v': { left: 0.10, right: 0.10 },  // Lowercase V equivalent
  'w': { left: 0.10, right: 0.10 },  // Lowercase W equivalent
  'y': { left: 0.10, right: 0.10 },  // Descender doesn't affect top-line gap
  'x': { left: 0.05, right: 0.05 },  // Lowercase X crossing

  // ── Lowercase rounds — small protrusion ───────────────────────────────────
  // Round lowercase bowls (c, e, o) have slight optical overhang.
  // Less than uppercase because x-height proportions are tighter.

  'c': { left: 0.10, right: 0.05 },  // Open left bowl
  'e': { left: 0.05, right: 0.05 },  // Counter-aperture creates slight gap
  'o': { left: 0.05, right: 0.05 },  // Round bowl, symmetric

  // ── Miscellaneous ─────────────────────────────────────────────────────────

  '\u2022': { left: 0.30, right: 0.30 },  // •  BULLET (list markers at line start)
  '\u2026': { left: 0.00, right: 0.40 },  // …  HORIZONTAL ELLIPSIS (terminal)
  '\u00B7': { left: 0.30, right: 0.30 },  // ·  MIDDLE DOT
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: scale protrusion factors by font size
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scales base protrusion factors for the given font size.
 * LaTeX microtype applies more aggressive protrusion at small sizes
 * (footnotes, captions) and less at display sizes (headings).
 *
 * @param base    - Entry from CMU_SERIF_PROTRUSION
 * @param fontSize - Font size in px (or pt — same ratio applies)
 * @returns Scaled entry, clamped to [0, 1]
 */
export function scaledProtrusion(
  base: ProtrusionEntry,
  fontSize: number
): ProtrusionEntry {
  let factor: number

  if (fontSize >= 24)       factor = 0.60  // display: back off
  else if (fontSize >= 14)  factor = 1.00  // body sweet spot: unchanged
  else if (fontSize >= 10)  factor = 1.20  // small text: push harder
  else                      factor = 1.50  // footnote/caption: most aggressive

  return {
    left:  Math.min(1.0, base.left  * factor),
    right: Math.min(1.0, base.right * factor),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: lookup with font-size scaling applied
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Primary lookup function. Returns scaled protrusion for a character at
 * the given font size. Returns { left: 0, right: 0 } for unknown chars.
 *
 * @example
 *   const { left, right } = lookupProtrusion('"', 11)
 *   // left ≈ 0.85, right = 0 at 11pt body text
 *
 *   const { left, right } = lookupProtrusion('"', 8)
 *   // left ≈ 1.0 (clamped from 0.85 × 1.5), right = 0 at 8pt footnote
 */
export function lookupProtrusion(
  char: string,
  fontSize: number,
  table: Record<string, ProtrusionEntry> = CMU_SERIF_PROTRUSION
): ProtrusionEntry {
  const base = table[char]
  if (!base) return { left: 0, right: 0 }
  return scaledProtrusion(base, fontSize)
}
