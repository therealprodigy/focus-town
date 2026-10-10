export const AMBIENT_SOUNDS = [
  {
    id: "brown",
    title: "The old study fan",
    detail: "Soft brown noise. No voices, no melody.",
  },
  {
    id: "breeze",
    title: "Wind through the pines",
    detail: "A low, filtered breeze.",
  },
  {
    id: "shore",
    title: "The far shore",
    detail: "Slow waves made from filtered noise.",
  },
] as const;
export function createAmbient(id: string, volume: number) {
  const ctx = new AudioContext();
  const ready = ctx.resume();
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const master = ctx.createGain();
  const swell = ctx.createGain();
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let n = 0; n < data.length; n++) {
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;
    data[n] = id === "brown" ? brown * 3.5 : white * 0.22;
  }
  // Blend the tail into the beginning so the loop has no abrupt edge.
  const join = 1024;
  for (let n = 0; n < join; n++) {
    const ratio = n / (join - 1);
    data[data.length - join + n] =
      data[data.length - join + n] * (1 - ratio) + data[n] * ratio;
  }
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = join / ctx.sampleRate;
  filter.type = "lowpass";
  filter.frequency.value = id === "brown" ? 1400 : id === "breeze" ? 700 : 1100;
  filter.Q.value = 0.5;
  swell.gain.value = id === "shore" ? 0.55 : 0.8;
  lfo.frequency.value = id === "shore" ? 0.095 : 0.055;
  depth.gain.value = id === "brown" ? 0 : id === "shore" ? 0.3 : 0.12;
  lfo.connect(depth).connect(swell.gain);
  source
    .connect(filter)
    .connect(swell)
    .connect(master)
    .connect(ctx.destination);
  const level = (v: number) => Math.max(0, Math.min(1, v)) * 0.65;
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(level(volume), ctx.currentTime + 0.12);
  source.start();
  lfo.start();
  let stopped = false;
  return {
    ready,
    setVolume(value: number) {
      if (!stopped)
        master.gain.setTargetAtTime(level(value), ctx.currentTime, 0.05);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      source.stop(ctx.currentTime + 0.06);
      lfo.stop(ctx.currentTime + 0.06);
      source.onended = () => {
        [source, filter, swell, master, lfo, depth].forEach((node) =>
          node.disconnect(),
        );
        void ctx.close();
      };
      if (ctx.state === "suspended") void ctx.close();
    },
  };
}
