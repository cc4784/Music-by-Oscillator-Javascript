import { audioCtx } from './audioContext.js';
import { analyser } from './audioContext.js';
import { noteNames, dissonanceColor, getKeyScale } from './musicTheory.js';
import { noteDisplayData } from './synth.js';

export const oscilloscope = document.getElementById("oscilloscope");
export const noteCanvas = document.getElementById("noteCanvas");

export function resizeCanvases() {
  oscilloscope.width = oscilloscope.offsetWidth;
  oscilloscope.height = 300;
  noteCanvas.width = noteCanvas.offsetWidth;
  noteCanvas.height = 400;
}

window.addEventListener('resize', resizeCanvases);
resizeCanvases();

export function render(currentKey) {
  requestAnimationFrame(() => render(currentKey));

  const now = audioCtx.currentTime;
  const pitchClassGains = Array(12).fill(0);
  const keyScale = getKeyScale(currentKey.root % 12, currentKey.mode);

  for (const [id, data] of noteDisplayData) {
    const timeLeft = Math.max(0, data.stopTime - now);
    if (timeLeft <= 0) continue;
    const gain = data.gainNode.gain.value;
    const pitchIndex = noteNames.indexOf(data.name);
    if (pitchIndex !== -1) pitchClassGains[pitchIndex] += gain;
  }

  const totalGain = pitchClassGains.reduce((a, b) => a + b, 0.0001);
  const centerX = oscilloscope.width / 2;
  const centerY = oscilloscope.height / 2;
  const radius = Math.min(centerX, centerY) - 50;
  let startAngle = -Math.PI / 2;

  const oscCtx = oscilloscope.getContext("2d");
  oscCtx.clearRect(0, 0, oscilloscope.width, oscilloscope.height);

  for (let i = 0; i < 12; i++) {
    const gain = pitchClassGains[i];
    const sliceAngle = (gain / totalGain) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    oscCtx.beginPath();
    oscCtx.moveTo(centerX, centerY);
    oscCtx.arc(centerX, centerY, radius, startAngle, endAngle);
    oscCtx.closePath();
    oscCtx.fillStyle = `hsl(${i * 30}, 80%, 60%)`;
    oscCtx.fill();

    const midAngle = (startAngle + endAngle) / 2;
    const labelX = centerX + (radius + 15) * Math.cos(midAngle);
    const labelY = centerY + (radius + 15) * Math.sin(midAngle);
    if (gain > 0.001) {
      oscCtx.fillStyle = dissonanceColor(i, keyScale);
      oscCtx.font = "12px monospace";
      oscCtx.fillText(noteNames[i], labelX - 10, labelY);
    }

    startAngle = endAngle;
  }

  const noteCtx = noteCanvas.getContext("2d");
  noteCtx.clearRect(0, 0, noteCanvas.width, noteCanvas.height);
  noteCtx.font = "14px monospace";

  const sortedNotes = [...noteDisplayData.entries()].sort((a, b) => {
    const aTime = Math.max(0, a[1].stopTime - now);
    const bTime = Math.max(0, b[1].stopTime - now);
    return bTime - aTime;
  });

  let y = 20;
  for (const [id, data] of sortedNotes) {
    const timeLeft = Math.max(0, data.stopTime - now).toFixed(1);
    const gain = data.gainNode.gain.value.toFixed(4);
    const pitchClass = noteNames.indexOf(data.name);
    noteCtx.fillStyle = dissonanceColor(pitchClass, keyScale);
    noteCtx.fillText(`Note: ${data.name}`, 10, y);
    noteCtx.fillText(`Freq: ${data.freq}Hz`, 100, y);
    noteCtx.fillText(`Gain: ${gain}`, 220, y);
    noteCtx.fillText(`Pan: ${data.pan}`, 320, y);
    noteCtx.fillText(`Type: ${data.type}`, 400, y);
    noteCtx.fillText(`Time left: ${timeLeft}s`, 500, y);
    y += 20;
  }
}
