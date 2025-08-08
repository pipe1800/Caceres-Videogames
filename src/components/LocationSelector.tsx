
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string; mapUrl: string }) => void;
  currentLocation?: string;
  isRequired?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  onLocationSelect, 
  currentLocation, 
  isRequired = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    mapUrl: string;
  } | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  // Initialize map when token is provided and component is open
  useEffect(() => {
    if (!isOpen || !mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Initialize map centered on El Salvador
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-89.2182, 13.7942], // El Salvador coordinates
      zoom: 8
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Handle map clicks
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      
      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker({ color: '#3bc8da' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Get address from coordinates using reverse geocoding
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&country=sv&limit=1`
        );
        const data = await response.json();
        
        let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (data.features && data.features.length > 0) {
          address = data.features[0].place_name;
        }

        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const locationData = { lat, lng, address, mapUrl };
        
        setSelectedLocation(locationData);
        onLocationSelect(locationData);
      } catch (error) {
        console.error('Error getting address:', error);
        // Fallback to coordinates
        const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const locationData = { lat, lng, address, mapUrl };
        
        setSelectedLocation(locationData);
        onLocationSelect(locationData);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, mapboxToken, onLocationSelect]);

  // Search location function
  const searchLocation = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=sv&limit=5`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        const address = feature.place_name;
        
        // Update map view
        if (map.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 15 });
          
          // Remove existing marker
          if (marker.current) {
            marker.current.remove();
          }

          // Add new marker
          marker.current = new mapboxgl.Marker({ color: '#3bc8da' })
            .setLngLat([lng, lat])
            .addTo(map.current);
        }

        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const locationData = { lat, lng, address, mapUrl };
        
        setSelectedLocation(locationData);
        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    onLocationSelect({ lat: 0, lng: 0, address: '', mapUrl: '' });
    
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  };

  const handleOpenMap = () => {
    if (!mapboxToken) {
      // Show token input if not provided
      setIsOpen(true);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          Ubicación en Mapa {isRequired && <span className="text-red-500">*</span>}
          <MapPin className="w-4 h-4" />
        </Label>
        {!isOpen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenMap}
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            {isRequired ? 'Seleccionar Ubicación *' : 'Seleccionar en Mapa'}
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Seleccionar Ubicación de Entrega</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!mapboxToken ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="mapboxToken">Token de Mapbox</Label>
                <Input
                  id="mapboxToken"
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  placeholder="Ingresa tu token público de Mapbox"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Obtén tu token en{' '}
                  <a 
                    href="https://mapbox.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    mapbox.com
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar dirección en El Salvador..."
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                />
                <Button type="button" onClick={searchLocation}>
                  Buscar
                </Button>
              </div>

              {/* Map Container */}
              <div className="relative">
                <div 
                  ref={mapContainer} 
                  className="w-full h-80 rounded-lg border border-gray-300"
                />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600 shadow-lg">
                  <p className="font-medium">Haz clic en el mapa para seleccionar la ubicación</p>
                  <p>📍 Ubicación exacta de entrega</p>
                </div>
              </div>

              {selectedLocation && (
                <div className="p-3 bg-white rounded border border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600">✅ Ubicación Seleccionada:</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedLocation.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                      <a
                        href={selectedLocation.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver en Google Maps
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearLocation}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentLocation && !isOpen && (
        <div className="text-sm text-gray-600 p-3 bg-green-50 rounded-lg border border-green-200">
          <span className="font-medium text-green-700">✅ Ubicación confirmada:</span>
          <p className="mt-1">{currentLocation}</p>
        </div>
      )}

      {isRequired && !selectedLocation && !currentLocation && (
        <p className="text-sm text-red-600">
          * La selección de ubicación es obligatoria para entregas a domicilio
        </p>
      )}
    </div>
  );
};

export default LocationSelector;
