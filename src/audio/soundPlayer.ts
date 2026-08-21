export type SoundPlayer = Readonly<{
  playMergeSound: () => void;
  dispose: () => Promise<void>;
}>;

type AudioContextConstructor = typeof AudioContext;

const getAudioContextConstructor = (): AudioContextConstructor | null => {
  if (typeof window === "undefined") return null;

  const audioWindow = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return window.AudioContext ?? audioWindow.webkitAudioContext ?? null;
};

/** Creates a lazy Web Audio synthesizer; no audio files or global singleton required. */
export const createSoundPlayer = (): SoundPlayer => {
  let context: AudioContext | null = null;

  const getContext = (): AudioContext | null => {
    if (context?.state !== "closed") return context;
    const Context = getAudioContextConstructor();
    context = Context ? new Context() : null;
    return context;
  };

  const playTone = (
    audioContext: AudioContext,
    startAt: number,
    frequency: number,
    duration: number,
  ): void => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, startAt + duration);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
  };

  const playMergeSound = (): void => {
    const audioContext = getContext();
    if (!audioContext) return;

    void audioContext.resume().then(() => {
      const now = audioContext.currentTime;
      playTone(audioContext, now, 440, 0.09);
      playTone(audioContext, now + 0.07, 660, 0.13);
    });
  };

  const dispose = async (): Promise<void> => {
    const current = context;
    context = null;
    if (current && current.state !== "closed") await current.close();
  };

  return Object.freeze({ playMergeSound, dispose });
};

