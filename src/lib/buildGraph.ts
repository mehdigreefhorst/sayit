import createGraph from 'ngraph.graph';
import redditDataClient from './redditDataClient';

export interface GraphNode {
  id: string;
  data: {
    depth: number;
    size: number;
  };
}

export interface GraphLink {
  id: string;
  fromId: string;
  toId: string;
}

export interface Graph {
  addNode: (id: string, data?: any) => GraphNode;
  addLink: (fromId: string, toId: string, data?: any) => GraphLink;
  getNode: (id: string) => GraphNode | undefined;
  hasNode: (id: string) => boolean;
  getLink: (fromId: string, toId: string) => GraphLink | undefined;
  getLinks: (nodeId: string) => GraphLink[] | undefined;
  forEachNode: (callback: (node: GraphNode) => void) => void;
  forEachLink: (callback: (link: GraphLink) => void) => void;
  forEachLinkedNode: (
    nodeId: string,
    callback: (node: GraphNode, link: GraphLink) => void
  ) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  maxDepth?: number;
  rootId?: string;
}

export interface Progress {
  startDownload: () => void;
  updateLayout: (queueLength: number, currentWord: string) => void;
  downloadError: (error: string) => void;
  startLayout: () => void;
  message: string;
  working: boolean;
  reset: () => void;
}

export interface GraphBuilder {
  dispose: () => void;
  graph: Graph;
  onGraphReady?: () => void;
}

export default function buildGraph(
  entryWord: string,
  MAX_DEPTH: number,
  progress: Progress,
  onGraphReady?: () => void
): GraphBuilder {
  entryWord = entryWord && entryWord.trim();
  if (!entryWord) {
    throw new Error('Entry word is required');
  }

  entryWord = entryWord.toLowerCase();

  let cancelled = false;
  let pendingResponse: Promise<string[]> | null = null;
  const pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();
  const graph = createGraph() as any as Graph;
  graph.maxDepth = MAX_DEPTH;
  graph.rootId = entryWord;

  const queue: string[] = [];
  const requestDelay = 0;

  progress.startDownload();
  startQueryConstruction();

  return {
    dispose,
    graph,
    onGraphReady,
  };

  function dispose() {
    cancelled = true;
    pendingResponse = null;

    // Cancel all pending timeouts
    pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingTimeouts.clear();
  }

  function startQueryConstruction() {
    fetchNext(entryWord);
  }

  function loadSiblings(results: string[]) {
    if (cancelled) return; // Check if cancelled

    const parent = results[0];
    let parentNode = graph.getNode(parent);

    console.log(`[Graph Wave] Processing subreddit: ${parent} with ${results.length - 1} related subreddits`);

    if (!parentNode) {
      parentNode = graph.addNode(parent, {
        depth: 0,
        size: redditDataClient.getSize(parent),
      });
      console.log(`[Graph] Added root node: ${parent}`);
    }

    let newNodesAdded = 0;
    let newLinksAdded = 0;

    results.forEach((other, idx) => {
      if (idx === 0) return;

      // Calculate edge weight based on position (earlier = stronger connection)
      // Weight ranges from 1.0 (first item) to ~0.1 (last item)
      const weight = 1.0 / idx;

      const hasOtherNode = graph.hasNode(other);
      if (hasOtherNode) {
        const hasOtherLink =
          graph.getLink(other, parent) || graph.getLink(parent, other);
        if (!hasOtherLink) {
          graph.addLink(parent, other, { weight });
          newLinksAdded++;
        }
        return;
      }

      const depth = parentNode!.data.depth + 1;
      graph.addNode(other, { depth, size: redditDataClient.getSize(other) });
      graph.addLink(parent, other, { weight });
      newNodesAdded++;
      newLinksAdded++;
      if (depth < MAX_DEPTH) queue.push(other);
    });

    console.log(`[Graph Wave] Added ${newNodesAdded} new nodes, ${newLinksAdded} new links. Queue size: ${queue.length}`);

    // Schedule next load and track timeout
    const timeoutId = setTimeout(() => {
      pendingTimeouts.delete(timeoutId);
      loadNext();
    }, requestDelay);
    pendingTimeouts.add(timeoutId);
  }

  function loadNext() {
    if (cancelled) return;

    if (queue.length === 0) {
      progress.startLayout();
      if (onGraphReady) {
        setTimeout(() => onGraphReady(), 10);
      }
      return;
    }

    const nextWord = queue.shift()!;
    fetchNext(nextWord);
    progress.updateLayout(queue.length, nextWord);
  }

  function fetchNext(query: string) {
    if (cancelled) return; // Check before making request

    pendingResponse = redditDataClient.getRelated(query);
    pendingResponse
      .then((res) => {
        if (!cancelled) { // Only process if not cancelled
          onPendingReady(res, query);
        }
      })
      .catch((msg) => {
        if (!cancelled) { // Only log error if not cancelled
          const err = 'Failed to download ' + query + '; Message: ' + msg;
          console.error(err);
          progress.downloadError(err);
          loadNext();
        }
      });
  }

  function onPendingReady(res: string[], query: string) {
    if (cancelled) return; // Check if cancelled before processing

    if (!res || !res.length) res = [query];
    loadSiblings(res);
  }
}
