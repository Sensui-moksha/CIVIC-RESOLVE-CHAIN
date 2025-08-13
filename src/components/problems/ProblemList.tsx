import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProblems, Problem } from "@/utils/store";
import { Link } from "react-router-dom";
import { MapContainer, Marker, TileLayer, LayersControl } from "react-leaflet";
import { MapPin, Calendar, Clock, Coins } from "lucide-react";
import { getDaysAgo, formatDate } from "@/utils/geocoding";
import L from "leaflet";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const GatewayImg: React.FC<{ cid?: string; alt: string; className?: string }> = ({ cid, alt, className }) => {
  if (!cid) return null;
  const src = `https://ipfs.io/ipfs/${cid}`;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
};

const ProblemList: React.FC = () => {
  const [items, setItems] = useState<Problem[]>([]);
  useEffect(() => {
    setItems(getProblems());
  }, []);

  const hasAny = items.length > 0;

  const center = useMemo(() => {
    if (!hasAny) return { lat: 37.7749, lng: -122.4194 };
    const { lat, lng } = items[0];
    return { lat, lng };
  }, [items, hasAny]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Map */}
      <Card className="glass-card border-0 shadow-xl hover-lift">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand" />
            Problems Near You
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {hasAny ? `${items.length} issue${items.length === 1 ? '' : 's'} reported in your area` : 'No issues reported yet'}
          </p>
        </CardHeader>
        <CardContent>
          <Card className="overflow-hidden border-0 shadow-lg">
            <MapContainer 
              center={[center.lat, center.lng]} 
              zoom={hasAny ? 11 : 3} 
              style={{ height: 280, width: "100%" }}
              className="rounded-lg"
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
              
              
              {items.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]} />
              ))}
            </MapContainer>
          </Card>
        </CardContent>
      </Card>

      {/* Empty State */}
      {!hasAny && (
        <Card className="glass-card border-0 shadow-xl">
          <CardContent className="py-16 text-center">
            <div className="animate-bounce-gentle mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-brand/20 to-brand-glow/20 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-brand" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Problems Reported Yet</h3>
            <p className="text-muted-foreground">Be the first to report an issue and help improve your community!</p>
          </CardContent>
        </Card>
      )}

      {/* Problems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {items.map((p, index) => {
          const daysAgo = getDaysAgo(p.createdAt);
          const formattedDate = formatDate(p.createdAt);
          
          return (
            <Card 
              key={p.id} 
              className="glass-card border-0 shadow-xl hover-lift group transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-brand transition-colors">
                    {p.title}
                  </CardTitle>
                  <Badge 
                    variant={daysAgo === 0 ? "default" : daysAgo <= 7 ? "secondary" : "outline"}
                    className="shrink-0 animate-pulse-glow"
                  >
                    {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  {/* Image */}
                  <div className="col-span-5">
                    <div className="relative overflow-hidden rounded-lg group-hover:shadow-lg transition-shadow">
                      <GatewayImg 
                        cid={p.imageCid} 
                        alt={p.title} 
                        className="w-full h-24 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="col-span-7 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    
                    {/* Meta Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formattedDate}
                      </div>
                      
                      {p.address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {p.address}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-xs font-medium text-brand">
                        <Coins className="h-3 w-3" />
                        {p.bountyAPT} APT Bounty
                      </div>
                    </div>
                    
                    {/* Action */}
                    <Link to={`/problem/${encodeURIComponent(p.id)}`} className="block">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full glass-card hover:bg-brand hover:text-white hover:border-brand transition-all duration-300"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProblemList;
