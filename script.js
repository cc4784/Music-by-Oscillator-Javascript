    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const oscilloscope = document.getElementById("oscilloscope");
    const oscCtx = oscilloscope.getContext("2d");

    const noteCanvas = document.getElementById("noteCanvas");
    const noteCtx = noteCanvas.getContext("2d");

    const secondForme = 1000;

    function resizeCanvases() {
      oscilloscope.width = oscilloscope.offsetWidth;
      oscilloscope.height = 300;
      noteCanvas.width = noteCanvas.offsetWidth;
      noteCanvas.height = 400;
    }

    window.addEventListener('resize', resizeCanvases);
    resizeCanvases();

    const measureDuration = 8;
    const measuresPerPhrase = 8;
    const phraseDuration = measureDuration * measuresPerPhrase;
    const chordProgression = [0, 4, 5, 3, 6, 2, 5, 0];

    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const sustainedVoices = new Map();
    const noteDisplayData = new Map();

    const allKeys = [];
    for (let i = 0; i < 12; i++) {
      allKeys.push({ root: 60 + i, mode: "major" });
      allKeys.push({ root: 60 + i, mode: "minor" });
    }
    let keyIndex = 0;
    let currentKey = allKeys[keyIndex];

    function getKeyScale(root, mode) {
      const intervals = mode === "major" ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
      return intervals.map(i => (root + i) % 12);
    }

function dissonanceColor(pc, keyScale) {
  if (keyScale.includes(pc)) return "#ffffff"; // Pure white for in-key

  // Find the minimum distance to the nearest in-scale pitch class
  const distances = keyScale.map(k => Math.min((pc - k + 12) % 12, (k - pc + 12) % 12));
  const minDist = Math.min(...distances ) * 1 - Math.abs(((Date.now() / (3000 / 2)) % 2) - 1) ; // e.g. 1 = slightly off, 6 = most distant

  const lightness = 100 - minDist * 20; // Lightness from 90% to 40%
  return `hsl(0, 100%, ${lightness}%)`; // Red hue, decreasing brightness
}

    function render() {
      requestAnimationFrame(render);
      resizeCanvases();

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
    render();

    document.body.style.transition = "background-color 2s ease";
    document.body.style.backgroundColor = `hsl(${Math.floor(Math.random() * 360)}, 20%, 5%)`;

function midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}


function getChordName(root, type, mode) {
    return "Simulating";
}

function getChordFromDegree(degree, root, isCadence = false, mode = "major") {
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

function getChordFreqs(midiRoot, type, context = {}) {
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

function getCadentialNote(midiRoot, type, prefer = [4, 9]) {
    return midiToFreq(midiRoot + (prefer.includes(4) ? 4 : 9));
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function playStereoAmbientNoise(now, duration) {
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

function playChord(midiRoot, type = "major", options = {}) {
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
    let noteTimings = [];
    for (let i = 0; i < totalNotes; i++) {
        noteTimings.push(i * (duration / totalNotes) + Math.random() * 0.1);
    }
    shuffleArray(noteTimings);

    let cadenceFreq = null;
    if (nextChordHint) {
        cadenceFreq = getCadentialNote(nextChordHint.midiRoot, nextChordHint.type);
    }

    for (let i = 0; i < totalNotes; i++) {
        const baseFreq = freqs[i % freqs.length];
        const freq = (i === totalNotes - 1 && cadenceFreq) ? cadenceFreq : baseFreq + (Math.random() * 0.4 - 0.2);

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
        setTimeout(() => noteDisplayData.delete(freq), (stopTime - audioCtx.currentTime) * secondForme + secondForme);

        usedFreqs.push(freq);
    }

    playStereoAmbientNoise(now, duration);
    document.getElementById("info").textContent = getChordName(midiRoot, type, currentKey.mode);
    return usedFreqs;
}

function playMelodicLead(time, midiRoot, chordType) {
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
        filter.frequency.value = secondForme;

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

function scheduleFixedChordLoop() {
    let previousFreqs = [];
    const startTime = audioCtx.currentTime;

    for (let m = 0; m < measuresPerPhrase; m++) {
        const scheduledTime = startTime + m * measureDuration;
        const degree = chordProgression[m % chordProgression.length];
        const isCadence = degree === 7;
        const d = isCadence ? 4 : degree;

        const { root, mode } = currentKey;
        const { midiRoot, type } = getChordFromDegree(d, root, isCadence, mode);

        const nextDegree = chordProgression[(m + 1) % chordProgression.length];
        const nextIsCadence = nextDegree === 7;
        const nextD = nextIsCadence ? 4 : nextDegree;
        const nextChordHint = getChordFromDegree(nextD, currentKey.root, nextIsCadence, currentKey.mode);

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
        }, (scheduledTime - audioCtx.currentTime) * secondForme);
    }

    keyIndex = (keyIndex + 1) % allKeys.length;
    currentKey = allKeys[keyIndex];
    setTimeout(scheduleFixedChordLoop, phraseDuration * secondForme);
}

function cleanUpSustained() {
    const now = audioCtx.currentTime;
    for (const [freq, voice] of sustainedVoices) {
        if (now > voice.stopTime) sustainedVoices.delete(freq);
    }
}

window.addEventListener("keydown", () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
    scheduleFixedChordLoop();
}, { once: true });