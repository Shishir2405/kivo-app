// Global stylesheet side-effect import (NativeWind / Tailwind entry).
declare module "*.css" {}

// SVG imports become React components via react-native-svg-transformer.
declare module "*.svg" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";
  const content: FC<SvgProps>;
  export default content;
}

// Raster assets resolve to a module id (number) for <Image source={...} />.
declare module "*.png" {
  const content: number;
  export default content;
}
declare module "*.jpg" {
  const content: number;
  export default content;
}
declare module "*.jpeg" {
  const content: number;
  export default content;
}
declare module "*.webp" {
  const content: number;
  export default content;
}
