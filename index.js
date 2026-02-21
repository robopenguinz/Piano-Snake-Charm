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
        e.note.name + e.note.octave +
        " | freq: " + freq.toFixed(1)
      );
    });

    input.addListener("noteoff", e => {
      log(
        "NOTE OFF | " +
        input.name +
        " | " +
        e.note.name + e.note.octave
      );
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