'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Typeahead from '@/components/Typeahead';
import About from '@/components/About';
import buildGraph, { Graph, GraphBuilder } from '@/lib/buildGraph';
import Progress from '@/lib/Progress';

// Dynamic import to avoid SSR issues with SVG manipulation
const GraphVisualization = dynamic(
  () => import('@/components/GraphVisualization'),
  { ssr: false }
);

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [graph, setGraph] = useState<Graph | null>(null);
  const progressRef = useRef(new Progress());
  const [aboutVisible, setAboutVisible] = useState(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const graphBuilderRef = useRef<GraphBuilder | null>(null);

  // Subscribe to progress updates (only once)
  useEffect(() => {
    const progress = progressRef.current;
    const unsubscribe = progress.onChange(() => {
      setProgressMessage(progress.message);
      setIsLoading(progress.working);
    });

    return unsubscribe;
  }, []); // Empty array - only setup once

  // Stable perform search function
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery) return;

    // Dispose previous builder to cancel pending requests
    if (graphBuilderRef.current) {
      graphBuilderRef.current.dispose();
      graphBuilderRef.current = null;
    }

    // Update URL
    router.push(`?query=${encodeURIComponent(searchQuery)}`, { scroll: false });

    const MAX_DEPTH = 2;
    const progress = progressRef.current;
    progress.reset();

    const builder = buildGraph(searchQuery, MAX_DEPTH, progress, () => {
      console.log('Graph ready!');
    });

    graphBuilderRef.current = builder;
    setGraph(builder.graph);
  }, [router]);

  // Handle initial query from URL
  useEffect(() => {
    const queryParam = searchParams.get('query');
    if (queryParam) {
      setQuery(queryParam);
      performSearch(queryParam);
    }
  }, [searchParams, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (graphBuilderRef.current) {
        graphBuilderRef.current.dispose();
      }
    };
  }, []);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
  }, [performSearch]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedSubreddit(nodeId);
  }, []);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setQuery(nodeId);
    performSearch(nodeId);
  }, [performSearch]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Graph Visualization */}
      <GraphVisualization
        graph={graph}
        progress={progressRef.current}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
      />

      {/* Search Box */}
      <div className="absolute top-0 left-0 m-4 md:m-8 w-[392px] max-w-[calc(100%-2rem)] md:max-w-[392px] z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query) handleSearch(query);
          }}
          className="shadow-lg"
        >
          <Typeahead
            placeholder="Enter subreddit name"
            onSelected={handleSearch}
            query={query}
          />
        </form>

        {/* Help Text */}
        {!isLoading && (
          <div className="text-xs mt-2 px-2 bg-white/90 backdrop-blur-sm py-2 rounded">
            The graph of related subreddits
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setAboutVisible(true);
              }}
              className="ml-1 text-highlight hover:underline"
            >
              Learn more.
            </a>
          </div>
        )}

        {/* Loading Text */}
        {isLoading && (
          <div className="text-xs mt-2 px-2 bg-white/90 backdrop-blur-sm py-2 rounded">
            {progressMessage}
          </div>
        )}
      </div>

      {/* About Link */}
      <div className="fixed right-0 top-2 z-10 flex flex-col">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setAboutVisible(true);
          }}
          className="bg-white/90 backdrop-blur-sm text-xs px-2 py-1.5 text-secondary hover:text-highlight hover:border-b border-highlight transition-colors"
        >
          about
        </a>
        <a
          href="https://github.com/mehdigreefhorst/sayit"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/90 backdrop-blur-sm text-xs px-2 py-1.5 text-secondary hover:text-highlight hover:border-b border-highlight transition-colors font-bold"
        >
          source code
        </a>
      </div>

      {/* Welcome Screen */}
      {!graph && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-lg p-8 max-w-md mx-4 pointer-events-auto">
            <h3 className="text-2xl font-bold mb-4 text-primary">Welcome!</h3>
            <p className="text-gray-700 mb-4">
              This website renders a graph of related subreddits.
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutVisible(true);
                }}
                className="ml-1 text-highlight hover:underline"
              >
                Click here
              </a>{' '}
              to learn more, or
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSearch('math');
                }}
                className="ml-1 text-highlight hover:underline"
              >
                try demo
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* About Modal */}
      {aboutVisible && <About onClose={() => setAboutVisible(false)} />}

      {/* Subreddit Info Panel */}
      {selectedSubreddit && (
        <div className="fixed right-0 top-0 w-full md:w-[400px] h-full bg-white shadow-2xl z-20 overflow-y-auto animate-slide-in">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">r/{selectedSubreddit}</h3>
            <button
              onClick={() => setSelectedSubreddit(null)}
              className="text-white hover:text-gray-300 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-gray-700 mb-2">
                Click below to visit this subreddit on Reddit
              </p>
            </div>

            <a
              href={`https://www.reddit.com/r/${selectedSubreddit}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
            >
              Open r/{selectedSubreddit} in New Tab →
            </a>

            <button
              onClick={() => {
                setQuery(selectedSubreddit);
                performSearch(selectedSubreddit);
                setSelectedSubreddit(null);
              }}
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
            >
              Re-center Graph on This Subreddit
            </button>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Quick Links</h4>
              <div className="space-y-2">
                <a
                  href={`https://www.reddit.com/r/${selectedSubreddit}/top/?t=week`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  Top Posts This Week
                </a>
                <a
                  href={`https://www.reddit.com/r/${selectedSubreddit}/new/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  New Posts
                </a>
                <a
                  href={`https://www.reddit.com/r/${selectedSubreddit}/about/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  Subreddit Info
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
