/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A high-fidelity, zero-dependency procedural audio synthesis engine 
// built with the native Web Audio API. Designed specifically for low-latency
// and cute feedback tones on iOS, Android, and Desktop.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  
  // Resume if suspended (browsers block initial playback until user gesture)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
}

/**
 * Play a cute subtle click/pop sound for micro interactions and tab switches
 */
export function playCuteClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Deep sweet cute bubbly pop frequency drop
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (err) {
    console.warn('Audio click playback suppressed or unavailable:', err);
  }
}

/**
 * Play a beautiful ascending cute reward sound when recording/completing a task
 */
export function playCuteSuccess() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    const duration = 0.07;

    notes.forEach((freq, idx) => {
      const time = ctx.currentTime + idx * 0.06;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Sweet woodwind vibe
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration + 0.01);
    });
  } catch (err) {
    console.warn('Audio success playback suppressed or unavailable:', err);
  }
}

/**
 * Play a rich, beautiful sparkling chime sound when the 10-point daily goal is complete
 */
export function playCuteVictory() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Sparkling major pentatonic ascending-descending cute chime sequence
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C5 to C6 pentatonic
    
    notes.forEach((freq, idx) => {
      const time = ctx.currentTime + idx * 0.04;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle'; // layered synth bell sound

      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 1.005, time); // subtle chorus detune

      gain.gain.setValueAtTime(0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(time);
      osc2.start(time);
      
      osc1.stop(time + 0.26);
      osc2.stop(time + 0.26);
    });
  } catch (err) {
    console.warn('Audio victory playback suppressed or unavailable:', err);
  }
}
