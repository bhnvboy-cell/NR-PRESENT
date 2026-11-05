import { useState } from 'react';
import type { MediaElement } from '../../types/editor';
import { extractYouTubeEmbedUrl } from '../../utils/media';

interface MediaOverlayProps {
  elements: MediaElement[];
  zoom: number;
  pan: { x: number; y: number };
  presenting?: boolean;
}

export function MediaOverlay({ elements, zoom, pan, presenting = false }: MediaOverlayProps) {
  const [playingIds, setPlayingIds] = useState<Record<string, boolean>>({});

  if (elements.length === 0) return null;

  const togglePlay = (id: string) => {
    setPlayingIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="media-overlay-layer" style={{ pointerEvents: 'none' }}>
      {elements.map((el) => {
        const isPlaying = Boolean(playingIds[el.id] || (presenting && el.autoplay));
        const left = pan.x + el.x * zoom;
        const top = pan.y + el.y * zoom;
        const width = el.width * zoom;
        const height = el.height * zoom;
        const ytEmbed = el.mediaType === 'video' ? extractYouTubeEmbedUrl(el.src) : null;

        if (el.mediaType === 'audio') {
          return (
            <div
              key={el.id}
              className="media-overlay-audio"
              style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top + height - Math.min(34, height * 0.45)}px`,
                width: `${width}px`,
                pointerEvents: 'auto',
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                transformOrigin: 'top left',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {el.src ? (
                <audio
                  src={el.src}
                  controls
                  autoPlay={presenting && Boolean(el.autoplay)}
                  loop={Boolean(el.loop)}
                  muted={Boolean(el.muted)}
                  style={{ width: '100%', height: '28px', borderRadius: '999px' }}
                />
              ) : null}
            </div>
          );
        }

        return (
          <div
            key={el.id}
            className="media-overlay-video"
            style={{
              position: 'absolute',
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
              pointerEvents: isPlaying ? 'auto' : 'none',
              borderRadius: `${14 * zoom}px`,
              overflow: 'hidden',
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              transformOrigin: 'top left',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isPlaying ? (
              ytEmbed ? (
                <iframe
                  src={`${ytEmbed}?autoplay=1&mute=${el.muted ? 1 : 0}&loop=${el.loop ? 1 : 0}`}
                  title={el.title || 'Embedded video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              ) : el.src ? (
                <video
                  src={el.src}
                  controls
                  autoPlay
                  loop={Boolean(el.loop)}
                  muted={Boolean(el.muted)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                />
              ) : (
                <SynthesizedVideoDemo title={el.title} accent={el.posterColor || '#6366f1'} />
              )
            ) : null}

            <button
              type="button"
              className="media-play-toggle"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay(el.id);
              }}
              title={isPlaying ? 'Stop video preview' : 'Play video'}
            >
              {isPlaying ? '⏹ Stop' : '▶ Play'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SynthesizedVideoDemo({ title, accent }: { title: string; accent: string }) {
  return (
    <div
      className="synth-video-demo"
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, #0f172a, ${accent})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="synth-video-pulse" />
      <strong style={{ fontSize: '18px', zIndex: 1 }}>{title || 'Motion Video Clip'}</strong>
      <span style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px', zIndex: 1 }}>● Playing live motion canvas</span>
    </div>
  );
}
