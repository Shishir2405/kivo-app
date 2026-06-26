// --- SVG icon/illustration components ---------------------------------------
export { default as KivoMarkSvg } from "../../assets/brand/kivo-mark.svg";
export { default as LogoPrimarySvg } from "../../assets/brand/logo-primary.svg";
export { default as DiscordSvg } from "../../assets/brand/discord.svg";
export { default as TwitterSvg } from "../../assets/brand/twitter.svg";
export { default as LinkedInSvg } from "../../assets/brand/linkedin.svg";
export { default as MediumSvg } from "../../assets/brand/medium.svg";
export { default as IconAddSvg } from "../../assets/brand/icon-add.svg";
export { default as IconMessageAddSvg } from "../../assets/brand/icon-message-add.svg";
export { default as ArrowLeftSvg } from "../../assets/brand/arrow-left.svg";
export { default as ArrowRightSvg } from "../../assets/brand/arrow-right.svg";
export { default as VectorMark1Svg } from "../../assets/brand/vector-mark-1.svg";
export { default as VectorMark2Svg } from "../../assets/brand/vector-mark-2.svg";
export { default as UnionShapeSvg } from "../../assets/brand/union-shape.svg";
export { default as WaveDecorationSvg } from "../../assets/brand/wave-decoration.svg";
export { default as FrameBadgeSvg } from "../../assets/brand/frame-badge.svg";
export { default as FrameBadge2Svg } from "../../assets/brand/frame-badge-2.svg";
export { default as GroupIllustration53Svg } from "../../assets/brand/group-illustration-53.svg";
export { default as GroupIllustration361Svg } from "../../assets/brand/group-illustration-361.svg";
export { default as GroupIllustration431Svg } from "../../assets/brand/group-illustration-431.svg";

// --- Raster avatar assets (social proof / profiles) -------------------------
export const avatarAssets = {
  stack: require("../../assets/brand/avatars-stack.png"),
  popup: require("../../assets/brand/avatars-popup.png"),
  johny: require("../../assets/brand/avatar-johny.png"),
  dave: require("../../assets/brand/avatar-dave.png"),
  linda: require("../../assets/brand/avatar-linda.png"),
  a: require("../../assets/brand/avatar-a.png"),
  b: require("../../assets/brand/avatar-b.png"),
  c: require("../../assets/brand/avatar-c.png"),
  d: require("../../assets/brand/avatar-d.png"),
  e: require("../../assets/brand/avatar-e.png"),
  f: require("../../assets/brand/avatar-f.png"),
  circle1: require("../../assets/brand/avatar-circle-1.png"),
  circle2: require("../../assets/brand/avatar-circle-2.png"),
  circle3: require("../../assets/brand/avatar-circle-3.png"),
} as const;

/** Ordered avatar list used by the AvatarStack social-proof component. */
export const avatarStackList = [
  avatarAssets.a,
  avatarAssets.b,
  avatarAssets.c,
  avatarAssets.d,
  avatarAssets.e,
] as const;

// --- Decorative / illustration raster assets --------------------------------
export const illustrationAssets = {
  kivoLogo: require("../../assets/brand/kivo-logo.png"),
  phoneUi: require("../../assets/brand/mockup-phone-ui.png"),
  phoneHeart: require("../../assets/brand/mockup-phone-heart.png"),
  phoneClear: require("../../assets/brand/mockup-phone-clear.png"),
  chatBubble: require("../../assets/brand/chat-bubble.png"),
  cursor: require("../../assets/brand/cursor.png"),
  arrowDoodle: require("../../assets/brand/arrow-doodle.png"),
  decorationGroup: require("../../assets/brand/decoration-group-203.png"),
} as const;
