import { useState } from 'react';
import { useCanvasUi } from '../../store/canvasUi';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_SLIDE_SIZE } from '../../types/editor';

export function CommentsPanel() {
  const setRightPanel = useCanvasUi((s) => s.setRightPanel);
  const collaborators = useCanvasUi((s) => s.collaborators);
  const slides = useEditorStore((s) => s.project.slides);
  const currentSlideIndex = useEditorStore((s) => s.currentSlideIndex);
  const selectSlide = useEditorStore((s) => s.selectSlide);
  const rawComments = useEditorStore((s) => s.project.comments);
  const comments = rawComments ?? [];
  const addComment = useEditorStore((s) => s.addComment);
  const replyComment = useEditorStore((s) => s.replyComment);
  const toggleResolveComment = useEditorStore((s) => s.toggleResolveComment);
  const deleteComment = useEditorStore((s) => s.deleteComment);
  const slideSize = useEditorStore((s) => s.project.slideSize ?? DEFAULT_SLIDE_SIZE);
  const user = useAuthStore((s) => s.user);

  const [draft, setDraft] = useState('');
  const [pinToSlide, setPinToSlide] = useState(true);
  const [scope, setScope] = useState<'slide' | 'all'>('slide');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const currentSlide = slides[currentSlideIndex];
  const authorName = user?.email ? user.email.split('@')[0] : 'Designer';

  const visibleComments = comments.filter((c) =>
    scope === 'all' ? true : c.slideId === currentSlide?.id,
  );

  const handleAdd = () => {
    if (!draft.trim()) return;
    const pin = pinToSlide
      ? {
          x: Math.round(slideSize.width * (0.25 + ((comments.length * 0.17) % 0.5))),
          y: Math.round(slideSize.height * (0.22 + ((comments.length * 0.13) % 0.45))),
        }
      : undefined;
    addComment(draft, authorName, pin);
    setDraft('');
  };

  const handleReply = (commentId: string) => {
    const text = replyDrafts[commentId]?.trim();
    if (!text) return;
    replyComment(commentId, text, authorName);
    setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span>💬 Comments &amp; Live Collab</span>
        <button type="button" className="panel-close" onClick={() => setRightPanel('none')}>
          ×
        </button>
      </div>

      <div className="panel-body">
        <div className="collab-presence-box">
          <div className="collab-presence-head">
            <span>🟢 Live Session ({collaborators.length + 1} active)</span>
            <button
              type="button"
              className="chip"
              onClick={() => window.open(window.location.href, '_blank')}
              title="Open another tab to see real-time cursor & slide sync"
            >
              + Open Co-Editor Tab
            </button>
          </div>
          <div className="collab-avatars">
            <span className="collab-pill" style={{ background: '#4f46e5' }}>
              {authorName} (You)
            </span>
            {collaborators.map((peer) => (
              <span key={peer.peerId} className="collab-pill" style={{ background: peer.color }}>
                {peer.name} · Slide {peer.slideIndex + 1}
              </span>
            ))}
          </div>
        </div>

        <textarea
          className="notes-input"
          rows={2}
          placeholder={`Add comment on Slide ${currentSlideIndex + 1}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleAdd();
            }
          }}
        />

        <div className="field-row" style={{ justifyContent: 'space-between' }}>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={pinToSlide}
              onChange={(e) => setPinToSlide(e.target.checked)}
            />
            Pin badge on canvas
          </label>
          <button
            type="button"
            className="sidebar-action"
            style={{ width: 'auto', padding: '6px 14px' }}
            disabled={!draft.trim()}
            onClick={handleAdd}
          >
            Post Comment
          </button>
        </div>

        <div className="segmented" style={{ marginTop: 6 }}>
          <button
            type="button"
            className={scope === 'slide' ? 'is-active' : ''}
            onClick={() => setScope('slide')}
          >
            This Slide ({comments.filter((c) => c.slideId === currentSlide?.id).length})
          </button>
          <button
            type="button"
            className={scope === 'all' ? 'is-active' : ''}
            onClick={() => setScope('all')}
          >
            All Slides ({comments.length})
          </button>
        </div>

        {visibleComments.length === 0 ? (
          <p className="panel-empty">No comments yet. Post feedback or open a co-editor tab!</p>
        ) : (
          <ul className="comment-list">
            {visibleComments.map((c) => {
              const slideIdx = slides.findIndex((s) => s.id === c.slideId);
              return (
                <li key={c.id} className={`comment-card ${c.resolved ? 'is-resolved' : ''}`}>
                  <div className="comment-card-head">
                    <strong>{c.author}</strong>
                    {slideIdx >= 0 ? (
                      <button
                        type="button"
                        className="chip"
                        onClick={() => selectSlide(slideIdx)}
                      >
                        Slide {slideIdx + 1}
                      </button>
                    ) : null}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        className="layer-icon"
                        title={c.resolved ? 'Reopen' : 'Resolve'}
                        onClick={() => toggleResolveComment(c.id)}
                      >
                        {c.resolved ? '↩' : '✓'}
                      </button>
                      <button
                        type="button"
                        className="layer-icon"
                        title="Delete comment"
                        onClick={() => deleteComment(c.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p className="comment-card-body">{c.text}</p>

                  {c.replies && c.replies.length > 0 ? (
                    <div className="comment-replies">
                      {c.replies.map((r) => (
                        <div key={r.id} className="comment-reply">
                          <strong>{r.author}:</strong> {r.text}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="comment-reply-box">
                    <input
                      className="text-input"
                      placeholder="Reply…"
                      value={replyDrafts[c.id] ?? ''}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReply(c.id);
                      }}
                    />
                    <button
                      type="button"
                      className="chip"
                      onClick={() => handleReply(c.id)}
                    >
                      Reply
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
