
import React, { useCallback } from 'react';

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.2) => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
  
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + startTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start(audioCtx.currentTime + startTime);
  oscillator.stop(audioCtx.currentTime + startTime + duration);
};

export const useSoundEffects = () => {
  const playCorrect = useCallback(() => {
    // "Yeah!" effect: Quick rising slide + bright chord
    const now = 0;
    playTone(400, 'sine', 0.1, now, 0.3); // Y
    playTone(600, 'sine', 0.3, now + 0.05, 0.4); // eah
    playTone(800, 'sine', 0.4, now + 0.1, 0.2); 
  }, []);

  const playIncorrect = useCallback(() => {
    // "Et et!" effect: Two harsh low pulses
    playTone(150, 'square', 0.15, 0, 0.3);
    playTone(150, 'square', 0.15, 0.2, 0.3);
  }, []);

  const playFinish = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((t, i) => {
      playTone(t, 'sine', 0.6, i * 0.12, 0.3);
    });
  }, []);

  return { playCorrect, playIncorrect, playFinish };
};
