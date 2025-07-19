export const AudioContext = window.AudioContext || window.webkitAudioContext;
export const audioCtx = new AudioContext();

export const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
export const dataArray = new Uint8Array(analyser.frequencyBinCount);
