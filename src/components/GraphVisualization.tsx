'use client';

import { useEffect, useRef, useCallback } from 'react';
import createPanZoom from 'panzoom';
import createLayout from 'ngraph.forcelayout';
import type { Graph, GraphNode, GraphLink } from '@/lib/buildGraph';

interface GraphVisualizationProps {
  graph: Graph | null;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onLayoutReady?: () => void;
}

export default function GraphVisualization({
  graph,
  onNodeClick,
  onNodeDoubleClick,
  onLayoutReady,
}: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const sceneRef = useRef<SVGGElement>(null);
  const nodesRef = useRef<SVGGElement>(null);
  const edgesRef = useRef<SVGGElement>(null);
  const panzoomRef = useRef<any>(null);
  const layoutRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();
  const nodesMapRef = useRef<Map<string, SVGGElement>>(new Map());
  const eventHandlersRef = useRef<Map<SVGGElement, { click: (e: Event) => void; dblclick: (e: Event) => void }>>(new Map());

  // Initialize panzoom once
  useEffect(() => {
    if (!sceneRef.current) return;

    const pz = createPanZoom(sceneRef.current, {
      maxZoom: 5,
      minZoom: 0.1,
      smoothScroll: false,
    });

    pz.showRectangle({
      left: -500,
      right: 500,
      top: -500,
      bottom: 500,
      width: 1000,
      height: 1000,
    } as any);

    panzoomRef.current = pz;

    return () => {
      pz.dispose();
      panzoomRef.current = null;
    };
  }, []);

  // Stable highlight function
  const highlightNode = useCallback((nodeId: string) => {
    if (!graph || !sceneRef.current) return;

    // Remove all highlighting - scoped to this component only
    const sceneElement = sceneRef.current;
    sceneElement.querySelectorAll('.hovered').forEach((el) => {
      el.classList.remove('hovered');
    });

    // Highlight selected node
    const node = nodesMapRef.current.get(nodeId);
    if (node) {
      node.classList.add('hovered');
    }

    // Highlight connected nodes and links
    graph.forEachLinkedNode(nodeId, (otherNode: GraphNode, link: GraphLink) => {
      const otherNodeUI = nodesMapRef.current.get(otherNode.id);
      if (otherNodeUI) {
        otherNodeUI.classList.add('hovered');
      }

      const linkUI = sceneElement.querySelector(`#${CSS.escape(link.id)}`);
      if (linkUI) {
        linkUI.classList.add('hovered');
      }
    });
  }, [graph]);

  // Stable render node function
  const renderNode = useCallback((node: GraphNode, layout: any) => {
    if (!nodesRef.current) return;

    const dRatio = node.data.size * 1.2;
    const fontSize = 24 * dRatio + 12;
    const textContent = node.id;

    // Measure text (approximate)
    const charWidth = fontSize * 0.6;
    const textWidth = textContent.length * charWidth;
    const width = textWidth + fontSize * 2;
    const height = fontSize * 1.6;

    const pos = layout.getNodePosition(node.id);

    // Create group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node');
    g.setAttribute('id', `node-${node.id}`);
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

    // Create rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(-width / 2));
    rect.setAttribute('y', String(-height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(15 * dRatio + 2));
    rect.setAttribute('ry', String(15 * dRatio + 2));
    rect.setAttribute('fill', 'white');
    rect.setAttribute('stroke', '#aaa');
    rect.setAttribute('stroke-width', String(4 * dRatio + 1));

    // Create text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(fontSize * 0.35));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('fill', '#2c3e50');
    text.textContent = textContent;

    g.appendChild(rect);
    g.appendChild(text);

    // Create and store event handlers
    const clickHandler = (e: Event) => {
      e.stopPropagation();
      if (onNodeClick) onNodeClick(node.id);
      highlightNode(node.id);
    };

    const dblclickHandler = (e: Event) => {
      e.stopPropagation();
      if (onNodeDoubleClick) onNodeDoubleClick(node.id);
    };

    g.addEventListener('click', clickHandler);
    g.addEventListener('dblclick', dblclickHandler);

    // Store handlers for cleanup
    eventHandlersRef.current.set(g, {
      click: clickHandler,
      dblclick: dblclickHandler,
    });

    nodesRef.current!.appendChild(g);
    nodesMapRef.current.set(node.id, g);

    // Pin root node
    if (node.data.depth === 0) {
      layout.pinNode(node, true);
    }
  }, [onNodeClick, onNodeDoubleClick, highlightNode]);

  const updateNodePositions = useCallback(() => {
    if (!layoutRef.current) return;

    nodesMapRef.current.forEach((g, nodeId) => {
      const pos = layoutRef.current.getNodePosition(nodeId);
      g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    });
  }, []);

  const renderLinks = useCallback(() => {
    if (!graph || !edgesRef.current || !layoutRef.current) return;

    graph.forEachLink((link: GraphLink) => {
      const fromPos = layoutRef.current.getNodePosition(link.fromId);
      const toPos = layoutRef.current.getNodePosition(link.toId);

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      path.setAttribute('d', `M${fromPos.x},${fromPos.y} L${toPos.x},${toPos.y}`);
      path.setAttribute('stroke', '#ccc');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('id', link.id);

      edgesRef.current!.appendChild(path);

      // Highlight root connections
      if (link.fromId === graph.rootId || link.toId === graph.rootId) {
        path.classList.add('hovered');
      }
    });

    // Highlight root node
    if (graph.rootId) {
      const rootNode = nodesMapRef.current.get(graph.rootId);
      if (rootNode) {
        rootNode.classList.add('hovered');
      }
    }
  }, [graph]);

  // Main graph rendering effect
  useEffect(() => {
    if (!graph || !nodesRef.current || !edgesRef.current) return;

    // Cleanup function to remove all event listeners
    const cleanup = () => {
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      // Remove all event listeners
      eventHandlersRef.current.forEach((handlers, element) => {
        element.removeEventListener('click', handlers.click);
        element.removeEventListener('dblclick', handlers.dblclick);
      });
      eventHandlersRef.current.clear();

      // Clear DOM
      nodesMapRef.current.clear();
      if (nodesRef.current) nodesRef.current.innerHTML = '';
      if (edgesRef.current) edgesRef.current.innerHTML = '';

      // Dispose layout
      if (layoutRef.current) {
        layoutRef.current = null;
      }
    };

    // Clear previous render
    cleanup();

    // Create physics layout
    const layout = createLayout(graph, {
      springLength: 20,
      springCoeff: 0.002,
      gravity: -1.2,
      theta: 0.8,
      dragCoeff: 0.02,
      timeStep: 14,
    });

    layoutRef.current = layout;

    // Render nodes
    graph.forEachNode((node: GraphNode) => {
      renderNode(node, layout);
    });

    // Start layout animation
    let iterations = 0;
    const maxIterations = 300;

    function step() {
      if (iterations < maxIterations) {
        for (let i = 0; i < 5; i++) {
          layout.step();
        }
        iterations++;
        updateNodePositions();
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        // Layout complete, render links
        renderLinks();
        if (onLayoutReady) onLayoutReady();
      }
    }

    step();

    return cleanup;
  }, [graph, renderNode, updateNodePositions, renderLinks, onLayoutReady]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'all' }}
    >
      <g ref={sceneRef} id="scene">
        <g ref={edgesRef} id="edges"></g>
        <g ref={nodesRef} id="nodes"></g>
      </g>
    </svg>
  );
}
