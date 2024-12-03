const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kufam', 'sans-serif'],
      },
    },
    colors: {
      primary: "#FFD6D6",
      highlight: "#C08AEA",
      hover: "#501A7A",
      disable: "#D09AFA"
    },
  },
  plugins: [],
});
