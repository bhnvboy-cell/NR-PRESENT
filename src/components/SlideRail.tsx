import { useState } from 'react';
import { DEFAULT_SLIDE_SIZE } from '../types/editor';
import { useEditorStore } from '../store/editorStore';
import { MiniSlidePreview } from './canvas/MiniSlidePreview';

interface SectionGroup {
  name: string | undefined;
  startIndex: number;
  indexes: number[];
}

function groupSlides(slides: { section?: string }[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  slides.forEach((slide, index) => {
    const last = groups[groups.length - 1];
    if (!last || last.name !== slide.section) {
      groups.push({ name: slide.section, startIndex: index, indexes: [index] });
    } else {
      last.indexes.push(index);
    }
  });
  return groups;
}

export function SlideRail() {
  const slides = useEditorStore((state) => state.project.slides);
  const slideSize = useEditorStore((state) => state.project.slideSize ?? DEFAULT_SLIDE_SIZE);
  const currentIndex = useEditorStore((state) => state.currentSlideIndex);
  const selectSlide = useEditorStore((state) => state.selectSlide);
  const addSlide = useEditorStore((state) => state.addSlide);
  const deleteSlide = useEditorStore((state) => state.deleteSlide);
  const duplicateSlide = useEditorStore((state) => state.duplicateSlide);
  const moveSlide = useEditorStore((state) => state.moveSlide);
  const setSlideSection = useEditorStore((state) => state.setSlideSection);
  const renameSection = useEditorStore((state) => state.renameSection);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = groupSlides(slides);
  const hasSections = groups.some((g) => g.name !== undefined);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const promptSectionForSlide = (index: number) => {
    const current = slides[index]?.section ?? '';
    const name = window.prompt('Section name (empty to remove):', current);
    if (name === null) return;
    const trimmed = name.trim();
    const untilNext =
      trimmed !== '' &&
      window.confirm('Apply this section to following slides until the next section?');
    setSlideSection(index, trimmed || undefined, untilNext);
  };

  const promptRenameSection = (name: string) => {
    const next = window.prompt('Rename section:', name);
    if (next === null || next.trim() === name) return;
    renameSection(name, next);
  };

  const renderThumb = (index: number) => {
    const slide = slides[index];
    return (
      <div
        key={slide.id}
        className={`slide-thumb ${index === currentIndex ? 'is-active' : ''}`}
        onClick={() => selectSlide(index)}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('text/slide-index', String(index));
          event.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const from = Number(event.dataTransfer.getData('text/slide-index'));
          if (!Number.isNaN(from)) moveSlide(from, index);
        }}
      >
        <span className="slide-thumb-number">{index + 1}</span>
        {slide.notes?.trim() ? (
          <span className="slide-thumb-notes" title="Has speaker notes">
            📝
          </span>
        ) : null}
        <MiniSlidePreview slide={slide} size={slideSize} />
        <div className="slide-thumb-actions">
          {hasSections ? (
            <button
              type="button"
              title={slide.section ? `Section: ${slide.section}` : 'Assign to section'}
              onClick={(event) => {
                event.stopPropagation();
                promptSectionForSlide(index);
              }}
            >
              §
            </button>
          ) : null}
          <button
            type="button"
            title="Duplicate slide"
            onClick={(event) => {
              event.stopPropagation();
              selectSlide(index);
              duplicateSlide();
            }}
          >
            ⧉
          </button>
          <button
            type="button"
            title="Delete slide"
            disabled={slides.length <= 1}
            onClick={(event) => {
              event.stopPropagation();
              deleteSlide(index);
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside className="slide-rail">
      <div className="slide-rail-header">
        <span>Slides</span>
        <button type="button" className="icon-button" title="New slide" onClick={addSlide}>
          +
        </button>
      </div>
      <div className="slide-rail-list">
        {groups.map((group) => {
          if (!hasSections) return group.indexes.map((i) => renderThumb(i));
          const key = group.name ?? `__ungrouped_${group.startIndex}`;
          const isCollapsed = collapsed.has(key);
          return (
            <div key={key} className="slide-section">
              <div className="slide-section-head">
                <button
                  type="button"
                  className="slide-section-toggle"
                  onClick={() => toggleCollapse(key)}
                  title={isCollapsed ? 'Expand section' : 'Collapse section'}
                >
                  {isCollapsed ? '▸' : '▾'}
                </button>
                <button
                  type="button"
                  className="slide-section-name"
                  onClick={() => {
                    if (group.name) promptRenameSection(group.name);
                    else selectSlide(group.startIndex);
                  }}
                  title={group.name ? 'Rename section' : 'Unsectioned slides'}
                >
                  {group.name ?? `Slides ${group.startIndex + 1}–${group.startIndex + group.indexes.length}`}
                </button>
                <span className="slide-section-count">{group.indexes.length}</span>
              </div>
              {isCollapsed ? null : group.indexes.map((i) => renderThumb(i))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
