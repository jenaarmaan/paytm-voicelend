import React, { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  isListening: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isListening,
  color = '#00BAF2',
  barCount = 28,
  height = 48
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const barWidth = Math.max(2, (width / barCount) - 3);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isListening) {
          // Dynamic procedural voice waveform simulating voice acoustics
          const wave1 = Math.sin(phase + i * 0.35);
          const wave2 = Math.cos(phase * 1.5 + i * 0.2);
          const rawHeight = (Math.abs(wave1 * wave2) + 0.15) * (height - 8);
          barHeight = Math.max(4, rawHeight);
        } else {
          barHeight = 4;
        }

        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2;

        // Gradient for sleek fintech appearance
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isListening) {
          gradient.addColorStop(0, '#00BAF2');
          gradient.addColorStop(1, '#002970');
        } else {
          gradient.addColorStop(0, '#CBD5E1');
          gradient.addColorStop(1, '#94A3B8');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
      }

      phase += 0.12;
      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isListening, barCount, height, color]);

  return (
    <div className="w-full flex justify-center items-center py-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={height}
        className="w-full max-w-xs h-12"
      />
    </div>
  );
};
