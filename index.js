const inputsPre = document.getElementById("inputs");
const outputsPre = document.getElementById("outputs");
const messagesPre = document.getElementById("messages");

/* ---------- AUDIO ---------- */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function midiToFreq(noteNumber) {
  return 440 * Math.pow(2, (noteNumber - 69) / 12);
}

function playTone(freq, velocity = 1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  gain.gain.value = 0.3 * velocity;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);
}

/* ---------- LOGGING ---------- */

function log(text) {
  messagesPre.textContent += text + "\n";
  messagesPre.scrollTop = messagesPre.scrollHeight;
}

/* ---------- SCORE INDICATOR ---------- */

// Create floating indicator element
const indicator = document.createElement("div");
indicator.id = "score-indicator";
indicator.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  font-size: 8rem;
  font-weight: bold;
  pointer-events: none;
  z-index: 1000;
  transition: transform 0.1s ease-out, opacity 0.3s ease;
  opacity: 0;
  text-shadow: 0 0 40px currentColor;
`;
document.body.appendChild(indicator);

let indicatorTimeout = null;

function showIndicator(scoreValue) {
  clearTimeout(indicatorTimeout);

  if (scoreValue === -1) {
    indicator.textContent = "✗";
    indicator.style.color = "#e87a7a";
  } else if (scoreValue >= 1.0) {
    indicator.textContent = "✓";
    indicator.style.color = "#7ae8a0";
  } else {
    // Partial score (0.4 – 0.8) - repeated note warning
    indicator.textContent = "~";
    indicator.style.color = "#e8c97a";
  }

  indicator.style.opacity = "1";
  indicator.style.transform = "translate(-50%, -50%) scale(1)";

  indicatorTimeout = setTimeout(() => {
    indicator.style.opacity = "0";
    indicator.style.transform = "translate(-50%, -50%) scale(0.6)";
  }, 600);
}

/* ---------- ENTER KEY → SNAKE CHARMER ---------- */

document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    window.location.href = "menu.html";
  }
});

/* ---------- MIDI ---------- */

WebMidi.enable()
  .then(setupMidi)
  .catch(err => log("Enable failed: " + err));

function setupMidi() {
  listDevices();

  WebMidi.addListener("connected", listDevices);
  WebMidi.addListener("disconnected", listDevices);

  WebMidi.inputs.forEach(input => {

    input.addListener("noteon", e => {
      const freq = midiToFreq(e.note.number);
      playTone(freq, e.velocity);

      log(
        "NOTE ON | " +
        input.name +
        " | " +
        e.note.identifier +
        " | freq: " + freq.toFixed(1)
      );

      let scorevalue = score(0, e.note.number);

      log(e.note.identifier + " (" + e.note.number + ") got a score of " + scorevalue);

      showIndicator(scorevalue);
    });
  });
}

/* ---------- DEVICE LIST ---------- */

function listDevices() {
  inputsPre.textContent =
    WebMidi.inputs.map((i, n) => n + ": " + i.name).join("\n") || "None";

  outputsPre.textContent =
    WebMidi.outputs.map((o, n) => n + ": " + o.name).join("\n") || "None";
}