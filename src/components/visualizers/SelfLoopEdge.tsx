import React from 'react';
import { BaseEdge, type EdgeProps } from '@xyflow/react';

/**
 * Draws a transition from a state back to itself as an arc over the top of the node.
 * `data.loopIndex` stacks several self-loops on one state at increasing heights.
 */
export const SelfLoopEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
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
  const loopIndex = typeof data?.loopIndex === 'number' ? data.loopIndex : 0;
  const height = 95 + loopIndex * 38;
  const spread = 45 + loopIndex * 12;

  // Source handle is on the node's right edge, target handle on its left edge
  const path = `M ${sourceX} ${sourceY} C ${sourceX + spread} ${sourceY - height}, ${targetX - spread} ${targetY - height}, ${targetX} ${targetY}`;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerEnd={markerEnd}
      label={label}
      labelX={(sourceX + targetX) / 2}
      labelY={Math.min(sourceY, targetY) - height * 0.75}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
    />
  );
};

export default SelfLoopEdge;
