/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Using existing color definitions from the index.css
        red: {
          '50': 'oklch(.971 .013 17.38)',
          '100': 'oklch(.936 .032 17.717)',
          '200': 'oklch(.885 .062 18.334)',
          '600': 'oklch(.577 .245 27.325)',
          '700': 'oklch(.505 .213 27.518)',
          '800': 'oklch(.444 .177 26.899)',
        },
        yellow: {
          '50': 'oklch(.987 .026 102.212)',
          '100': 'oklch(.973 .071 103.193)',
          '200': 'oklch(.945 .129 101.54)',
          '800': 'oklch(.476 .114 61.907)',
        },
        green: {
          '50': 'oklch(.982 .018 155.826)',
          '100': 'oklch(.962 .044 156.743)',
          '200': 'oklch(.925 .084 155.995)',
          '600': 'oklch(.627 .194 149.214)',
          '700': 'oklch(.527 .154 150.069)',
          '800': 'oklch(.448 .119 151.328)',
        },
        blue: {
          '50': 'oklch(.97 .014 254.604)',
          '200': 'oklch(.882 .059 254.128)',
          '800': 'oklch(.424 .199 265.638)',
        },
        gray: {
          '50': 'oklch(.985 .002 247.839)',
          '100': 'oklch(.967 .003 264.542)',
          '200': 'oklch(.928 .006 264.531)',
          '300': 'oklch(.872 .01 258.338)',
          '400': 'oklch(.707 .022 261.325)',
          '500': 'oklch(.551 .027 264.364)',
          '600': 'oklch(.446 .03 256.802)',
          '700': 'oklch(.373 .034 259.733)',
          '800': 'oklch(.278 .033 256.848)',
        },
      },
      spacing: {
        // Base spacing unit of 0.25rem
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
    },
  },
  plugins: [],
};
