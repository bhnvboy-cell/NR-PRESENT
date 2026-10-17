import { memo } from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import { DEFAULT_SLIDE_SIZE, type Slide, type SlideSize } from '../../types/editor';
import { backgroundToKonva } from '../../utils/background';
import { ElementNode } from './ElementNode';

interface MiniSlidePreviewProps {
  slide: Slide;
  width?: number;
  size?: SlideSize;
}

const MINI_WIDTH = 168;

function MiniSlidePreviewInner({ slide, width = MINI_WIDTH, size }: MiniSlidePreviewProps) {
  const slideSize = size ?? DEFAULT_SLIDE_SIZE;
  const height = (slideSize.height * width) / slideSize.width;
  const bgProps = backgroundToKonva(slide.backgroundFill, slideSize.width, slideSize.height);
  return (
    <Stage
      width={width}
      height={height}
      scaleX={width / slideSize.width}
      scaleY={width / slideSize.width}
      listening={false}
      style={{ pointerEvents: 'none', display: 'block' }}
    >
      <Layer listening={false}>
        <Rect width={slideSize.width} height={slideSize.height} {...bgProps} listening={false} />
        {slide.elements
          .filter((element) => !element.hidden)
          .map((element) => (
            <ElementNode key={element.id} element={element} selected={false} interactive={false} listening={false} />
          ))}
      </Layer>
    </Stage>
  );
}

export const MiniSlidePreview = memo(MiniSlidePreviewInner);
