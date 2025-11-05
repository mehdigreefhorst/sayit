'use client';

import { useState, useEffect, useRef } from 'react';
import redditDataClient from '@/lib/redditDataClient';

interface TypeaheadProps {
  placeholder?: string;
  onSelected: (value: string) => void;
  query: string;
}

export default function Typeahead({
  placeholder = 'Enter subreddit name',
  onSelected,
  query: externalQuery,
}: TypeaheadProps) {
  const [query, setQuery] = useState(externalQuery || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  // Sync with external query changes
  useEffect(() => {
    if (externalQuery !== query) {
      setQuery(externalQuery);
    }
  }, [externalQuery]); // Only sync when external query changes

  // Setup and cleanup mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch suggestions with cleanup
  useEffect(() => {
    let cancelled = false;

    if (query.length > 0) {
      redditDataClient.getSuggestion(query).then((results) => {
        // Only update state if component is still mounted and request not cancelled
        if (!cancelled && isMountedRef.current) {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        }
      }).catch((err) => {
        console.error('Failed to fetch suggestions:', err);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        selectSuggestion(suggestions[selectedIndex].text);
      } else if (query) {
        onSelected(query);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (value: string) => {
    setQuery(value);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSelected(value);
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        className="w-full h-12 px-4 text-base border-none outline-none bg-white focus:outline-none focus:ring-2 focus:ring-highlight transition-all"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        autoFocus
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-border shadow-lg max-h-64 overflow-y-auto animate-fade-in">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.text}-${index}`}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-highlight text-white'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => selectSuggestion(suggestion.text)}
              dangerouslySetInnerHTML={{ __html: suggestion.html }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
