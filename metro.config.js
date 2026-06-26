// Metro config: Expo defaults + react-native-svg-transformer (so `.svg`
// imports become React components) + NativeWind v4 (Tailwind for RN).
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// --- SVG transformer wiring -------------------------------------------------
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};

const { assetExts, sourceExts } = config.resolver;
config.resolver = {
  ...config.resolver,
  // .svg is no longer treated as a static asset...
  assetExts: assetExts.filter((ext) => ext !== "svg"),
  // ...it is treated as source so the transformer can turn it into a component.
  sourceExts: [...sourceExts, "svg"],
};

// --- NativeWind wiring ------------------------------------------------------
module.exports = withNativeWind(config, { input: "./global.css" });
