import { audioCtx } from './audioContext.js';
import { getChordFromDegree } from './musicTheory.js';
import { playChord, playMelodicLead, sustainedVoices } from './synth.js';

export const chordProgression = [0, 4, 5, 3, 6, 2, 5, 0];
export const measureDuration = 8;
export const measuresPerPhrase = 8;
export const phraseDuration = measureDuration * measuresPerPhrase;

export let currentKeyIndex = 0;
export const allKeys = Array.from({ length: 12 }, (_, i) => [
  { root: 60 + i, mode: "major" },
  { root: 60 + i, mode: "minor" }
]).flat();
export let currentKey = allKeys[currentKeyIndex];

export function cleanUpSustained() {
  const now = audioCtx.currentTime;
  for (const [freq, voice] of sustainedVoices) {
    if (now > voice.stopTime) sustainedVoices.delete(freq);
  }
}

export function scheduleFixedChordLoop() {
  const startTime = audioCtx.currentTime;
  let previousFreqs = [];

  for (let m = 0; m < measuresPerPhrase; m++) {
    const scheduledTime = startTime + m * measureDuration;
    const degree = chordProgression[m % chordProgression.length];
    const isCadence = degree === 7;
    const d = isCadence ? 4 : degree;

    const { root, mode } = currentKey;
    const { midiRoot, type } = getChordFromDegree(d, root, isCadence, mode);

    const nextDegree = chordProgression[(m + 1) % chordProgression.length];
    const nextD = nextDegree === 7 ? 4 : nextDegree;
    const nextChordHint = getChordFromDegree(nextD, root, nextDegree === 7, mode);

    if (m === measuresPerPhrase - 1 || isCadence) {
      playMelodicLead(scheduledTime - 0.5, midiRoot, type);
    }

    setTimeout(() => {
      previousFreqs = playChord(midiRoot, type, {
        duration: measureDuration,
        arpeggioDensity: isCadence ? 7 : 5,
        keepPedal: d === 0 || d === 4,
        innerVoices: previousFreqs.slice(0, 2),
        nextChordHint
      });

      cleanUpSustained();
    }, (scheduledTime - audioCtx.currentTime) * 1000);
  }

  currentKeyIndex = (currentKeyIndex + 1) % allKeys.length;
  currentKey = allKeys[currentKeyIndex];
  setTimeout(scheduleFixedChordLoop, phraseDuration * 1000);
}
