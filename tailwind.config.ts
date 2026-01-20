import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lavender: "#E8E4F0",
        coral: "#F08080",
      },
    },
  },
  plugins: [],
} satisfies Config;
