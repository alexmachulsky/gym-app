import { useCallback, useEffect, useRef, useState } from 'react';

const PRESETS = [30, 60, 90, 120, 180];

export default function RestTimer({ defaultSeconds = 90 }) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const beep = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      /* silent */
    }
  }, []);

  const start = useCallback((dur) => {
    clearInterval(intervalRef.current);
    const total = dur || seconds;
    setRemaining(total);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          beep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds, beep]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(0);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const pct = running && seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="rest-timer">
      <div className="rest-timer-header">
        <h4>Rest Timer</h4>
        <div className="rest-timer-presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`rest-preset-btn${seconds === p && !running ? ' active' : ''}`}
              onClick={() => { setSeconds(p); if (!running) setRemaining(0); }}
            >
              {p >= 60 ? `${p / 60}m` : `${p}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="rest-timer-ring-wrap">
        <svg className="rest-timer-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="var(--lime)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div className="rest-timer-display">
          {running ? `${mins}:${secs.toString().padStart(2, '0')}` : `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`}
        </div>
      </div>

      <div className="rest-timer-actions">
        {running ? (
          <button type="button" className="ghost-btn" onClick={stop}>Stop</button>
        ) : (
          <button type="button" onClick={() => start()}>Start Rest</button>
        )}
      </div>
    </div>
  );
}
