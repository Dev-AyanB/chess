import { useCallback, useRef } from 'react';

// Frequencies for different sounds
const SOUNDS = {
  move: 300,
  capture: 800,
  check: 400,
  gameOver: 200,
};

export function useSound(enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (!enabled) return;
    
    try {
      const ctx = getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type === 'capture' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(SOUNDS[type], ctx.currentTime);

      if (type === 'check') {
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      } else if (type === 'gameOver') {
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
      }

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === 'gameOver' ? 0.5 : 0.1));

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (type === 'gameOver' ? 0.5 : 0.1));
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }, [enabled]);

  return { playSound };
}
