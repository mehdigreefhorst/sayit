'use client';

interface AboutProps {
  onClose: () => void;
}

export default function About({ onClose }: AboutProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-primary">
              About Related Subreddits
            </h2>
            <button
              onClick={onClose}
              className="text-secondary hover:text-highlight transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            <p>
              This visualization shows a graph of related subreddits based on
              user commenting patterns.
            </p>

            <h3 className="text-lg font-semibold text-primary mt-6 mb-2">
              How it works
            </h3>
            <p>
              Recommendations are constructed based on{' '}
              <em>
                &quot;Redditors who commented to this subreddit, also commented
                to...&quot;
              </em>
            </p>

            <h3 className="text-lg font-semibold text-primary mt-6 mb-2">
              The Data
            </h3>
            <p>
              This visualization uses data from two months worth of comments
              (August and September of 2018) - which contains ~38 million{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">
                user &lt;-&gt; subreddit
              </code>{' '}
              records.
            </p>
            <p>
              The relationships are computed using Jaccard Similarity between
              subreddits. For very popular subreddits, manual overrides are used
              based on subreddit descriptions and frequently mentioned subreddits
              in comments.
            </p>

            <h3 className="text-lg font-semibold text-primary mt-6 mb-2">
              How to use
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Enter a subreddit name to explore its related subreddits</li>
              <li>Click on any node to see that subreddit&apos;s details</li>
              <li>Double-click on a node to re-center the graph on that subreddit</li>
              <li>Pan and zoom to navigate the graph</li>
            </ul>

            <h3 className="text-lg font-semibold text-primary mt-6 mb-2">
              Credits
            </h3>
            <p>
              Data source: Jason Baumgartner (u/Stuck_In_the_Matrix)
              <br />
              BigQuery processing: Felipe Hoffa
              <br />
              Original visualization: Andrei Kashcha
            </p>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <a
                href="https://github.com/anvaka/sayit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-highlight hover:underline"
              >
                View source code on GitHub →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
