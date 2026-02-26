# Mori's Birthday Book 💙

A premium romantic digital birthday experience for Meriam.

## Setup

```bash
npm install
npm run dev
```

## Adding the KOKO cat image

1. Place your cat image in `/src/assets/` and name it `koko.jpg`
2. The app will automatically display it in the KOKO section.
3. If no image is found, a 🐱 placeholder is shown.

## Adding background music (future)

1. Place your `.mp3` or `.ogg` file in the empty `/src/music/` folder.
2. Import it in `App.jsx` and add an `<audio>` element with autoplay + loop.

## Project Structure

```
/src
  /components
    AnimatedSection.jsx   — Framer Motion fade/slide wrappers
    NavDots.jsx           — Fixed right-side navigation dots
    Stars.jsx             — Animated star field background
    useInView.js          — Intersection Observer hook
  /sections
    WelcomeSection.jsx    — Cinematic intro
    BirthdaySection.jsx   — Birthday cover + floating hearts
    MessageSection.jsx    — Love poem (Arabic)
    PoetrySection.jsx     — Formal Arabic poetry
    KokoSection.jsx       — Cat section
    DuaSection.jsx        — Closing prayer + signature
  /assets                 — Place koko.jpg here
  /music                  — Reserved for background audio
  App.jsx                 — Root with scroll-snap + nav
  index.css               — Global styles & design tokens
```

## Tech

- React 18 + Vite 5
- Framer Motion 11
- Fonts: Italiana, Cormorant Garamond, Scheherazade New
- CSS-first glassmorphism + scroll-snap
