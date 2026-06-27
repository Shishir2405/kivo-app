/**
 * Brand assets — STEEP keeps ONLY the Kivo logo mark.
 *
 * The old decorative set (avatars, phone mockups, doodles, illustration SVGs,
 * social glyphs, thumbs) is no longer part of the design. To keep the build
 * green while screen agents remove the remaining usages, the decorative export
 * NAMES are preserved but re-pointed at the Kivo mark (SVG entries) or the Kivo
 * logo raster (image maps). Nothing here references a doodle/avatar/mockup file.
 *
 * Screen agents: do NOT add new imports from this module other than
 * `KivoMarkSvg` / `LogoPrimarySvg`. Remove the legacy decorative usages from
 * screens; these aliases exist only as a temporary compile shim.
 */

// NOTE: the old brand SVGs (kivo-mark.svg / logo-primary.svg) have been removed.
// The official mark + lockup are PNGs now (assets/brand/kivo-mark.png +
// kivo-logo.png) — render them via `BrandLogo` / `KIVO_MARK`. The legacy SVG
// component exports were unused (nothing rendered them), so they are gone.

// --- Legacy raster maps → re-pointed at the Kivo logo (no avatars/mockups) ---
const kivoLogo = require("../../assets/brand/kivo-logo.png");

/** @deprecated Steep has no decorative avatars. All map to the Kivo logo. */
export const avatarAssets = {
  stack: kivoLogo,
  popup: kivoLogo,
  johny: kivoLogo,
  dave: kivoLogo,
  linda: kivoLogo,
  a: kivoLogo,
  b: kivoLogo,
  c: kivoLogo,
  d: kivoLogo,
  e: kivoLogo,
  f: kivoLogo,
  circle1: kivoLogo,
  circle2: kivoLogo,
  circle3: kivoLogo,
} as const;

/** @deprecated Steep has no avatar stack. Empty so nothing renders. */
export const avatarStackList = [] as const;

/** @deprecated Steep has no decorative imagery. All map to the Kivo logo. */
export const illustrationAssets = {
  kivoLogo,
  phoneUi: kivoLogo,
  phoneHeart: kivoLogo,
  phoneClear: kivoLogo,
  chatBubble: kivoLogo,
  cursor: kivoLogo,
  arrowDoodle: kivoLogo,
  decorationGroup: kivoLogo,
} as const;
