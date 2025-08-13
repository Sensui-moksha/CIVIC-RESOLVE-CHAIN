import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Search, Loader2, AlertCircle, X, WifiOff } from "lucide-react";
import { searchPlaces, SearchResult } from "@/utils/geocoding";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

type LocationSearchProps = {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  className?: string;
  disabled?: boolean;
  onError?: (error: Error) => void;
};

const LocationSearch: React.FC<LocationSearchProps> = ({ 
  onLocationSelect, 
  className, 
  disabled = false,
  onError
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle clicks outside the results dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node) && 
          searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle keyboard navigation in results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults || results.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowResults(false);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResults, results, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[0]?.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3 || disabled) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    setError(null);
    setLoading(true);
    setSelectedIndex(-1);
    
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      // Check if we're online before attempting search
      if (!navigator.onLine) {
        throw new Error("You're offline. Please check your internet connection and try again.");
      }
      
      // Start a timeout for the request
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 8000);
      
      const searchResults = await searchPlaces(searchQuery, abortControllerRef.current.signal);
      clearTimeout(timeoutId);
      
      setResults(searchResults);
      setShowResults(true);
      
      if (searchResults.length === 0) {
        setError("No locations found. Try a different search term.");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      
      // Format error message based on error type
      let errorMessage = "Failed to search locations. Please try again.";
      
      if (err.name === 'AbortError') {
        errorMessage = "Search request timed out. Please try again.";
      } else if (err.message?.includes('offline') || !navigator.onLine) {
        errorMessage = "You're offline. Please check your internet connection.";
      } else if (err.message?.includes('429')) {
        errorMessage = "Too many search requests. Please try again in a moment.";
      }
      
      setError(errorMessage);
      
      // Notify parent component about the error
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [disabled, onError]);

  // Handle query changes with debounce
  useEffect(() => {
    if (disabled) return;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch, disabled]);

  const handleResultClick = (result: SearchResult) => {
    if (disabled) return;
    
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (isNaN(lat) || isNaN(lng)) {
      const errorMessage = "The selected location has invalid coordinates.";
      toast({
        title: "Invalid Location Data",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      return;
    }
    
    onLocationSelect(lat, lng, result.display_name);
    setQuery(result.display_name);
    setShowResults(false);
    setError(null);
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (query.length < 3) {
      const errorMessage = "Please enter at least 3 characters to search";
      toast({
        title: "Search Query Too Short",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      return;
    }
    
    if (results.length > 0) {
      // Use the first result if there are any
      handleResultClick(results[0]);
    } else if (!loading) {
      // If not already loading, trigger a new search
      performSearch(query);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setError(null);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  };

  // Show offline state when not connected
  const isOffline = !navigator.onLine;

  return (
    <div className={`relative ${className} ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <form onSubmit={handleSubmitSearch} className="relative flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={isOffline ? "Search unavailable while offline" : "Search for a location..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`pl-10 pr-10 glass-card ${disabled || isOffline ? 'cursor-not-allowed' : ''}`}
            onFocus={() => query.length >= 3 && !disabled && !isOffline && setShowResults(true)}
            disabled={disabled || isOffline}
            aria-label="Location search"
          />
          {query && !isOffline && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {isOffline && (
            <WifiOff className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Button 
          type="submit" 
          size="sm" 
          className="ml-2 bg-brand text-white hover:bg-brand-strong"
          disabled={loading || query.length < 3 || disabled || isOffline}
        >
          Search
        </Button>
      </form>
      
      {error && !loading && !showResults && (
        <Alert variant="destructive" className="mt-2 py-2 px-3">
          <AlertDescription className="text-xs flex items-center gap-2">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {error}
          </AlertDescription>
        </Alert>
      )}

      {showResults && results.length > 0 && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto glass-card border animate-fade-in shadow-lg"
          role="listbox"
          aria-label="Search results"
        >
          <div className="py-1">
            {results.map((result, index) => (
              <Button
                key={result.place_id}
                variant="ghost"
                className={`w-full justify-start p-3 h-auto transition-colors rounded-none ${
                  index === selectedIndex ? 'bg-muted/80' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleResultClick(result)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <MapPin className="h-4 w-4 mr-3 text-brand flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm line-clamp-1">{result.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.type} • {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}
      
      {query.length === 0 && !error && !loading && !isOffline && (
        <div className="text-xs text-muted-foreground mt-1 pl-1">
          <span className="flex items-center gap-1 mb-0.5">
            <Search className="h-3 w-3" />
            <span>Search tips:</span>
          </span>
          <ul className="list-disc list-inside pl-3 space-y-0.5">
            <li>Enter a street address, city, or landmark</li>
            <li>Include a city name for better results</li>
            <li>Try "Main St, San Francisco" or "Central Park, NYC"</li>
          </ul>
        </div>
      )}
      
      {isOffline && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 pl-1 flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          <span>Location search is unavailable while offline</span>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;