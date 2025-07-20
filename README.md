Making music by Oscillator

An interactive, generative ambient music system built using **pure JavaScript** and the **Web Audio API**. It creates evolving harmonic textures with animated visualizations that show what’s being played in real time.

Features

Modular chord progression engine with smooth modulations
Auto-evolving key and chord cycles across all 12 major/minor keys
Extended chords (7ths, 9ths, add4, etc.) using music theory
Smooth layered pads and randomized arpeggios
Real-time visual feedback of notes and audio activity
Pedal tones, voice leading, and melodic leads

## Script Breakdown

This project is split into modules for flexibility:

| File             | Purpose |
|------------------|---------|
| `main.js`        | Bootstraps everything and starts the loop |
| `audioContext.js`| Central audio clock and analyser setup |
| `musicTheory.js` | Music logic: chords, scales, dissonance |
| `synth.js`       | Synthesizer voices and sound shaping |
| `scheduler.js`   | Controls timing, modulation, and looping |
| `visuals.js`     | Handles canvas-based visual feedback |

## Live Demo

 [Try in browser](https://cc4784.github.io/MusicViaJS/)

> *Note: works best on desktop Chrome/Edge/Firefox with audio enabled.*

