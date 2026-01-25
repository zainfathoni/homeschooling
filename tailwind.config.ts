import type { Config } from "tailwindcss";
import styles from "./app/styles/styles.json";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: styles.colors,
    },
  },
  plugins: [],
} satisfies Config;
