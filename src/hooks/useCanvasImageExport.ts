import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { downloadUrl } from '../utils/download';

export type ImageFormat = 'png' | 'svg';

// Room around the nodes for self-loop arcs (drawn above states) and edge labels
const IMAGE_PADDING = { top: 150, right: 70, bottom: 70, left: 90 };

/** Snapshot of the React Flow canvas framed to the nodes, independent of the current pan/zoom. */
export function useCanvasImageExport() {
  const { getNodes } = useReactFlow();
  return async (format: ImageFormat, filename: string) => {
    const viewport = document.querySelector<HTMLElement>('.react-flow__viewport');
    const nodes = getNodes();
    if (!viewport || nodes.length === 0) return;
    const bounds = getNodesBounds(nodes);
    const width = Math.ceil(bounds.width + IMAGE_PADDING.left + IMAGE_PADDING.right);
    const height = Math.ceil(bounds.height + IMAGE_PADDING.top + IMAGE_PADDING.bottom);
    const { toPng, toSvg } = await import('html-to-image');
    const options = {
      backgroundColor: '#090d16',
      width,
      height,
      pixelRatio: 2,
      // Connection handles are editing affordances, not part of the diagram
      filter: (node: HTMLElement) => !node.classList?.contains('react-flow__handle'),
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${IMAGE_PADDING.left - bounds.x}px, ${IMAGE_PADDING.top - bounds.y}px) scale(1)`,
      },
    };
    const url = format === 'png' ? await toPng(viewport, options) : await toSvg(viewport, options);
    downloadUrl(filename, url);
  };
}
