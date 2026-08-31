type AudioMode = "ambient" | "fever";

const audioContext = () => new AudioContext();
const note = (context: AudioContext, destination: AudioNode, frequency: number, start: number, duration: number, volume: number, type: OscillatorType = "sine") => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

export const createSoundPlayer = () => {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let musicTimer: number | null = null;
  let mode: AudioMode = "ambient";
  let stepAt = 0;
  const ensure = () => {
    context ??= audioContext();
    if (!master) { master = context.createGain(); master.gain.value = 0.34; master.connect(context.destination); }
    if (context.state === "suspended") void context.resume();
    return { context, master };
  };
  const playMusicBar = () => {
    const audio = ensure();
    const now = audio.context.currentTime + 0.03;
    const progression = mode === "fever" ? [392, 493.88, 587.33, 783.99] : [196, 246.94, 293.66, 220];
    progression.forEach((root, index) => {
      const at = now + index * (mode === "fever" ? 0.23 : 0.58);
      note(audio.context, audio.master, root, at, mode === "fever" ? .2 : .48, mode === "fever" ? .045 : .025, "triangle");
      note(audio.context, audio.master, root * 1.5, at + .05, mode === "fever" ? .16 : .42, .012, "sine");
    });
  };
  const startMusic = () => {
    ensure();
    if (musicTimer !== null) return;
    playMusicBar();
    musicTimer = window.setInterval(playMusicBar, mode === "fever" ? 1050 : 2450);
  };
  const restartMusic = () => { if (musicTimer !== null) window.clearInterval(musicTimer); musicTimer = null; startMusic(); };
  const setFever = (active: boolean) => { const next: AudioMode = active ? "fever" : "ambient"; if (mode === next) return; mode = next; restartMusic(); };
  const effect = (frequencies: readonly number[], duration = .12, volume = .055, type: OscillatorType = "square") => {
    const audio = ensure(); const now = audio.context.currentTime;
    frequencies.forEach((frequency, index) => note(audio.context, audio.master, frequency, now + index * duration * .55, duration, volume, type));
  };
  return {
    startMusic,
    stopMusic: () => { if (musicTimer !== null) window.clearInterval(musicTimer); musicTimer = null; },
    setFever,
    playUi: () => effect([440, 620], .055, .025, "sine"),
    playMachineStart: () => effect([110, 145, 190], .16, .045, "sawtooth"),
    playMachineReady: () => effect([523.25, 659.25, 783.99], .12, .05, "triangle"),
    playCombine: () => effect([392, 523.25, 659.25, 783.99], .1, .05, "square"),
    playCoin: () => effect([880, 1174.66, 1567.98], .09, .055, "sine"),
    playFootstep: () => { const now = performance.now(); if (now - stepAt < 260) return; stepAt = now; effect([92 + Math.random() * 18], .045, .018, "triangle"); },
  };
};

export const soundPlayer = createSoundPlayer();
