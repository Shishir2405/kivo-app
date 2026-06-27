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

// --- The ONLY real brand assets Steep keeps ---------------------------------
export { default as KivoMarkSvg } from "../../assets/brand/kivo-mark.svg";
export { default as LogoPrimarySvg } from "../../assets/brand/logo-primary.svg";

// --- Legacy decorative SVG names → re-pointed at the Kivo mark (no doodles) --
export { default as DiscordSvg } from "../../assets/brand/kivo-mark.svg";
export { default as TwitterSvg } from "../../assets/brand/kivo-mark.svg";
export { default as LinkedInSvg } from "../../assets/brand/kivo-mark.svg";
export { default as MediumSvg } from "../../assets/brand/kivo-mark.svg";
export { default as IconAddSvg } from "../../assets/brand/kivo-mark.svg";
export { default as IconMessageAddSvg } from "../../assets/brand/kivo-mark.svg";
export { default as ArrowLeftSvg } from "../../assets/brand/kivo-mark.svg";
export { default as ArrowRightSvg } from "../../assets/brand/kivo-mark.svg";
export { default as VectorMark1Svg } from "../../assets/brand/kivo-mark.svg";
export { default as VectorMark2Svg } from "../../assets/brand/kivo-mark.svg";
export { default as UnionShapeSvg } from "../../assets/brand/kivo-mark.svg";
export { default as WaveDecorationSvg } from "../../assets/brand/kivo-mark.svg";
export { default as FrameBadgeSvg } from "../../assets/brand/kivo-mark.svg";
export { default as FrameBadge2Svg } from "../../assets/brand/kivo-mark.svg";
export { default as GroupIllustration53Svg } from "../../assets/brand/kivo-mark.svg";
export { default as GroupIllustration361Svg } from "../../assets/brand/kivo-mark.svg";
export { default as GroupIllustration431Svg } from "../../assets/brand/kivo-mark.svg";

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
