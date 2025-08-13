import React, { useEffect, useState, useRef, Component, ReactNode } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Satellite, Eye, EyeOff, AlertCircle, Info, X, HelpCircle, Loader2, WifiOff } from "lucide-react";
import LocationSearch from "./LocationSearch";
import { reverseGeocode, formatAddress } from "@/utils/geocoding";
import { useToast } from "@/hooks/use-toast";

// Error boundary for catching map load errors
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Map error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Create a custom marker icon that looks better
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Location Helper Widget Component
interface LocationHelperWidgetProps {
  type: 'permission' | 'error' | 'info' | 'warning' | 'success';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  secondaryAction?: () => void;
  secondaryActionLabel?: string;
}

const LocationHelperWidget: React.FC<LocationHelperWidgetProps> = ({
  type,
  message,
  isVisible,
  onClose,
  onAction,
  actionLabel = 'Allow Location',
  secondaryAction,
  secondaryActionLabel
}) => {
  if (!isVisible) return null;
  
  const iconMap = {
    'permission': <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />,
    'error': <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />,
    'info': <HelpCircle className="h-5 w-5 text-brand flex-shrink-0" />,
    'warning': <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
    'success': <MapPin className="h-5 w-5 text-green-500 flex-shrink-0" />
  };
  
  const bgColorMap = {
    'permission': 'bg-blue-50 dark:bg-blue-950/30',
    'error': 'bg-destructive/10',
    'info': 'bg-brand/5',
    'warning': 'bg-amber-50 dark:bg-amber-950/30',
    'success': 'bg-green-50 dark:bg-green-950/30'
  };
  
  const borderColorMap = {
    'permission': 'border-blue-200 dark:border-blue-800',
    'error': 'border-destructive/20',
    'info': 'border-brand/20',
    'warning': 'border-amber-200 dark:border-amber-800',
    'success': 'border-green-200 dark:border-green-800'
  };

  // Auto-close success and info messages after a delay
  useEffect(() => {
    if (isVisible && (type === 'success' || type === 'info')) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, type, onClose]);

  return (
    <div 
      className={`animate-fade-in rounded-lg border ${borderColorMap[type]} ${bgColorMap[type]} p-4 my-3 relative`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Close"
      >
        <X size={16} />
      </button>
      
      <div className="flex gap-3">
        <div className="mt-0.5">
          {iconMap[type]}
        </div>
        <div className="flex-1">
          <div className="text-sm">
            {message}
          </div>
          
          {type === 'error' && (
            <div className="mt-2 text-xs text-muted-foreground space-y-1 pl-4">
              <div className="font-medium">Troubleshooting:</div>
              <ul className="list-disc list-outside space-y-1 pl-4">
                <li>Check if location services are enabled on your device</li>
                <li>Allow location access in your browser settings</li>
                <li>Try a different browser if the issue persists</li>
                <li>Make sure you're connected to the internet</li>
              </ul>
            </div>
          )}
          
          {(onAction || secondaryAction) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {onAction && (
                <Button 
                  variant={type === 'error' ? "destructive" : "outline"} 
                  size="sm" 
                  onClick={onAction} 
                >
                  {actionLabel}
                </Button>
              )}
              
              {secondaryAction && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={secondaryAction}
                >
                  {secondaryActionLabel || 'Alternative Action'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type LatLng = { lat: number; lng: number };

type MapPickerProps = {
  value?: LatLng;
  onChange?: (pos: LatLng, address?: string) => void;
  className?: string;
  disabled?: boolean;
};

const Clicker: React.FC<{ onPick: (p: LatLng) => void; disabled?: boolean }> = ({ onPick, disabled }) => {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

const RecenterOnPos: React.FC<{ pos: LatLng }> = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([pos.lat, pos.lng]);
  }, [pos.lat, pos.lng, map]);
  return null;
};

const StreetView: React.FC<{ lat: number; lng: number; show: boolean; isOffline?: boolean }> = ({ lat, lng, show, isOffline = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Reset loading and error when coordinates change
  useEffect(() => {
    if (show) {
      setLoading(true);
      setError(false);
    }
  }, [lat, lng, show]);
  
  if (!show) return null;
  
  // Don't attempt to load if offline
  if (isOffline) {
    return (
      <Card className="overflow-hidden glass-card border-0 shadow-lg animate-slide-in-right">
        <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center">
          <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Street View Unavailable</h3>
          <p className="text-center text-muted-foreground max-w-md">
            Street View can't be displayed while you're offline.
          </p>
        </div>
        <div className="px-4 py-3 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Satellite className="h-4 w-4 text-brand" />
            Street View Preview
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Reconnect to view street-level imagery
          </div>
        </div>
      </Card>
    );
  }
  
  const url = `https://www.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed`;
  
  return (
    <Card className="overflow-hidden glass-card border-0 shadow-lg animate-slide-in-right">
      <div className="relative w-full h-48 sm:h-56 md:h-64">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Loader2 className="h-8 w-8 text-brand animate-spin mb-2" />
            <div className="text-sm text-muted-foreground">Loading Street View...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <div className="text-sm font-medium mb-1">Street View not available</div>
            <div className="text-xs text-muted-foreground text-center max-w-xs mb-3">
              Street View imagery may not be available for this location
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setLoading(true);
                setError(false);
                if (iframeRef.current) {
                  iframeRef.current.src = url;
                }
              }}
            >
              Try Again
            </Button>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          title="Street View"
          src={url}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      </div>
      <div className="px-4 py-3 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Satellite className="h-4 w-4 text-brand" />
          Street View Preview
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Google Maps street-level imagery
        </div>
      </div>
    </Card>
  );
};

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, className, disabled = false }) => {
  const [pos, setPos] = useState<LatLng>(value ?? { lat: 37.7749, lng: -122.4194 });
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [showStreet, setShowStreet] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Helper widget states
  const [helperWidget, setHelperWidget] = useState<{
    type: 'permission' | 'error' | 'info' | 'warning' | 'success';
    message: string;
    isVisible: boolean;
    actionHandler?: () => void;
  }>({
    type: 'info',
    message: '',
    isVisible: false,
    actionHandler: undefined
  });
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Notify user they're back online
      toast({
        title: "You're back online",
        description: "Map and location services are now fully available.",
        variant: "success",
        duration: 3000
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      // Notify user they're offline
      toast({
        title: "You're offline",
        description: "Some map and location features may be limited.",
        variant: "destructive",
        duration: 5000
      });
      
      // Show offline helper widget
      setHelperWidget({
        type: 'warning',
        message: "You're currently offline. Map tiles may not load properly and location searches will be unavailable until your connection is restored.",
        isVisible: true
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const { toast } = useToast();
  const locationAccessedRef = useRef<boolean>(false);
  
  // Cache for geocoding results
  const geocodeCache = useRef<Record<string, { address: string, timestamp: number }>>({});

  useEffect(() => {
    if (value) {
      setPos(value);
      updateAddress(value.lat, value.lng);
    }
  }, [value]);

  const updateAddress = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    
    // Check cache first (round to 5 decimal places for better cache hits)
    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const cachedResult = geocodeCache.current[cacheKey];
    
    // Use cache if available and less than 24 hours old
    if (cachedResult && (Date.now() - cachedResult.timestamp < 24 * 60 * 60 * 1000)) {
      setAddress(cachedResult.address);
      setLoadingAddress(false);
      return;
    }
    
    // Use AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      // Initial retry delay (ms)
      const initialRetryDelay = 1000;
      const maxRetries = 2;
      
      // Retry function with exponential backoff
      const fetchWithRetry = async (retryCount = 0): Promise<any> => {
        try {
          const result = await reverseGeocode(lat, lng, controller.signal);
          return result;
        } catch (error: any) {
          // Don't retry if we've reached max retries or if it's a user abort
          if (retryCount >= maxRetries || error.name === 'AbortError') {
            throw error;
          }
          
          // If it's a 429 rate limit error, wait longer
          const isRateLimit = error.message?.includes('429');
          const delay = isRateLimit 
            ? initialRetryDelay * Math.pow(2, retryCount + 1) // More aggressive backoff for rate limits
            : initialRetryDelay * Math.pow(1.5, retryCount);
            
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry with incremented counter
          return fetchWithRetry(retryCount + 1);
        }
      };
      
      const result = await fetchWithRetry();
      
      if (result) {
        const formatted = formatAddress(result);
        setAddress(formatted);
        
        // Store in cache
        geocodeCache.current[cacheKey] = {
          address: formatted,
          timestamp: Date.now()
        };
      } else {
        setAddress("Location information unavailable");
        
        // Show a helper message for unavailable information
        setHelperWidget({
          type: 'info',
          message: 'The address details for this location couldn\'t be retrieved. You can still use the coordinates.',
          isVisible: true
        });
      }
    } catch (error: any) {
      console.error("Error getting address:", error);
      
      // Handle specific error types
      let errorMessage = "Could not retrieve the address for this location.";
      let errorTitle = "Address Lookup Failed";
      
      if (error.name === 'AbortError') {
        errorMessage = "Address lookup timed out. This might be due to slow internet connection.";
        errorTitle = "Request Timeout";
      } else if (error.message?.includes('429')) {
        errorMessage = "Too many requests to the geocoding service. Please try again in a moment.";
        errorTitle = "Rate Limit Reached";
      } else if (error.message?.includes('Network Error') || !navigator.onLine) {
        errorMessage = "Please check your internet connection and try again.";
        errorTitle = "Network Error";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
      
      // Use coordinates as fallback
      setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      
      // Show helper widget with more details
      setHelperWidget({
        type: 'error',
        message: 'Failed to get address details. Using coordinates instead.',
        isVisible: true
      });
    } finally {
      clearTimeout(timeoutId);
      setLoadingAddress(false);
    }
  };

  const handlePick = (p: LatLng) => {
    if (disabled) return;
    
    setPos(p);
    updateAddress(p.lat, p.lng);
    onChange?.(p, address);
    
    // Hide help panel when user manually picks a location
    setHelperWidget(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const useMyLocation = () => {
    if (disabled) return;
    
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation services.",
        variant: "destructive"
      });
      return;
    }
    
    // Show helper widget if this is the first access
    if (!locationAccessedRef.current) {
      setHelperWidget({
        type: 'permission',
        message: 'DeFix needs to access your location to show problems near you. Your location will only be used within the app.',
        isVisible: true,
        actionHandler: () => {
          setHelperWidget(prev => ({ ...prev, isVisible: false }));
          getLocation();
        }
      });
      return;
    }
    
    // Otherwise proceed with getting location
    getLocation();
  };
  
  const getLocation = () => {
    if (disabled) return;
    
    setLoadingGeo(true);
    
    // Mark that location has been accessed
    locationAccessedRef.current = true;
    
    // Show notification
    toast({
      title: "Accessing Location",
      description: "DeFix is accessing your current location.",
      duration: 3000,
    });
    
    // Hide any currently displayed helper widget
    setHelperWidget(prev => ({
      ...prev,
      isVisible: false
    }));
    
    // Clear any existing geolocation attempts
    const geoOptions = { 
      enableHighAccuracy: true, 
      timeout: 10000,
      maximumAge: 300000 // Accept cached positions up to 5 minutes old
    };
    
    // Try to get precise location first
    navigator.geolocation.getCurrentPosition(
      (res) => {
        handleSuccessfulGeolocation(res);
      },
      (error) => {
        console.log("High accuracy geolocation failed, trying with lower accuracy...");
        
        // If high accuracy fails, try with lower accuracy
        navigator.geolocation.getCurrentPosition(
          (res) => {
            handleSuccessfulGeolocation(res);
          },
          (error) => {
            handleGeolocationError(error);
          },
          { 
            enableHighAccuracy: false, 
            timeout: 10000,
            maximumAge: 600000 // Accept cached positions up to 10 minutes old for fallback
          }
        );
      },
      geoOptions
    );
  };
  
  const handleSuccessfulGeolocation = (position: GeolocationPosition) => {
    const p = { lat: position.coords.latitude, lng: position.coords.longitude };
    handlePick(p);
    setLoadingGeo(false);
    
    // Additional information about the accuracy
    const accuracyMsg = position.coords.accuracy <= 100 
      ? "High accuracy position obtained."
      : position.coords.accuracy <= 500
        ? "Moderate accuracy position obtained."
        : "Low accuracy position obtained.";
    
    toast({
      title: "Location Found",
      description: `Successfully determined your location. ${accuracyMsg}`,
      variant: "success",
      duration: 3000,
    });
    
    // Ensure help panel is hidden after successful location access
    setHelperWidget(prev => ({
      ...prev,
      isVisible: false
    }));
  };
  
  const handleGeolocationError = (error: GeolocationPositionError) => {
    setLoadingGeo(false);
    console.error("Geolocation error:", error);
    
    // Handle specific error types
    let errorMsg = "Unknown error accessing your location.";
    let troubleshootingTips = "";
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMsg = "Location access was denied. Please enable location permissions in your browser settings.";
        troubleshootingTips = "Check your browser settings to allow location access for this site.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMsg = "Location information is unavailable.";
        troubleshootingTips = "Your device may not have GPS or other location services enabled. Try enabling WiFi for better location services.";
        break;
      case error.TIMEOUT:
        errorMsg = "Location request timed out.";
        troubleshootingTips = "Check your connection and try again. If you're indoors, moving closer to a window may help.";
        break;
    }
    
    // Show error toast
    toast({
      title: "Location Error",
      description: errorMsg,
      variant: "destructive",
      duration: 5000,
    });
    
    // Show more detailed error widget
    setHelperWidget({
      type: 'error',
      message: `${errorMsg} ${troubleshootingTips}`,
      isVisible: true,
      actionHandler: () => {
        // Provide a retry action
        getLocation();
      }
    });
  };

  const handleLocationSearch = (lat: number, lng: number, searchAddress: string) => {
    if (disabled) return;
    
    const p = { lat, lng };
    setPos(p);
    setAddress(searchAddress);
    onChange?.(p, searchAddress);
    
    // Mark that location has been accessed (even if it's from search)
    locationAccessedRef.current = true;
    
    // Hide help panel when location is selected from search
    setHelperWidget(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  return (
    <div className={`${className ?? ""} space-y-4 animate-fade-in ${disabled ? 'opacity-75 pointer-events-none' : ''}`}>
      {/* Location Search */}
      <div className="space-y-3">
        <LocationSearch 
          onLocationSelect={handleLocationSearch}
          className="w-full"
          disabled={isOffline || disabled}
          onError={(error) => {
            // Show error in helper widget
            setHelperWidget({
              type: 'error',
              message: `Search error: ${error.message}`,
              isVisible: true
            });
          }}
        />
        
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={useMyLocation} 
            disabled={loadingGeo || disabled || isOffline}
            className="glass-card hover-lift"
          >
            {loadingGeo ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Use My Location
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowStreet((s) => !s)}
            className="glass-card hover-lift"
            disabled={disabled || isOffline}
          >
            {showStreet ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Street View
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Street View
              </>
            )}
          </Button>
          
          {isOffline && (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-500 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => window.location.reload()}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}
        </div>
        
        {/* Location Helper Widget */}
        <LocationHelperWidget
          type={helperWidget.type}
          message={helperWidget.message}
          isVisible={helperWidget.isVisible && !disabled}
          onClose={() => setHelperWidget(prev => ({ ...prev, isVisible: false }))}
          onAction={helperWidget.actionHandler}
          actionLabel={helperWidget.type === 'permission' ? 'Allow Location Access' : helperWidget.type === 'error' ? 'Try Again' : undefined}
          secondaryAction={helperWidget.type === 'error' ? () => setHelperWidget(prev => ({ ...prev, isVisible: false })) : undefined}
          secondaryActionLabel="Dismiss"
        />
      </div>

      {/* Map Container */}
      <Card className={`overflow-hidden glass-card border-0 shadow-xl ${disabled ? 'opacity-80' : ''}`}>
        {isOffline ? (
          <div className="h-64 sm:h-72 md:h-80 w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">You're currently offline</h3>
            <p className="text-center text-muted-foreground mb-4 max-w-md">
              The map can't be displayed while you're offline. Some features will be limited until your internet connection is restored.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry Connection
            </Button>
          </div>
        ) : (
          <ErrorBoundary fallback={
            <div className="h-64 sm:h-72 md:h-80 w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Map failed to load</h3>
              <p className="text-center text-muted-foreground mb-4 max-w-md">
                There was a problem loading the map. This could be due to network issues or browser compatibility.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setHelperWidget({
                      type: 'error',
                      message: 'Map loading failed. Try using a different browser or check if any browser extensions might be blocking map services.',
                      isVisible: true,
                      actionHandler: () => window.location.reload()
                    });
                  }}
                >
                  Get Help
                </Button>
              </div>
            </div>
          }>
            <MapContainer
              center={[pos.lat, pos.lng]}
              zoom={13}
              className="h-64 sm:h-72 md:h-80 w-full"
              scrollWheelZoom
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Streets">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution='Imagery &copy; Esri, Maxar, Earthstar Geographics'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <Marker position={[pos.lat, pos.lng]} icon={customIcon} />
              <Clicker onPick={handlePick} disabled={disabled} />
              <RecenterOnPos pos={pos} />
            </MapContainer>
          </ErrorBoundary>
        )}
      </Card>

      {/* Location Info */}
      <div className="space-y-2">
        <div className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand" />
          Selected Location
        </div>
        <div className="text-xs text-muted-foreground space-y-1" aria-live="polite">
          <div className="flex items-center gap-1">
            <span aria-label="Coordinates">📍</span> 
            <span>{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</span>
          </div>
          {loadingAddress && (
            <div className="flex items-center gap-2" role="status">
              <Loader2 className="w-3 h-3 animate-spin text-brand" />
              <span>Loading address...</span>
            </div>
          )}
          {!loadingAddress && address && (
            <div className="flex items-start gap-1">
              <span aria-label="Address">🏠</span> 
              <span>{address}</span>
            </div>
          )}
          {!disabled && (
            <div className="text-brand flex items-start gap-1">
              <span aria-hidden="true">💡</span> 
              <span>Click the map to set a new location</span>
            </div>
          )}
          {isOffline && (
            <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
              <WifiOff className="h-3 w-3" /> 
              <span>Some features limited while offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Street View */}
      <StreetView lat={pos.lat} lng={pos.lng} show={showStreet} isOffline={isOffline} />
    </div>
  );
};

export default MapPicker;
