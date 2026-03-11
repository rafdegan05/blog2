"use client";

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

export interface WaveformPlayerHandle {
  /** Seek audio to given time in seconds and start playing */
  seekTo: (seconds: number) => void;
}

interface WaveformPlayerProps {
  src: string;
  /** Compact mode for cards (smaller height, no speed/volume controls) */
  compact?: boolean;
}

/* ── Helpers ── */

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const BAR_COUNT_FULL = 120;
const BAR_COUNT_COMPACT = 60;

/** Extract peak amplitudes from an AudioBuffer, returns normalised 0..1 array */
function extractPeaks(buffer: AudioBuffer, bars: number): number[] {
  const channel = buffer.getChannelData(0);
  const step = Math.floor(channel.length / bars);
  const peaks: number[] = [];
  let max = 0;
  for (let i = 0; i < bars; i++) {
    let peak = 0;
    const offset = i * step;
    for (let j = 0; j < step; j++) {
      const v = Math.abs(channel[offset + j] ?? 0);
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  // normalise
  if (max > 0) for (let i = 0; i < peaks.length; i++) peaks[i] /= max;
  return peaks;
}

/** Draw the waveform bars onto a canvas */
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  peaks: number[],
  progress: number,
  w: number,
  h: number,
  colors: { played: string; unplayed: string; cursor: string }
) {
  ctx.clearRect(0, 0, w, h);
  const bars = peaks.length;
  const gap = 2;
  const barW = Math.max(1, (w - (bars - 1) * gap) / bars);
  const minH = 3;

  for (let i = 0; i < bars; i++) {
    const x = i * (barW + gap);
    const barH = Math.max(minH, peaks[i] * (h * 0.88));
    const y = (h - barH) / 2;
    const pct = i / bars;

    ctx.fillStyle = pct < progress ? colors.played : colors.unplayed;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, barW / 2);
    ctx.fill();
  }

  // Playhead line
  const cx = progress * w;
  ctx.fillStyle = colors.cursor;
  ctx.fillRect(cx - 1, 0, 2, h);
}

/* ── Component ── */

const WaveformPlayer = forwardRef<WaveformPlayerHandle, WaveformPlayerProps>(
  function WaveformPlayer({ src, compact = false }, ref) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);

    const [peaksData, setPeaksData] = useState<{ src: string; peaks: number[] } | null>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [speed, setSpeed] = useState(1);

    const barCount = compact ? BAR_COUNT_COMPACT : BAR_COUNT_FULL;

    // Derive peaks & loading from peaksData — avoids synchronous setState in effect
    const peaks = peaksData?.src === src ? peaksData.peaks : null;
    const loading = peaks === null;

    /* ── Expose seekTo via ref ── */
    useImperativeHandle(
      ref,
      () => ({
        seekTo(seconds: number) {
          const audio = audioRef.current;
          if (!audio) return;
          audio.currentTime = seconds;
          setCurrentTime(seconds);
          if (audio.duration) {
            setProgress(seconds / audio.duration);
          }
          if (audio.paused) {
            audio.play();
            setPlaying(true);
          }
        },
      }),
      []
    );

    /* ── Decode audio → peaks ── */
    useEffect(() => {
      let cancelled = false;

      (async () => {
        try {
          const res = await fetch(src);
          const buf = await res.arrayBuffer();
          const actx = new AudioContext();
          const decoded = await actx.decodeAudioData(buf);
          if (!cancelled) {
            setPeaksData({ src, peaks: extractPeaks(decoded, barCount) });
          }
          await actx.close();
        } catch {
          // Fallback: generate flat bars so the player is still usable
          if (!cancelled) {
            const flat = Array.from({ length: barCount }, () => 0.3 + Math.random() * 0.4);
            setPeaksData({ src, peaks: flat });
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [src, barCount]);

    /* ── Get theme colours from CSS custom properties ── */
    const getColors = useCallback(() => {
      const el = containerRef.current;
      if (!el)
        return {
          played: "#6366f1",
          unplayed: "rgba(128,128,128,0.25)",
          cursor: "#6366f1",
        };
      const s = getComputedStyle(el);
      const primary = s.getPropertyValue("--waveform-played").trim() || "#6366f1";
      const unplayed = s.getPropertyValue("--waveform-unplayed").trim() || "rgba(128,128,128,0.25)";
      const cursor = s.getPropertyValue("--waveform-cursor").trim() || primary;
      return { played: primary, unplayed, cursor };
    }, []);

    /* ── Render loop ── */
    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || !peaks) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      drawWaveform(ctx, peaks, progress, rect.width, rect.height, getColors());
    }, [peaks, progress, getColors]);

    useEffect(() => {
      draw();
    }, [draw]);

    /* ── Animation frame for smooth progress ── */
    useEffect(() => {
      if (!playing) return;

      const tick = () => {
        const audio = audioRef.current;
        if (audio && audio.duration) {
          setCurrentTime(audio.currentTime);
          setProgress(audio.currentTime / audio.duration);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      return () => cancelAnimationFrame(rafRef.current);
    }, [playing]);

    /* ── Handlers ── */

    const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    };

    const seek = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const audio = audioRef.current;
      const canvas = canvasRef.current;
      if (!audio || !canvas || !audio.duration) return;
      const rect = canvas.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * audio.duration;
      setProgress(pct);
      setCurrentTime(audio.currentTime);
    };

    const onLoaded = () => {
      const audio = audioRef.current;
      if (audio) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const changeVolume = (v: number) => {
      setVolume(v);
      if (audioRef.current) audioRef.current.volume = v;
    };

    const changeSpeed = (s: number) => {
      setSpeed(s);
      if (audioRef.current) audioRef.current.playbackRate = s;
    };

    const skipForward = () => {
      const audio = audioRef.current;
      if (audio) audio.currentTime = Math.min(audio.duration, audio.currentTime + 15);
    };

    const skipBackward = () => {
      const audio = audioRef.current;
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - 15);
    };

    const canvasHeight = compact ? 48 : 80;

    return (
      <div
        ref={containerRef}
        className={`waveform-player ${compact ? "waveform-player--compact" : ""}`}
      >
        {/* Hidden native audio element */}
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onEnded={onEnded}
        />

        {/* Top row: play + waveform + time */}
        <div className="waveform-player-main">
          {/* Play / pause */}
          <button
            onClick={togglePlay}
            className="waveform-play-btn"
            aria-label={playing ? "Pause" : "Play"}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : playing ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </button>

          {/* Skip back (full mode) */}
          {!compact && (
            <button onClick={skipBackward} className="waveform-skip-btn" aria-label="Back 15s">
              <Skip15BackIcon />
            </button>
          )}

          {/* Waveform canvas */}
          <div className="waveform-canvas-wrap">
            <canvas
              ref={canvasRef}
              onClick={seek}
              className="waveform-canvas"
              style={{ height: canvasHeight }}
            />
            {/* Time overlay */}
            <div className="waveform-time">
              <span>{fmtTime(currentTime)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          {/* Skip forward (full mode) */}
          {!compact && (
            <button onClick={skipForward} className="waveform-skip-btn" aria-label="Forward 15s">
              <Skip15ForwardIcon />
            </button>
          )}
        </div>

        {/* Bottom row: speed + volume (full mode) */}
        {!compact && (
          <div className="waveform-controls">
            {/* Speed selector */}
            <div className="waveform-speed">
              {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={`waveform-speed-btn ${speed === s ? "waveform-speed-btn--active" : ""}`}
                >
                  {s}×
                </button>
              ))}
            </div>

            {/* Volume */}
            <div className="waveform-volume">
              <button
                onClick={() => changeVolume(volume > 0 ? 0 : 1)}
                className="waveform-volume-icon"
                aria-label={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? <VolumeOffIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="waveform-volume-slider"
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default WaveformPlayer;

/* ══════════════════════════
   Icons
   ══════════════════════════ */

function PlayIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function Skip15BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 8.5l-3-3 3-3" />
      <path strokeLinecap="round" d="M9.5 5.5A7.5 7.5 0 1 1 4.5 12" />
      <text
        x="9"
        y="16"
        fontSize="7"
        fill="currentColor"
        stroke="none"
        fontWeight="bold"
        textAnchor="middle"
      >
        15
      </text>
    </svg>
  );
}

function Skip15ForwardIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 8.5l3-3-3-3" />
      <path strokeLinecap="round" d="M14.5 5.5A7.5 7.5 0 1 0 19.5 12" />
      <text
        x="15"
        y="16"
        fontSize="7"
        fill="currentColor"
        stroke="none"
        fontWeight="bold"
        textAnchor="middle"
      >
        15
      </text>
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494a1 1 0 01-1.632.772L6.28 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.28l4.088-3.519A1 1 0 0112 6.253zm6.95-1.705a9 9 0 010 10.482"
      />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-3.707A1 1 0 0112 6v12a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
      />
    </svg>
  );
}
