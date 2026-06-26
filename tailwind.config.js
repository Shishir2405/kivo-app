/**
 * Aaply design system — Tailwind / NativeWind v4 tokens.
 * Theme: light. "Digital sketchpad with electric highlighter."
 * Flat, rounded, dot-grid canvas, single soft shadow only.
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
        // Brand accents
        highlighter: "#e6e51e", // primary brand accent (pills, logo, highlights)
        annotation: "#f34646", // annotation red
        signal: "#466cf3", // signal blue
        peach: "#ff8562", // peach wash
        sunbeam: "#fff705", // sunbeam yellow
        // Ink & surfaces
        carbon: "#000000", // primary text / dark buttons
        paper: "#ffffff", // cards
        canvas: "#f2f2f2", // page canvas (graphite mist)
        hairline: "#e6e6e6", // borders
        "shadow-gray": "#cccccc", // shadow gray
        // Convenience aliases used across the app
        "highlighter-yellow": "#e6e51e",
        "annotation-red": "#f34646",
        "signal-blue": "#466cf3",
        "peach-wash": "#ff8562",
        "graphite-mist": "#f2f2f2",
        "hairline-gray": "#e6e6e6",
      },
      fontFamily: {
        // Display / headings
        display: ["Poppins_700Bold"],
        "display-medium": ["Poppins_500Medium"],
        "display-semibold": ["Poppins_600SemiBold"],
        poppins: ["Poppins_400Regular"],
        // Body / UI
        sans: ["Inter_400Regular"],
        "sans-light": ["Inter_300Light"],
        "sans-medium": ["Inter_500Medium"],
        "sans-bold": ["Inter_700Bold"],
      },
      fontSize: {
        // Aaply type scale
        caption: ["14px", { lineHeight: "20px" }],
        body: ["16px", { lineHeight: "24px" }],
        subheading: ["18px", { lineHeight: "26px", letterSpacing: "-0.5px" }],
        "heading-sm": ["27px", { lineHeight: "32px", letterSpacing: "-0.5px" }],
        heading: ["34px", { lineHeight: "38px", letterSpacing: "-1px" }],
        "heading-lg": ["52px", { lineHeight: "54px", letterSpacing: "-1.5px" }],
        display: ["57px", { lineHeight: "58px", letterSpacing: "-2px" }],
      },
      borderRadius: {
        pill: "9999px", // buttons & tags fully rounded
        card: "32px", // cards 30-40
        "card-lg": "40px",
        input: "16px", // inputs
        frame: "16px", // product / mockup frames
      },
      spacing: {
        // dot-grid spacing reference
        dot: "20px",
      },
      boxShadow: {
        // The ONE shadow. Used sparingly (nav / floating cards).
        soft: "0px 10px 10px -5px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
};
