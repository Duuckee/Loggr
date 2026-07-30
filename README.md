# Loggr

A field contact-logging app for amateur radio activations, built from the
Loggr SRS and the "Modern Globe Map" design (Section 3 of the design doc).
React + Vite, deployable via GitHub → Vercel, with Supabase wired in for
future persistence.

## Globe component

The rotating globe with markers and park-to-park arcs is a custom
`src/components/Globe.jsx` built directly on `three.js` — implementing the
`GlobeRendererModule` / `P2PLinkModule` pseudocode from SRS section 6.3–6.5
(wireframe sphere, drag-to-rotate, scroll-to-zoom, auto-rotate, curved
P2P link arcs). It is **not** the React Bits Pro `Globe` component — that's
a paid, license-gated package (`@reactbits-starter/globe-tw`) that needs a
`REACTBITS_LICENSE_KEY` and isn't included here.

## What's implemented

- **Session setup** (Screen 1) — home park reference, presets, operator/session name
- **Dashboard** (Screen 2) — globe, legend, live stats, contact log
- **Add contact modal** (Screen 3) — callsign/band/mode/location form, P2P toggle
- **Session summary** (Screen 4) — full contact table, ADIF export
- Local park lookup (`src/data/parks.js`) — a small stand-in for the full POTA
  database mentioned in SRS 6.2; falls back gracefully if a reference isn't found
- ADIF export (`src/lib/adif.js`) — downloads a `.adi` file of the session

Contacts currently live in React state only (per session, lost on refresh).
`src/lib/supabase.js` has a working Supabase client ready to go — the natural
next step is to persist `Session`/`Contact` (SRS 7.1–7.2) to a Supabase table.

## 1. Install dependencies

```bash
npm install
```

## 2. Run locally

```bash
npm run dev
```


## Project structure

```
src/
├── components/
│   ├── Globe.jsx            # custom three.js globe (GlobeRendererModule)
│   ├── SessionSetup.jsx     # Screen 1
│   ├── Dashboard.jsx        # Screen 2
│   ├── AddContactModal.jsx  # Screen 3 (ContactEntryModule)
│   └── SessionSummary.jsx   # Screen 4 (ExportModule)
├── data/
│   └── parks.js             # local park lookup + presets
├── lib/
│   ├── adif.js               # ADIF export
│   └── supabase.js           # Supabase client (ready, not yet used for data)
├── App.jsx                   # screen state machine
├── App.css                   # design tokens (black/amber palette)
└── index.css
```
