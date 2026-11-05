import type { MediaElement } from '../types/editor';

export function drawMediaElement(ctx: CanvasRenderingContext2D, el: MediaElement): void {
  const w = el.width;
  const h = el.height;
  const accent = el.posterColor || '#6366f1';

  ctx.save();
  if (el.mediaType === 'video') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.55, '#1e1b4b');
    grad.addColorStop(1, accent);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 14);
    ctx.fill();

    // Subtle film grid
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(10, 10, Math.max(0, w - 20), Math.max(0, h - 20), 10);
    ctx.stroke();

    // Play circle
    const r = Math.min(w, h) * 0.14;
    const cx = w / 2;
    const cy = h / 2 - 8;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Play triangle
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.28, cy - r * 0.42);
    ctx.lineTo(cx + r * 0.45, cy);
    ctx.lineTo(cx - r * 0.28, cy + r * 0.42);
    ctx.closePath();
    ctx.fill();

    // Bottom progress bar chrome
    const barY = h - 38;
    ctx.fillStyle = 'rgba(15,23,42,0.65)';
    ctx.beginPath();
    ctx.roundRect(14, Math.max(8, barY), Math.max(0, w - 28), 26, 7);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🎬 ${el.title || 'Video clip'}`, 26, Math.max(21, barY + 13), Math.max(20, w - 52));
  } else {
    // Audio pill card
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, accent);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, Math.min(20, h / 2));
    ctx.fill();

    // Play icon disc
    const r = Math.min(h * 0.34, 26);
    const cx = 18 + r;
    const cy = h / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.25, cy - r * 0.38);
    ctx.lineTo(cx + r * 0.42, cy);
    ctx.lineTo(cx - r * 0.25, cy + r * 0.38);
    ctx.closePath();
    ctx.fill();

    // Title + waveform bars
    const textX = cx + r + 14;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`🎵 ${el.title || 'Audio track'}`, textX, Math.max(8, h * 0.2), Math.max(20, w - textX - 16));

    // Decorative waveform
    const waveY = h * 0.68;
    const bars = Math.max(6, Math.floor((w - textX - 24) / 7));
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    for (let i = 0; i < bars; i += 1) {
      const bh = 4 + ((i * 7 + 3) % 13);
      ctx.fillRect(textX + i * 7, waveY - bh / 2, 3, bh);
    }
  }
  ctx.restore();
}

export function extractYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\/+/, '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

/** Synthesize a pleasant ambient chord progression as a playable WAV data URL. */
export function createSampleAudioDataUrl(kind: 'chime' | 'ambient' | 'upbeat' = 'chime'): string {
  const sampleRate = 22050;
  const durationSec = 2.4;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const freqs =
    kind === 'ambient'
      ? [261.63, 329.63, 392.0, 493.88]
      : kind === 'upbeat'
        ? [329.63, 415.3, 493.88, 659.25]
        : [523.25, 659.25, 783.99, 1046.5];

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate;
    const env = Math.min(1, t / 0.08) * Math.exp(-t * 1.4);
    let sample = 0;
    for (let f = 0; f < freqs.length; f += 1) {
      const noteStart = f * 0.18;
      if (t >= noteStart) {
        const localT = t - noteStart;
        const noteEnv = Math.min(1, localT / 0.03) * Math.exp(-localT * 1.8);
        sample += Math.sin(2 * Math.PI * freqs[f] * localT) * noteEnv * 0.25;
      }
    }
    const val = Math.max(-1, Math.min(1, sample * (0.6 + 0.4 * env)));
    view.setInt16(44 + i * 2, Math.round(val * 32767), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}
