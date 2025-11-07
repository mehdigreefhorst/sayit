'use client';

import { useEffect, useRef, useCallback } from 'react';
import createPanZoom from 'panzoom';
import createAggregateLayout from '@/lib/aggregateLayout';
import type { Graph, GraphNode, GraphLink } from '@/lib/buildGraph';
import Progress from '@/lib/Progress';

interface GraphVisualizationProps {
  graph: Graph | null;
  progress: Progress;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
}

export default function GraphVisualization({
  graph,
  progress,
  onNodeClick,
  onNodeDoubleClick,
}: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const sceneRef = useRef<SVGGElement>(null);
  const nodesRef = useRef<SVGGElement>(null);
  const edgesRef = useRef<SVGGElement>(null);
  const panzoomRef = useRef<any>(null);
  const layoutRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();
  const nodesMapRef = useRef<Map<string, SVGGElement>>(new Map());
  const nodeAttributesRef = useRef<Map<string, any>>(new Map());
  const eventHandlersRef = useRef<Map<SVGGElement, { click: (e: Event) => void; dblclick: (e: Event) => void }>>(new Map());
  const graphReadyRef = useRef(false);

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

  const measureText = useCallback((text: string, fontSize: number) => {
    const charWidth = fontSize * 0.6;
    const totalWidth = text.length * charWidth;
    const spaceWidth = fontSize * 0.3;
    return { totalWidth, spaceWidth };
  }, []);

  const getNodeUIAttributes = useCallback((nodeId: string, dRatio: number) => {
    const fontSize = 24 * dRatio + 12;
    const size = measureText(nodeId, fontSize);
    const width = size.totalWidth + size.spaceWidth * 6;
    const height = fontSize * 1.6;

    return {
      fontSize,
      width,
      height,
      x: -width / 2,
      y: -height / 2,
      rx: 15 * dRatio + 2,
      ry: 15 * dRatio + 2,
      px: -width / 2 + size.spaceWidth * 3,
      py: -height / 2 + fontSize * 1.1,
      strokeWidth: 4 * dRatio + 1
    };
  }, [measureText]);

  const highlightNode = useCallback((nodeId: string) => {
    if (!graph || !sceneRef.current) return;

    const sceneElement = sceneRef.current;
    sceneElement.querySelectorAll('.hovered').forEach((el) => {
      el.classList.remove('hovered');
    });

    const node = nodesMapRef.current.get(nodeId);
    if (node) {
      node.classList.add('hovered');
    }

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

  const addNode = useCallback((node: GraphNode) => {
    if (!nodesRef.current || !layoutRef.current) return;

    const dRatio = node.data.size * 1.2;
    const fontSize = 24 * dRatio + 12;
    const textContent = node.id;

    const pos = layoutRef.current.getNodePosition(node.id);
    if (node.data.depth === 0) {
      layoutRef.current.pinNode(node);
      console.log(`[Render] Pinned root node: ${node.id}`);
    }

    const uiAttributes = getNodeUIAttributes(node.id, dRatio);
    layoutRef.current.addNode(node.id, uiAttributes);
    nodeAttributesRef.current.set(node.id, uiAttributes);

    // Create group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node');
    g.setAttribute('id', `node-${node.id}`);
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

    // Create rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(uiAttributes.x));
    rect.setAttribute('y', String(uiAttributes.y));
    rect.setAttribute('width', String(uiAttributes.width));
    rect.setAttribute('height', String(uiAttributes.height));
    rect.setAttribute('rx', String(uiAttributes.rx));
    rect.setAttribute('ry', String(uiAttributes.ry));
    rect.setAttribute('fill', 'white');
    rect.setAttribute('stroke', '#aaa');
    rect.setAttribute('stroke-width', String(uiAttributes.strokeWidth));

    // Create text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(uiAttributes.px - uiAttributes.x));
    text.setAttribute('y', String(uiAttributes.py - uiAttributes.y));
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('fill', '#2c3e50');
    text.textContent = textContent;

    g.appendChild(rect);
    g.appendChild(text);

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

    eventHandlersRef.current.set(g, {
      click: clickHandler,
      dblclick: dblclickHandler,
    });

    nodesRef.current.appendChild(g);
    nodesMapRef.current.set(node.id, g);
  }, [onNodeClick, onNodeDoubleClick, highlightNode, getNodeUIAttributes]);

  const updateNodePositions = useCallback(() => {
    if (!layoutRef.current) return;

    nodesMapRef.current.forEach((g, nodeId) => {
      const pos = layoutRef.current.getNodePosition(nodeId);
      g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    });
  }, []);

  const drawLinks = useCallback(() => {
    if (!graph || !edgesRef.current || !layoutRef.current) return;

    console.log('[Render] Drawing links - layout animation complete!');
    progress.done();

    let linkCount = 0;
    graph.forEachLink((link: GraphLink) => {
      linkCount++;
      const fromPos = layoutRef.current.getNodePosition(link.fromId);
      const toPos = layoutRef.current.getNodePosition(link.toId);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${fromPos.x},${fromPos.y} L${toPos.x},${toPos.y}`);
      path.setAttribute('stroke', '#ccc');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('id', link.id);

      edgesRef.current!.appendChild(path);

      if (link.fromId === graph.rootId || link.toId === graph.rootId) {
        path.classList.add('hovered');
      }
    });

    if (graph.rootId) {
      const rootNode = nodesMapRef.current.get(graph.rootId);
      if (rootNode) {
        rootNode.classList.add('hovered');
      }
    }

    console.log(`[Render] Finished drawing ${linkCount} links`);
  }, [graph, progress]);

  const onGraphReady = useCallback(() => {
    if (graphReadyRef.current || !layoutRef.current) return;
    graphReadyRef.current = true;
    layoutRef.current.setGraphReady();
    progress.startLayout();
  }, [progress]);

  // Listen for graph ready event from buildGraph
  useEffect(() => {
    if (!graph) return;

    // The graph emits a 'graphReady' event when all data is loaded
    const handleGraphReady = () => {
      onGraphReady();
    };

    // Use a simple polling approach since we can't easily hook into the graph events
    const checkInterval = setInterval(() => {
      if (graph && !graphReadyRef.current) {
        // Assume graph is ready after a short delay
        onGraphReady();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
    };
  }, [graph, onGraphReady]);

  // Main graph rendering effect
  useEffect(() => {
    if (!graph || !nodesRef.current || !edgesRef.current) return;

    const cleanup = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      eventHandlersRef.current.forEach((handlers, element) => {
        element.removeEventListener('click', handlers.click);
        element.removeEventListener('dblclick', handlers.dblclick);
      });
      eventHandlersRef.current.clear();

      nodesMapRef.current.clear();
      nodeAttributesRef.current.clear();
      if (nodesRef.current) nodesRef.current.innerHTML = '';
      if (edgesRef.current) edgesRef.current.innerHTML = '';

      if (layoutRef.current) {
        layoutRef.current = null;
      }

      graphReadyRef.current = false;
    };

    cleanup();

    // Create the aggregate layout system (multi-phase)
    console.log('[Render] Creating aggregate layout system');
    const layout = createAggregateLayout(graph, progress);
    layoutRef.current = layout;

    // Listen for layout ready event
    layout.on('ready', drawLinks);

    // Add all nodes
    let nodeCount = 0;
    graph.forEachNode((node: GraphNode) => {
      addNode(node);
      nodeCount++;
    });
    console.log(`[Render] Added ${nodeCount} nodes to visualization`);

    // Listen for new nodes being added dynamically
    const onGraphChanged = (changes: any[]) => {
      let dynamicNodesAdded = 0;
      changes.forEach((change: any) => {
        if (change.changeType === 'add' && change.node) {
          addNode(change.node);
          dynamicNodesAdded++;
        }
      });
      if (dynamicNodesAdded > 0) {
        console.log(`[Render] Dynamically added ${dynamicNodesAdded} nodes`);
      }
    };
    graph.on('changed', onGraphChanged);

    // Start animation loop
    function frame() {
      if (layoutRef.current && layoutRef.current.step()) {
        updateNodePositions();
        animationFrameRef.current = requestAnimationFrame(frame);
      }
    }

    animationFrameRef.current = requestAnimationFrame(frame);

    return () => {
      layout.off('ready', drawLinks);
      if (graph) {
        graph.off('changed', onGraphChanged);
      }
      cleanup();
    };
  }, [graph, progress, addNode, updateNodePositions, drawLinks]);

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
