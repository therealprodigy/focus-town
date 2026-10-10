import { AMBIENT_SOUNDS, createAmbient } from "./ambientAudio";
import { useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
const TRACKS = [
  {
    id: "rain",
    title: "Rain at the window",
    detail: "A quiet rain loop.",
    creator: "silencyo",
    url: "https://freesound.org/people/silencyo/sounds/81818/",
  },
  {
    id: "fire",
    title: "The reading-room hearth",
    detail: "Crackling fire, no music.",
    creator: "inchadney",
    url: "https://freesound.org/people/inchadney/sounds/132534/",
  },
  {
    id: "forest",
    title: "Past the tree line",
    detail: "Forest ambience.",
    creator: "SamsterBirdies",
    url: "https://freesound.org/people/SamsterBirdies/sounds/578523/",
  },
  {
    id: "lofi",
    title: "Late at the observatory",
    detail: "A slow lo-fi instrumental.",
    creator: "OMF-Games",
    url: "https://opengameart.org/content/lofi-hip-hop-loop",
  },
] as const;
const ALL_SOUNDS = [...TRACKS, ...AMBIENT_SOUNDS];
function readSoundPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem("focus-town-sound-v1") || "{}");
    return {
      track: ALL_SOUNDS.some((t) => t.id === p.track)
        ? (p.track as string)
        : "rain",
      volume:
        typeof p.volume === "number" && Number.isFinite(p.volume)
          ? Math.max(0, Math.min(1, p.volume))
          : 0.35,
      chime: p.chime === true,
    };
  } catch {
    return { track: "rain", volume: 0.35, chime: false };
  }
}
export function useSoundLibrary(completedId: string | undefined, ready = true) {
  const [initial] = useState(readSoundPrefs);
  const hydrated = useRef(false);
  const wanted = useRef(false);
  const [loading, setLoading] = useState(false);
  const synth = useRef<ReturnType<typeof createAmbient> | null>(null);
  const [track, setTrack] = useState(initial.track),
    [playing, setPlaying] = useState(false),
    [volume, setVolume] = useState(initial.volume),
    [chime, setChime] = useState(initial.chime),
    [error, setError] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null),
    bell = useRef<HTMLAudioElement | null>(null),
    generation = useRef(0),
    last = useRef(completedId);
  useEffect(
    () => () => {
      generation.current++;
      wanted.current = false;
      audio.current?.pause();
      synth.current?.stop();
      bell.current?.pause();
    },
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem(
        "focus-town-sound-v1",
        JSON.stringify({ track, volume, chime }),
      );
    } catch {
      /* Sound works without preference storage. */
    }
  }, [track, volume, chime]);
  useEffect(() => {
    synth.current?.setVolume(volume);
    if (audio.current) audio.current.volume = volume;
    if (bell.current) bell.current.volume = volume;
  }, [volume]);
  const start = async (id = track) => {
    const gen = ++generation.current;
    wanted.current = true;
    setLoading(true);
    audio.current?.pause();
    synth.current?.stop();
    synth.current = null;
    setPlaying(false);
    setError("");
    if (AMBIENT_SOUNDS.some((t) => t.id === id)) {
      let next: ReturnType<typeof createAmbient> | undefined;
      try {
        next = createAmbient(id, volume);
        synth.current = next;
        await next.ready;
        if (gen === generation.current) {
          setPlaying(true);
          setLoading(false);
        } else next.stop();
      } catch {
        next?.stop();
        if (gen === generation.current) {
          wanted.current = false;
          setLoading(false);
          setError(
            "This browser could not start the ambient sound. Try a recording instead.",
          );
        }
      }
      return;
    }
    const a = new Audio("/audio/" + id + ".mp3");
    a.loop = true;
    a.preload = "none";
    a.volume = volume;
    audio.current = a;
    setError("");
    a.onerror = () => {
      if (gen === generation.current) {
        wanted.current = false;
        setLoading(false);
        setPlaying(false);
        setError("That sound could not load. Try it again.");
      }
    };
    try {
      await a.play();
      if (gen === generation.current) {
        setPlaying(true);
        setLoading(false);
      } else a.pause();
    } catch {
      if (gen === generation.current) {
        wanted.current = false;
        setLoading(false);
        setPlaying(false);
        setError("Press Play to allow sound in this browser.");
      }
    }
  };
  const stop = () => {
    generation.current++;
    wanted.current = false;
    setLoading(false);
    audio.current?.pause();
    synth.current?.stop();
    synth.current = null;
    setPlaying(false);
  };
  const testChime = async () => {
    const a = bell.current ?? new Audio("/audio/chime.mp3");
    bell.current = a;
    a.volume = volume;
    a.currentTime = 0;
    try {
      await a.play();
      setError("");
    } catch {
      setError("Use Test chime to allow the completion sound.");
    }
  };
  useEffect(() => {
    if (!ready) return;
    if (!hydrated.current) {
      hydrated.current = true;
      last.current = completedId;
      return;
    }
    if (completedId && completedId !== last.current && chime) void testChime();
    last.current = completedId;
  }, [completedId, chime, ready]);
  return {
    track,
    playing,
    loading,
    volume,
    chime,
    error,
    setVolume,
    setChime,
    testChime,
    toggle: () => (wanted.current ? stop() : void start()),
    select: (id: string) => {
      setTrack(id);
      if (wanted.current) void start(id);
    },
  };
}
export function SoundLibrary({
  sound,
}: {
  sound: ReturnType<typeof useSoundLibrary>;
}) {
  return (
    <>
      <p className="muted">
        Choose a recording or a quiet ambient loop. Nothing plays until you
        press Play.
      </p>
      <div className="sound-list">
        {ALL_SOUNDS.map((t) => (
          <button
            key={t.id}
            aria-pressed={sound.track === t.id}
            onClick={() => sound.select(t.id)}
          >
            <span className="record-glyph" aria-hidden="true">
              {sound.track === t.id && sound.playing ? "[:::]" : "[ · ]"}
            </span>
            <span>
              <strong>{t.title}</strong>
              <small>{t.detail}</small>
            </span>
            <span>{sound.track === t.id ? "Selected" : ""}</span>
          </button>
        ))}
      </div>
      <div className="button-row">
        <Button variant="default" onClick={sound.toggle}>
          {sound.loading
            ? "Cancel loading"
            : sound.playing
              ? "Pause sound"
              : "Play sound"}
        </Button>
        <label className="volume-control">
          Volume
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sound.volume}
            onChange={(e) => sound.setVolume(Number(e.target.value))}
          />
        </label>
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={sound.chime}
          onChange={(e) => {
            sound.setChime(e.target.checked);
            if (e.target.checked) void sound.testChime();
          }}
        />
        Chime when focus is saved
      </label>
      <Button onClick={() => void sound.testChime()}>Test chime</Button>
      {sound.error && (
        <p className="error" role="status">
          {sound.error}
        </p>
      )}
      <details className="audio-credits">
        <summary>Sound credits</summary>
        <p>
          The four recordings and completion chime are released under{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC0
          </a>
          .
        </p>
        <p>
          The study fan, pine breeze and shore are synthesized in your browser.
          They contain no external recordings.
        </p>
        {TRACKS.map((t) => (
          <p key={t.id}>
            <a href={t.url} target="_blank" rel="noreferrer">
              {t.title}
            </a>{" "}
            · {t.creator}
          </p>
        ))}
        <p>
          <a
            href="https://kenney.nl/assets/interface-sounds"
            target="_blank"
            rel="noreferrer"
          >
            Completion sound
          </a>{" "}
          · Kenney
        </p>
      </details>
    </>
  );
}
