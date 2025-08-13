// Geocoding utilities using Nominatim (OpenStreetMap)
export interface SearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  place_rank: number;
  category: string;
  type: string;
  importance: number;
}

export interface ReverseGeocodeResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export const searchPlaces = async (
  query: string,
  signal?: AbortSignal
): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  try {
    // Add a random parameter to avoid caching issues
    const random = Math.floor(Math.random() * 1000000);
    
    // Add proper headers to respect Nominatim usage policy
    const response = await fetch(
      `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&_=${random}`,
      {
        headers: {
          'User-Agent': 'DeFix Civic Resolve Platform',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': window.location.origin
        },
        signal // Add abort signal for timeout handling
      }
    );
    
    if (!response.ok) {
      // Handle rate limiting or other errors
      if (response.status === 429) {
        throw new Error("Too many requests. Please try again later. (429)");
      }
      throw new Error(`Geocoding search failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    // Rethrow AbortError so we can handle it appropriately
    if (error.name === 'AbortError') {
      throw error;
    }
    
    // Log and pass through network errors so they can be handled with specific UI feedback
    if (!navigator.onLine || error.message?.includes('network')) {
      console.error("Network error during place search:", error);
      throw new Error("Network Error: Unable to connect to geocoding service");
    }
    
    console.error("Geocoding search error:", error);
    throw error; // Rethrow so the component can handle it
  }
};

export const reverseGeocode = async (
  lat: number, 
  lng: number, 
  signal?: AbortSignal
): Promise<ReverseGeocodeResult | null> => {
  try {
    // Add a random parameter to avoid caching issues
    const random = Math.floor(Math.random() * 1000000);
    
    const response = await fetch(
      `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&_=${random}`,
      {
        headers: {
          'User-Agent': 'DeFix Civic Resolve Platform',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': window.location.origin
        },
        signal // Add abort signal for timeout handling
      }
    );
    
    if (!response.ok) {
      // Handle rate limiting or other errors
      if (response.status === 429) {
        throw new Error("Too many requests. Please try again later. (429)");
      }
      throw new Error(`Reverse geocoding failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    // Rethrow AbortError so we can handle it appropriately
    if (error.name === 'AbortError') {
      throw error;
    }
    
    // Log and pass through network errors so they can be handled with specific UI feedback
    if (!navigator.onLine || error.message?.includes('network')) {
      console.error("Network error during reverse geocoding:", error);
      throw new Error("Network Error: Unable to connect to geocoding service");
    }
    
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

export const formatAddress = (result: ReverseGeocodeResult): string => {
  const { address } = result;
  const parts = [
    address.house_number,
    address.road,
    address.neighbourhood || address.suburb,
    address.city,
    address.state
  ].filter(Boolean);
  
  return parts.join(", ") || result.display_name;
};

export const getDaysAgo = (timestamp: number): number => {
  const now = Date.now();
  const diffInMs = now - timestamp;
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};