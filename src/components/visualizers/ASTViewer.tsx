import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AlertTriangle, Network, Maximize2, Download } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCompilerStore } from '../../store/useCompilerStore';
import type { ASTNode } from '../../types/compiler';
import { downloadSvgElement } from '../../utils/svgExport';

export const ASTViewer: React.FC = () => {
  const {
    ast,
    parseError,
    selectedRange,
    setSelectedRange,
  } = useCompilerStore(
    useShallow((state) => ({
      ast: state.ast,
      parseError: state.parseError,
      selectedRange: state.selectedRange,
      setSelectedRange: state.setSelectedRange,
    }))
  );
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

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
    zoomRef.current = zoom;

    // Children extractor function for ASTNode hierarchy
    const getChildren = (node: ASTNode): ASTNode[] => {
      if (node.type === 'Program') {
        return [node.body];
      }
      if (node.type === 'BinaryExpression') {
        return [node.left, node.right];
      }
      if (node.type === 'UnaryExpression') {
        return [node.argument];
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

    // Resize Observer for responsive centering
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const newWidth = entries[0].contentRect.width;
      svg.transition().duration(200).call(
        zoom.transform as any,
        d3.zoomIdentity.translate(newWidth / 2, 60).scale(0.9)
      );
    });
    resizeObserver.observe(container);

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
      .style('fill', 'none')
      .style('stroke', 'var(--border-strong)')
      .attr('stroke-width', 1.5);

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

    // Node kinds differ only in the color of their value text; cards themselves stay neutral
    const valueColor = (type: string) => {
      switch (type) {
        case 'BinaryExpression':
        case 'UnaryExpression':
          return 'var(--cat-2)';
        case 'NumericLiteral':
          return 'var(--cat-4)';
        case 'Identifier':
          return 'var(--cat-1)';
        default:
          return 'var(--text)';
      }
    };

    nodes.each(function (d) {
      const el = d3.select(this);

      // Card (hover styling is applied by the highlight effect below)
      el.append('rect')
        .attr('class', 'ast-card')
        .attr('data-stroke', 'var(--border-strong)')
        .attr('x', -55)
        .attr('y', -26)
        .attr('width', 110)
        .attr('height', 54)
        .attr('rx', 6)
        .attr('ry', 6)
        .style('fill', 'var(--surface)')
        .style('stroke', 'var(--border-strong)')
        .attr('stroke-width', 1.5);

      // Node type
      el.append('text')
        .attr('x', 0)
        .attr('y', -11)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--text-muted)')
        .style('font-family', 'var(--font-sans)')
        .attr('font-size', '10px')
        .text(d.data.type);

      // Operator / value / name
      let labelText = '';
      if (d.data.type === 'BinaryExpression' || d.data.type === 'UnaryExpression') {
        labelText = d.data.operator;
      } else if (d.data.type === 'NumericLiteral') {
        labelText = String(d.data.value);
      } else if (d.data.type === 'Identifier') {
        labelText = d.data.name;
      } else if (d.data.type === 'Program') {
        labelText = 'root';
      }

      el.append('text')
        .attr('x', 0)
        .attr('y', 6)
        .attr('text-anchor', 'middle')
        .style('fill', valueColor(d.data.type))
        .style('font-family', 'var(--font-mono)')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .text(labelText);

      // Source range (inside the card, clear of the links below it)
      el.append('text')
        .attr('x', 0)
        .attr('y', 21)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--text-muted)')
        .style('font-family', 'var(--font-mono)')
        .attr('font-size', '9px')
        .text(`[${d.data.start}:${d.data.end}]`);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [ast, setSelectedRange]);

  // Highlight the card whose source range matches the hovered AST node / TAC line,
  // without rebuilding the tree (which would discard the user's zoom and pan).
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll<SVGRectElement, d3.HierarchyPointNode<ASTNode>>('rect.ast-card')
      .each(function (d) {
        const isHovered =
          !!selectedRange && selectedRange.start === d.data.start && selectedRange.end === d.data.end;
        d3.select(this)
          .style('stroke', isHovered ? 'var(--accent)' : (this.getAttribute('data-stroke') ?? 'var(--border-strong)'))
          .attr('stroke-width', isHovered ? 2 : 1.5);
      });
  }, [ast, selectedRange]);

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = containerRef.current.clientWidth || 600;
    svg.transition().duration(500).call(
      zoomRef.current.transform as any,
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
        background: 'var(--surface-2)',
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
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Abstract Syntax Tree (AST)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn-secondary"
            onClick={() => svgRef.current && downloadSvgElement(svgRef.current, 'syntax-tree.svg')}
            disabled={!ast}
            title="Download the tree as an SVG image"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <Download size={12} /> Export SVG
          </button>
          <button
            className="btn-secondary"
            onClick={handleResetZoom}
            title="Reset Zoom & Pan View"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <Maximize2 size={12} /> Center View
          </button>
        </div>
      </div>

      {/* Parse Error Display */}
      {parseError ? (
        <div
          style={{
            margin: '20px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--warning-subtle)',
            border: '1px solid var(--warning-border)',
            color: 'var(--warning)',
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
