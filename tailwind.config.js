/**
 * STEEP design system — Tailwind / NativeWind v4 tokens.
 * Editorial, calm, premium. Monochrome chrome + Rust accent + two washes.
 * Flat surfaces (1px Dove hairline + ONE subtle shadow). Small mobile scale.
 *
 * Mirrors src/theme/tokens.ts. Legacy class names (highlighter/carbon/paper/
 * canvas/...) are remapped onto Steep so existing className usage stays on-brand.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // --- Steep palette (prefer these) ---
        ink: "#17191c",
        white: "#ffffff",
        fog: "#f7f7f8",
        ash: "#4c4c4c",
        graphite: "#777b86",
        dove: "#a3a6af",
        rust: "#5d2a1a",
        apricot: "#fbe1d1",
        sky: "#d3e3fc",
        success: "#3f7d57",
        danger: "#9b3a2c",
        // --- Legacy aliases → remapped to Steep ---
        highlighter: "#17191c",
        annotation: "#9b3a2c",
        signal: "#777b86",
        peach: "#5d2a1a",
        sunbeam: "#17191c",
        carbon: "#17191c",
        paper: "#ffffff",
        canvas: "#ffffff",
        hairline: "#a3a6af",
        "shadow-gray": "rgba(23,25,28,0.06)",
        "highlighter-yellow": "#17191c",
        "annotation-red": "#9b3a2c",
        "signal-blue": "#777b86",
        "peach-wash": "#fbe1d1",
        "graphite-mist": "#f7f7f8",
        "hairline-gray": "#a3a6af",
      },
      fontFamily: {
        // --- Steep ---
        serif: ["Fraunces_400Regular"],
        "serif-medium": ["Fraunces_500Medium"],
        "serif-semibold": ["Fraunces_600SemiBold"],
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        // --- Legacy aliases → Steep ---
        display: ["Fraunces_600SemiBold"],
        "display-medium": ["Fraunces_500Medium"],
        "display-semibold": ["Fraunces_600SemiBold"],
        poppins: ["Fraunces_400Regular"],
        "sans-light": ["Inter_400Regular"],
        "sans-bold": ["Inter_500Medium"],
      },
      fontSize: {
        // Small Steep mobile scale (matches tokens.typeScale).
        caption: ["11px", { lineHeight: "15px" }],
        body: ["13px", { lineHeight: "18px", letterSpacing: "-0.1px" }],
        subheading: ["15px", { lineHeight: "20px", letterSpacing: "-0.15px" }],
        "heading-sm": ["16px", { lineHeight: "21px", letterSpacing: "-0.2px" }],
        heading: ["20px", { lineHeight: "25px", letterSpacing: "-0.3px" }],
        "heading-lg": ["22px", { lineHeight: "27px", letterSpacing: "-0.4px" }],
        display: ["26px", { lineHeight: "31px", letterSpacing: "-0.5px" }],
      },
      borderRadius: {
        pill: "9999px",
        card: "16px",
        "card-lg": "18px",
        input: "12px",
        frame: "14px",
      },
      spacing: {
        dot: "20px",
      },
      boxShadow: {
        // The ONE subtle Steep shadow.
        soft: "0px 2px 8px rgba(23,25,28,0.06)",
      },
    },
  },
  plugins: [],
};
