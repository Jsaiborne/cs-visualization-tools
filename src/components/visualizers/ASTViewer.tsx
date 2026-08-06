import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AlertTriangle, Network, Maximize2 } from 'lucide-react';
import { useCompilerStore } from '../../store/useCompilerStore';
import type { ASTNode } from '../../types/compiler';

export const ASTViewer: React.FC = () => {
  const { ast, parseError, selectedRange, setSelectedRange } = useCompilerStore();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ast || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create main zoomable group container
    const g = svg.append('g').attr('class', 'ast-tree-group');

    // Attach D3 Zoom Behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Children extractor function for ASTNode hierarchy
    const getChildren = (node: ASTNode): ASTNode[] => {
      if (node.type === 'Program') {
        return [node.body];
      }
      if (node.type === 'BinaryExpression') {
        return [node.left, node.right];
      }
      return [];
    };

    // Construct D3 Hierarchy
    const root = d3.hierarchy<ASTNode>(ast, getChildren);

    // Compute Tree Layout
    const nodeWidth = 140;
    const nodeHeight = 80;
    const treeLayout = d3.tree<ASTNode>().nodeSize([nodeWidth, nodeHeight]);
    treeLayout(root);

    // Center root initial view
    const initialTransform = d3.zoomIdentity.translate(width / 2, 60).scale(0.9);
    svg.call(zoom.transform as any, initialTransform);

    // Render Curved Bezier Links
    const linkGenerator = d3
      .linkVertical<any, d3.HierarchyPointNode<ASTNode>>()
      .x((d) => d.x)
      .y((d) => d.y);

    g.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(root.links())
      .enter()
      .append('path')
      .attr('d', linkGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', '#475569')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 2')
      .attr('opacity', 0.7);

    // Render Node Groups
    const nodes = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    // Node Event Listeners for Monaco Substring Hover Highlighting
    nodes
      .on('mouseenter', (_event, d) => {
        setSelectedRange({ start: d.data.start, end: d.data.end });
      })
      .on('mouseleave', () => {
        setSelectedRange(null);
      });

    // Helper for node colors
    const getNodeTheme = (type: string) => {
      switch (type) {
        case 'Program':
          return { bg: '#a855f7', stroke: '#c084fc', text: '#ffffff' };
        case 'BinaryExpression':
          return { bg: '#0284c7', stroke: '#38bdf8', text: '#ffffff' };
        case 'NumericLiteral':
          return { bg: '#059669', stroke: '#34d399', text: '#ffffff' };
        case 'Identifier':
          return { bg: '#4f46e5', stroke: '#818cf8', text: '#ffffff' };
        default:
          return { bg: '#334155', stroke: '#64748b', text: '#ffffff' };
      }
    };

    // Render Node Pill Cards
    nodes.each(function (d) {
      const el = d3.select(this);
      const theme = getNodeTheme(d.data.type);

      const isHovered =
        selectedRange &&
        selectedRange.start === d.data.start &&
        selectedRange.end === d.data.end;

      // Card Background Box
      el.append('rect')
        .attr('x', -55)
        .attr('y', -24)
        .attr('width', 110)
        .attr('height', 48)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('fill', 'rgba(15, 23, 42, 0.95)')
        .attr('stroke', isHovered ? '#38bdf8' : theme.stroke)
        .attr('stroke-width', isHovered ? 3 : 1.5)
        .attr('filter', isHovered ? 'drop-shadow(0 0 10px #38bdf8)' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))');

      // Header Pill Badge
      el.append('rect')
        .attr('x', -48)
        .attr('y', -18)
        .attr('width', 96)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', theme.bg)
        .attr('opacity', 0.85);

      // Node Type Title
      el.append('text')
        .attr('x', 0)
        .attr('y', -6)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .attr('font-family', 'var(--font-sans)')
        .text(d.data.type);

      // Node Detail Value / Operator
      let labelText = '';
      if (d.data.type === 'BinaryExpression') {
        labelText = `Op: "${d.data.operator}"`;
      } else if (d.data.type === 'NumericLiteral') {
        labelText = `Val: ${d.data.value}`;
      } else if (d.data.type === 'Identifier') {
        labelText = `Id: ${d.data.name}`;
      } else if (d.data.type === 'Program') {
        labelText = `Root`;
      }

      el.append('text')
        .attr('x', 0)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f8fafc')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('font-family', 'var(--font-mono)')
        .text(labelText);

      // Offset Range Badge
      el.append('text')
        .attr('x', 0)
        .attr('y', 36)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '8px')
        .attr('font-family', 'var(--font-mono)')
        .text(`[${d.data.start}:${d.data.end}]`);
    });
  }, [ast, selectedRange, setSelectedRange]);

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = containerRef.current.clientWidth || 600;
    svg.transition().duration(500).call(
      (d3.zoom().transform as any),
      d3.zoomIdentity.translate(width / 2, 60).scale(0.9)
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Info */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.6)',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={16} color="var(--accent-purple)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Abstract Syntax Tree (AST)
          </span>
        </div>

        <button
          className="btn-secondary"
          onClick={handleResetZoom}
          title="Reset Zoom & Pan View"
          style={{ padding: '4px 8px', fontSize: '11px' }}
        >
          <Maximize2 size={12} /> Center View
        </button>
      </div>

      {/* Parse Error Display */}
      {parseError ? (
        <div
          style={{
            margin: '20px',
            padding: '16px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--accent-amber)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
            <AlertTriangle size={18} /> Syntax Error Detected
          </div>
          <p style={{ fontSize: '12px', margin: 0, fontFamily: 'var(--font-mono)' }}>
            {parseError}
          </p>
        </div>
      ) : !ast ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          No valid AST available. Type a valid expression...
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
          <svg
            ref={svgRef}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'grab',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ASTViewer;
