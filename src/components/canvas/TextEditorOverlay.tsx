import { useEffect, useRef } from 'react';
import type { TextElement } from '../../types/editor';

interface TextEditorOverlayProps {
  element: TextElement;
  zoom: number;
  pan: { x: number; y: number };
  onCommit: (text: string) => void;
  onClose: () => void;
}

export function TextEditorOverlay({ element, zoom, pan, onCommit, onClose }: TextEditorOverlayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastText = useRef(element.text);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.select();
  }, []);

  const applyClose = () => {
    onCommit(lastText.current);
    onClose();
  };

  return (
    <textarea
      ref={textareaRef}
      className="text-editor-overlay"
      style={{
        left: pan.x + element.x * zoom,
        top: pan.y + element.y * zoom,
        width: Math.max(40, element.width * zoom),
        minHeight: Math.max(24, element.height * zoom),
        fontFamily: `'${element.fontFamily}', sans-serif`,
        fontSize: element.fontSize * zoom,
        fontWeight: element.fontWeight,
        fontStyle: element.italic ? 'italic' : 'normal',
        lineHeight: element.lineHeight,
        letterSpacing: element.letterSpacing * zoom,
        color: element.fill,
        textAlign: element.align,
        textDecoration:
          element.decoration === 'none' ? undefined : (element.decoration as 'underline' | 'line-through'),
      }}
      defaultValue={element.text}
      onChange={(event) => {
        lastText.current = event.target.value;
        onCommit(event.target.value);
      }}
      onBlur={applyClose}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          applyClose();
        }
      }}
    />
  );
}
