import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Download, Maximize2, GitBranch } from 'lucide-react';
import type { ParseTreeNode } from '../../core/compiler/parseTree';
import { downloadSvgElement } from '../../utils/svgExport';

interface ParseTreeViewProps {
  /** Complete tree(s); nodes appear once `step` reaches their createdAtStep */
  roots: ParseTreeNode[];
  step: number;
  /** Node the current step works on (highlighted) */
  activeNodeId?: string | null;
  title?: string;
  emptyMessage?: string;
}

const VIRTUAL_ROOT = '__forest__';

/**
 * The part of the tree visible at `step`. Top-down parsers (LL) always show one growing tree;
 * bottom-up parsers (LR) show a forest of finished subtrees until the final reduction joins them.
 */
function visibleForest(roots: ParseTreeNode[], step: number): ParseTreeNode[] {
  const forest: ParseTreeNode[] = [];
  const visit = (node: ParseTreeNode, parentVisible: boolean) => {
    const visible = node.createdAtStep <= step;
    if (visible && !parentVisible) forest.push(node);
    node.children.forEach((child) => visit(child, visible));
  };
  roots.forEach((root) => visit(root, false));
  return forest;
}

const nodeWidth = (symbol: string) => Math.max(34, symbol.length * 9 + 18);

/** Zoomable D3 parse tree with step-by-step reveal, active-node highlight and SVG export. */
export const ParseTreeView: React.FC<ParseTreeViewProps> = ({
  roots,
  step,
  activeNodeId,
  title = 'Parse Tree',
  emptyMessage = 'No parse tree yet.',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const center = (animate: boolean) => {
    if (!svgRef.current || !containerRef.current || !zoomRef.current) return;
    const width = containerRef.current.clientWidth || 600;
    const svg = d3.select(svgRef.current);
    const target = d3.zoomIdentity.translate(width / 2, 40);
    if (animate) svg.transition().duration(400).call(zoomRef.current.transform, target);
    else svg.call(zoomRef.current.transform, target);
  };

  // Zoom behavior is created once, so stepping through the parse keeps the user's pan and zoom
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const layer = svg.append('g').attr('class', 'parse-tree-layer');
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => layer.attr('transform', event.transform));
    svg.call(zoom);
    zoomRef.current = zoom;
    center(false);
    return () => {
      svg.on('.zoom', null);
      layer.remove();
    };
  }, []);

  // A different tree (new grammar or input) starts centered again
  useEffect(() => center(false), [roots]);

  useEffect(() => {
    if (!svgRef.current) return;
    const layer = d3.select(svgRef.current).select<SVGGElement>('g.parse-tree-layer');
    layer.selectAll('*').remove();

    const forest = visibleForest(roots, step);
    if (forest.length === 0) return;

    const virtual: ParseTreeNode = { id: VIRTUAL_ROOT, symbol: '', kind: 'nonterminal', children: forest, createdAtStep: 0 };
    const hierarchy = d3.hierarchy(virtual, (n) =>
      n.id === VIRTUAL_ROOT ? n.children : n.children.filter((c) => c.createdAtStep <= step)
    );
    d3.tree<ParseTreeNode>()
      .nodeSize([70, 70])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.3))(hierarchy);

    // Drop the invisible forest root: shift everything up one level
    const nodes = hierarchy.descendants().filter((d) => d.data.id !== VIRTUAL_ROOT);
    const links = hierarchy.links().filter((l) => l.source.data.id !== VIRTUAL_ROOT);
    const y = (d: d3.HierarchyNode<ParseTreeNode>) => ((d as d3.HierarchyPointNode<ParseTreeNode>).y ?? 0) - 70;
    const x = (d: d3.HierarchyNode<ParseTreeNode>) => (d as d3.HierarchyPointNode<ParseTreeNode>).x ?? 0;

    layer
      .append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', (l) => `M${x(l.source)},${y(l.source) + 14} C${x(l.source)},${(y(l.source) + y(l.target)) / 2} ${x(l.target)},${(y(l.source) + y(l.target)) / 2} ${x(l.target)},${y(l.target) - 14}`)
      .attr('fill', 'none')
      .attr('stroke', '#475569')
      .attr('stroke-width', 1.5);

    const groups = layer
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x(d)},${y(d)})`);

    groups.each(function (d) {
      const g = d3.select(this);
      const node = d.data;
      const width = nodeWidth(node.symbol);
      const isActive = node.id === activeNodeId;
      const isDone = node.doneAtStep !== undefined && node.doneAtStep <= step;
      const palette =
        node.kind === 'nonterminal'
          ? { fill: 'rgba(168, 85, 247, 0.18)', stroke: '#a855f7', text: '#e9d5ff' }
          : node.kind === 'terminal'
            ? { fill: isDone ? 'rgba(16, 185, 129, 0.22)' : 'rgba(15, 23, 42, 0.9)', stroke: '#10b981', text: '#d1fae5' }
            : { fill: 'rgba(15, 23, 42, 0.9)', stroke: '#64748b', text: '#94a3b8' };

      g.append('rect')
        .attr('x', -width / 2)
        .attr('y', -14)
        .attr('width', width)
        .attr('height', 28)
        .attr('rx', node.kind === 'nonterminal' ? 14 : 6)
        .attr('fill', palette.fill)
        .attr('stroke', isActive ? '#f59e0b' : palette.stroke)
        .attr('stroke-width', isActive ? 3 : 1.5)
        .attr('stroke-dasharray', node.kind === 'terminal' && !isDone ? '4 3' : null)
        .attr('filter', isActive ? 'drop-shadow(0 0 8px #f59e0b)' : null);

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', palette.text)
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '13px')
        .attr('font-weight', 700)
        .attr('font-style', node.kind === 'epsilon' ? 'italic' : null)
        .text(node.symbol);
    });
  }, [roots, step, activeNodeId]);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <GitBranch size={15} color="var(--accent-purple)" /> {title}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn-secondary"
            onClick={() => svgRef.current && downloadSvgElement(svgRef.current, 'parse-tree.svg')}
            disabled={roots.length === 0}
            title="Download the tree as an SVG image"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <Download size={12} /> Export SVG
          </button>
          <button className="btn-secondary" onClick={() => center(true)} title="Center the tree" style={{ padding: '4px 8px', fontSize: '11px' }}>
            <Maximize2 size={12} /> Center
          </button>
        </div>
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <svg ref={svgRef} role="img" aria-label={title} style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }} />
        {roots.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {emptyMessage}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '14px', padding: '6px 12px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span><span style={{ color: '#a855f7' }}>●</span> nonterminal</span>
        <span><span style={{ color: '#10b981' }}>●</span> terminal (dashed until matched)</span>
        <span><span style={{ color: '#f59e0b' }}>●</span> current step</span>
      </div>
    </div>
  );
};

export default ParseTreeView;
