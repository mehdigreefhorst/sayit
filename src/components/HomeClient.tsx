'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Typeahead from '@/components/Typeahead';
import About from '@/components/About';
import buildGraph, { Graph } from '@/lib/buildGraph';
import Progress from '@/lib/Progress';

// Dynamic import to avoid SSR issues with SVG manipulation
const GraphVisualization = dynamic(
  () => import('@/components/GraphVisualization'),
  { ssr: false }
);

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [graph, setGraph] = useState<Graph | null>(null);
  const [progress, setProgress] = useState(new Progress());
  const [aboutVisible, setAboutVisible] = useState(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string | null>(
    null
  );
  const [progressMessage, setProgressMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to progress updates
    const unsubscribe = progress.onChange(() => {
      setProgressMessage(progress.message);
      setIsLoading(progress.working);
    });

    return unsubscribe;
  }, [progress]);

  useEffect(() => {
    const queryParam = searchParams.get('query');
    if (queryParam && queryParam !== query) {
      setQuery(queryParam);
      performSearch(queryParam);
    } else if (queryParam) {
      performSearch(queryParam);
    }
  }, []);

  const performSearch = (searchQuery: string) => {
    if (!searchQuery) return;

    // Update URL
    router.push(`?query=${encodeURIComponent(searchQuery)}`, { scroll: false });

    const MAX_DEPTH = 2;
    const newProgress = new Progress();
    setProgress(newProgress);

    const builder = buildGraph(searchQuery, MAX_DEPTH, newProgress, () => {
      console.log('Graph ready!');
    });

    setGraph(builder.graph);
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedSubreddit(nodeId);
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    handleSearch(nodeId);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Graph Visualization */}
      <GraphVisualization
        graph={graph}
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
          href="https://github.com/anvaka/sayit"
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

      {/* Subreddit Preview Panel */}
      {selectedSubreddit && (
        <div className="fixed right-0 top-0 w-full md:w-[400px] h-full bg-white shadow-2xl z-20 overflow-y-auto animate-slide-in">
          <div className="sticky top-0 bg-gray-800 text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">r/{selectedSubreddit}</h3>
            <button
              onClick={() => setSelectedSubreddit(null)}
              className="text-white hover:text-gray-300 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            <iframe
              src={`https://www.reddit.com/r/${selectedSubreddit}/`}
              className="w-full h-[calc(100vh-80px)] border-0"
              title={`r/${selectedSubreddit}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
