export const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function getKeyScale(root, mode) {
  const intervals = mode === "major" ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
  return intervals.map(i => (root + i) % 12);
}

export function dissonanceColor(pc, keyScale) {
  if (keyScale.includes(pc)) return "#ffffff";
  const distances = keyScale.map(k => Math.min((pc - k + 12) % 12, (k - pc + 12) % 12));
  const minDist = Math.min(...distances) * 1 - Math.abs(((Date.now() / 1500) % 2) - 1);
  const lightness = 100 - minDist * 20;
  return `hsl(0, 100%, ${lightness}%)`;
}

export function getChordFromDegree(degree, root, isCadence = false, mode = "major") {
  const scale = mode === "minor" ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const midiRoot = root + scale[degree % 7];
  let type;
  if (mode === "major") {
    if (degree === 0 || degree === 3) type = "major";
    else if (degree === 4) type = "dom";
    else type = "minor";
  } else {
    if (degree === 0 || degree === 5) type = "minor";
    else if (degree === 3) type = "major";
    else if (degree === 4) type = "dom";
    else type = "minor";
  }
  if (isCadence) type += "7";
  return { midiRoot, type };
}
