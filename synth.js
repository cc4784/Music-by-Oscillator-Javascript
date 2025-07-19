import { audioCtx, analyser } from './audioContext.js';
import { noteNames, midiToFreq } from './musicTheory.js';
import { shuffleArray } from './utils.js';

export const sustainedVoices = new Map();
export const noteDisplayData = new Map();

export function getChordFreqs(midiRoot, type, context = {}) {
  const { include7 = true, include9 = true, drop3rd = false } = context;
  const chordBase = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    dom: [0, 4, 7, 10],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
  };
  let intervals = chordBase[type.replace("7", "")] || chordBase.major;
  if (drop3rd) intervals = intervals.filter(i => i !== 3 && i !== 4);
  if (include7 && type.includes("7")) intervals.push(type.includes("major") ? 11 : 10);
  if (include9) intervals.push(14);
  return intervals.map(i => midiToFreq(midiRoot + i));
}

export function getCadentialNote(midiRoot, type, prefer = [4, 9]) {
  return midiToFreq(midiRoot + (prefer.includes(4) ? 4 : 9));
}

export function playStereoAmbientNoise(now, duration) {
  for (let side of [-1, 1]) {
    const noise = audioCtx.createBufferSource();
    const bufferSize = audioCtx.sampleRate * (duration + 4);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.8;
    }
    noise.buffer = buffer;
    noise.loop = false;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500 + Math.random() * 400;
    filter.Q.value = 1.5;

    const gain = audioCtx.createGain();
    const pan = audioCtx.createStereoPanner();
    pan.pan.value = side * (0.3 + Math.random() * 0.4);

    const fadeIn = 1.2;
    const fadeOut = 2.5;
    const start = now + 0.1;
    const end = now + duration + 2;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.02 + Math.random() * 0.015, start + fadeIn);
    gain.gain.setTargetAtTime(0.0001, end, fadeOut);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(audioCtx.destination);

    noise.start(start);
    noise.stop(end + fadeOut);
  }
}

export function playChord(midiRoot, type = "major", options = {}) {
  const {
    duration = 8,
    arpeggioDensity = 6,
    keepPedal = false,
    innerVoices = [],
    nextChordHint
  } = options;

  const now = audioCtx.currentTime;
  const context = { drop3rd: Math.random() > 0.5, include7: true, include9: true };
  let freqs = getChordFreqs(midiRoot, type, context);

  const usedFreqs = [];
  const passCount = 2;
  const totalNotes = arpeggioDensity * passCount;
  let noteTimings = Array.from({ length: totalNotes }, (_, i) =>
    i * (duration / totalNotes) + Math.random() * 0.1
  );
  shuffleArray(noteTimings);

  let cadenceFreq = null;
  if (nextChordHint) {
    cadenceFreq = getCadentialNote(nextChordHint.midiRoot, nextChordHint.type);
  }

  for (let i = 0; i < totalNotes; i++) {
    const baseFreq = freqs[i % freqs.length];
    const freq = (i === totalNotes - 1 && cadenceFreq)
      ? cadenceFreq
      : baseFreq + (Math.random() * 0.4 - 0.2);

    const startTime = now + noteTimings[i];
    const stopTime = startTime + duration + 3 + Math.random();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const pan = audioCtx.createStereoPanner();
    const filter = audioCtx.createBiquadFilter();

    osc.type = Math.random() < 0.5 ? "triangle" : "sine";
    osc.frequency.value = freq;

    filter.type = "lowpass";
    filter.frequency.value = 800 + Math.random() * 400;
    filter.Q.value = 1.5;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.05, startTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, stopTime + 2);

    pan.pan.value = Math.random() * 1.6 - 0.8;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(analyser);
    analyser.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(stopTime);

    sustainedVoices.set(freq + Math.random(), { osc, gain, stopTime });
    noteDisplayData.set(freq, {
      freq: freq.toFixed(2),
      name: noteNames[(Math.round(12 * Math.log2(freq / 440)) + 69) % 12],
      gainNode: gain,
      pan: pan.pan.value.toFixed(2),
      type: osc.type,
      stopTime
    });
    setTimeout(() => noteDisplayData.delete(freq), (stopTime - audioCtx.currentTime) * 1000 + 1000);

    usedFreqs.push(freq);
  }

  playStereoAmbientNoise(now, duration);
  return usedFreqs;
}

export function playMelodicLead(time, midiRoot, chordType) {
  const freqs = getChordFreqs(midiRoot, chordType).sort((a, b) => a - b).slice(0, 3);
  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const delay = audioCtx.createDelay();
    const filter = audioCtx.createBiquadFilter();

    osc.frequency.value = freq;
    osc.type = "triangle";

    gain.gain.setValueAtTime(0.008, time + i * 0.2);
    gain.gain.linearRampToValueAtTime(0.0, time + i * 0.2 + 0.4);

    filter.type = "lowpass";
    filter.frequency.value = 1000;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    delay.delayTime.value = 0.3;
    gain.connect(delay);
    delay.connect(audioCtx.destination);

    osc.start(time + i * 0.2);
    osc.stop(time + i * 0.2 + 0.6);
  });
}
