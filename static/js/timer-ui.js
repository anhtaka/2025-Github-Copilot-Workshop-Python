import { formatMs, createTimer } from './timer-core.js';

const defaultMs = 25 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
  let currentMs = defaultMs;
  let timer = createTimer(currentMs);
  const timeDisplay = document.getElementById('time-display');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const ring = document.querySelector('.ring-progress');
  const presetButtons = document.querySelectorAll('.preset-button');
  const customMinutes = document.getElementById('custom-minutes');
  const customSet = document.getElementById('custom-set');

  const RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~326
  ring.style.strokeDasharray = `${CIRCUMFERENCE}`;

  let rafId = null;

  function setRingProgress(remainingMs) {
    const pct = Math.max(0, Math.min(1, remainingMs / timer.plannedMs));
    const offset = CIRCUMFERENCE * (1 - pct);
    ring.style.strokeDashoffset = `${offset}`;
  }

  function updateDisplay(nowMs) {
    const rem = timer.getRemaining();
    timeDisplay.textContent = formatMs(rem);
    setRingProgress(rem);
  }

  function loop() {
    updateDisplay();
    if (timer.getRemaining() <= 0) {
      cancelAnimationFrame(rafId);
      rafId = null;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      // TODO: notify backend /api/session/complete
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click', () => {
    timer.start();
    if (!rafId) loop();
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    startBtn.setAttribute('aria-pressed', 'true');
  });

  pauseBtn.addEventListener('click', () => {
    timer.pause();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.setAttribute('aria-pressed', 'false');
  });

  resetBtn.addEventListener('click', () => {
    timer.reset();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    updateDisplay();
    ring.style.strokeDashoffset = `0`;
    startBtn.setAttribute('aria-pressed', 'false');
  });

  // Preset handling
  function selectPreset(button) {
    presetButtons.forEach(b => b.setAttribute('aria-checked', 'false'));
    button.setAttribute('aria-checked', 'true');
    const mins = Number(button.dataset.minutes);
    setDurationMinutes(mins);
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => selectPreset(btn));
  });

  customSet.addEventListener('click', () => {
    const mins = Math.max(1, Math.min(240, Number(customMinutes.value || 25)));
    // reset preset selection
    presetButtons.forEach(b => b.setAttribute('aria-checked', 'false'));
    setDurationMinutes(mins);
  });

  function setDurationMinutes(mins) {
    currentMs = mins * 60 * 1000;
    // recreate timer with new plannedMs while preserving running/paused state: reset
    timer = createTimer(currentMs);
    // stop any running animation
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    updateDisplay();
  }

  // initialize UI state
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  startBtn.setAttribute('aria-pressed', 'false');
  updateDisplay();
});
