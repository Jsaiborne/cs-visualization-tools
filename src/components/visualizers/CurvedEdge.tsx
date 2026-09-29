import React from 'react';
import { BaseEdge, useInternalNode, useStore, type EdgeProps, type InternalNode } from '@xyflow/react';

/** Distance between neighbouring edges' control points when several edges join the same two states. */
const PARALLEL_SPACING = 80;
/** Gap kept between a bypassing edge and a state it curves around. */
const BYPASS_MARGIN = 14;
/** Upper bound on how far a bypassing edge bows out, so very long edges stay on screen. */
const MAX_BYPASS_APEX = 160;

function nodeCircle(node: InternalNode) {
  const width = node.measured.width ?? 72;
  const height = node.measured.height ?? 72;
  return {
    x: node.internals.positionAbsolute.x + width / 2,
    y: node.internals.positionAbsolute.y + height / 2,
    r: Math.min(width, height) / 2,
  };
}

/**
 * Transition between two different states, drawn from circle outline to circle outline.
 *
 * Edges that join the same pair of states (in either direction) are bent apart so none of them
 * overlap: `data.offsetIndex` / `data.groupSize` place this edge within its group, measured in a
 * frame shared by both directions so a q0 → q1 / q1 → q0 pair lands on opposite sides.
 */
export const CurvedEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  data,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  style,
  markerEnd,
}) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const nodeLookup = useStore((state) => state.nodeLookup);
  if (!sourceNode || !targetNode) return null;

  const s = nodeCircle(sourceNode);
  const t = nodeCircle(targetNode);

  // Shared frame: always measured from the lexicographically smaller node id
  const [a, b] = source < target ? [s, t] : [t, s];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const perpX = -dy / length;
  const perpY = dx / length;

  const groupSize = typeof data?.groupSize === 'number' ? data.groupSize : 1;
  const offsetIndex = typeof data?.offsetIndex === 'number' ? data.offsetIndex : 0;
  let offset = (offsetIndex - (groupSize - 1) / 2) * PARALLEL_SPACING;

  if (offset === 0) {
    // A lone straight edge that would pass through another state bends just enough to clear it.
    // Bend toward the edge's own left so opposite-direction bypasses land on different sides.
    let apex = 0;
    for (const node of nodeLookup.values()) {
      if (node.id === source || node.id === target) continue;
      const c = nodeCircle(node);
      const tProj = ((c.x - s.x) * (t.x - s.x) + (c.y - s.y) * (t.y - s.y)) / ((t.x - s.x) ** 2 + (t.y - s.y) ** 2 || 1);
      if (tProj <= 0.05 || tProj >= 0.95) continue;
      const px = s.x + tProj * (t.x - s.x);
      const py = s.y + tProj * (t.y - s.y);
      const clearance = c.r + BYPASS_MARGIN;
      if (Math.hypot(c.x - px, c.y - py) >= clearance) continue;
      // A quadratic curve's height at parameter t is 4·t·(1-t)·apex
      apex = Math.max(apex, clearance / (4 * tProj * (1 - tProj)));
    }
    if (apex > 0) {
      const ownPerpSign = source < target ? 1 : -1;
      offset = Math.min(apex, MAX_BYPASS_APEX) * 2 * ownPerpSign;
    }
  }

  const controlX = (s.x + t.x) / 2 + perpX * offset;
  const controlY = (s.y + t.y) / 2 + perpY * offset;

  // Leave each circle in the direction of the control point so arrows meet the outline
  const pointOnCircle = (c: { x: number; y: number; r: number }) => {
    const vx = controlX - c.x;
    const vy = controlY - c.y;
    const d = Math.hypot(vx, vy) || 1;
    return { x: c.x + (vx / d) * c.r, y: c.y + (vy / d) * c.r };
  };
  const start = pointOnCircle(s);
  const end = pointOnCircle(t);

  const path = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;

  // Midpoint of the quadratic curve (t = 0.5)
  const labelX = 0.25 * start.x + 0.5 * controlX + 0.25 * end.x;
  const labelY = 0.25 * start.y + 0.5 * controlY + 0.25 * end.y;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerEnd={markerEnd}
      label={label}
      labelX={labelX}
      labelY={labelY}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
    />
  );
};

export default CurvedEdge;
