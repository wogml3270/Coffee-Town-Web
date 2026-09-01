const stageTracks = [
  "/assets/audio/hyp-spring-has-come.mp3",
  "/assets/audio/hyp-ggoomma-song.mp3",
  "/assets/audio/hyp-sugar-in-my-coffee.mp3",
] as const;
const lobbyTrack = "/assets/audio/hyp-full-of-sunshine.mp3";
const musicPreferenceKey = "coffee-town-bgm-enabled";

const trackForStage = (stageId: number) => stageTracks[Math.min(stageTracks.length - 1, Math.floor((Math.max(1, stageId) - 1) / 4))] ?? stageTracks[0];

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
  let music: HTMLAudioElement | null = null;
  let musicEnabled = localStorage.getItem(musicPreferenceKey) !== "false";
  let stageId = 1;
  let fever = false;
  let stepAt = 0;
  const ensure = () => {
    context ??= audioContext();
    if (!master) { master = context.createGain(); master.gain.value = 0.34; master.connect(context.destination); }
    if (context.state === "suspended") void context.resume();
    return { context, master };
  };
  const applyMusicMode = () => {
    if (!music) return;
    music.playbackRate = fever ? 1.08 : 1;
    music.volume = fever ? 0.44 : 0.32;
  };
  const playTrack = (source: string) => {
    if (!music || !music.src.endsWith(source)) {
      music?.pause();
      music = new Audio(source);
      music.loop = true;
      music.preload = "auto";
      music.autoplay = true;
    }
    applyMusicMode();
    if (musicEnabled) void music.play().catch(() => undefined);
  };
  const startMusic = (nextStageId = stageId) => {
    stageId = nextStageId;
    fever = false;
    playTrack(trackForStage(stageId));
  };
  const startLobbyMusic = () => { fever = false; playTrack(lobbyTrack); };
  const setFever = (active: boolean) => {
    if (fever === active) return;
    fever = active;
    applyMusicMode();
    if (active) effect([523.25, 659.25, 783.99, 1046.5], .11, .06, "square");
  };
  const effect = (frequencies: readonly number[], duration = .12, volume = .055, type: OscillatorType = "square") => {
    const audio = ensure(); const now = audio.context.currentTime;
    frequencies.forEach((frequency, index) => note(audio.context, audio.master, frequency, now + index * duration * .55, duration, volume, type));
  };
  return {
    startMusic,
    startLobbyMusic,
    stopMusic: () => music?.pause(),
    isMusicEnabled: () => musicEnabled,
    setMusicEnabled: (enabled: boolean) => {
      musicEnabled = enabled;
      localStorage.setItem(musicPreferenceKey, String(enabled));
      if (enabled) void music?.play().catch(() => undefined);
      else music?.pause();
    },
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
