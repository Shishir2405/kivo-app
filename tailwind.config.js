/**
 * KIVO design system — Tailwind / NativeWind v4 tokens (warm editorial).
 *
 * Mirrors src/theme/tokens.ts (the LIGHT palette is the default token set here;
 * runtime dark theming is handled by the ThemeProvider / useTheme in JS, since
 * NativeWind class-based dark variants aren't wired). Legacy class names
 * (highlighter / carbon / paper / canvas / dove / ...) are remapped onto Kivo
 * so existing className usage stays on-brand.
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
        // --- Kivo palette (prefer these) ---
        canvas: "#F7F3ED",
        surface: "#FFFFFF",
        "surface-alt": "#EDE7DD",
        ink: "#211C17",
        "ink-inverted": "#F7F3ED",
        muted: "#8C8377",
        hairline: "#E8E1D6",
        primary: "#C46A3D",
        "primary-pressed": "#AE5A30",
        "primary-wash": "#F6E2DC",
        // --- Five card washes (bg) ---
        peach: "#FAE7DB",
        sky: "#E1EBF0",
        mint: "#E0EDE4",
        lavender: "#EBE6F2",
        butter: "#F4EBD2",
        // --- Matching deep accents ---
        "peach-accent": "#BD6238",
        "sky-accent": "#3C7488",
        "mint-accent": "#3C7E5D",
        "lavender-accent": "#6A569A",
        "butter-accent": "#927428",
        // --- Semantic ---
        success: "#3C7E5D",
        warn: "#927428",
        danger: "#BE5440",
        // --- Dark palette (use via JS useTheme; provided for reference) ---
        "canvas-dark": "#181511",
        "surface-dark": "#23201A",
        "ink-dark": "#F7F3ED",
        "muted-dark": "#A89F92",
        "hairline-dark": "#3A3026",
        // --- Legacy aliases → remapped to Kivo ---
        white: "#FFFFFF",
        paper: "#FFFFFF",
        fog: "#EDE7DD",
        ash: "#3F382F",
        graphite: "#8C8377",
        dove: "#E8E1D6",
        rust: "#C46A3D",
        apricot: "#FAE7DB",
        highlighter: "#211C17",
        annotation: "#BE5440",
        signal: "#8C8377",
        sunbeam: "#211C17",
        carbon: "#211C17",
        "shadow-gray": "rgba(33,28,23,0.06)",
        "highlighter-yellow": "#211C17",
        "annotation-red": "#BE5440",
        "signal-blue": "#8C8377",
        "peach-wash": "#FAE7DB",
        "graphite-mist": "#EDE7DD",
        "hairline-gray": "#E8E1D6",
      },
      fontFamily: {
        // --- Kivo: Newsreader (serif) + Figtree (sans) + JetBrains Mono ---
        serif: ["Newsreader_400Regular"],
        "serif-medium": ["Newsreader_500Medium"],
        "serif-semibold": ["Newsreader_600SemiBold"],
        sans: ["Figtree_400Regular"],
        "sans-medium": ["Figtree_500Medium"],
        "sans-semibold": ["Figtree_600SemiBold"],
        "sans-bold": ["Figtree_700Bold"],
        mono: ["JetBrainsMono_400Regular"],
        "mono-medium": ["JetBrainsMono_500Medium"],
        // --- Legacy aliases → Kivo ---
        display: ["Newsreader_600SemiBold"],
        "display-medium": ["Newsreader_500Medium"],
        "display-semibold": ["Newsreader_600SemiBold"],
        poppins: ["Figtree_700Bold"],
        "sans-light": ["Figtree_400Regular"],
      },
      fontSize: {
        // Kivo mobile scale (matches tokens.typeScale).
        overline: ["11px", { lineHeight: "14px", letterSpacing: "1.5px" }],
        caption: ["13px", { lineHeight: "17px" }],
        body: ["15px", { lineHeight: "21px", letterSpacing: "-0.1px" }],
        subheading: ["16px", { lineHeight: "22px", letterSpacing: "-0.15px" }],
        "heading-sm": ["17px", { lineHeight: "23px", letterSpacing: "-0.2px" }],
        heading: ["24px", { lineHeight: "29px", letterSpacing: "-0.3px" }],
        "heading-lg": ["28px", { lineHeight: "32px", letterSpacing: "-0.4px" }],
        display: ["36px", { lineHeight: "40px", letterSpacing: "-0.6px" }],
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
        // The ONE soft Kivo shadow.
        soft: "0px 4px 14px rgba(33,28,23,0.06)",
      },
    },
  },
  plugins: [],
};
