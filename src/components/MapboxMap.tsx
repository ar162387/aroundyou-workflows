import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
  deliveryTime: string;
}

const MapboxMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Sample shops data (in real app, this would come from API)
  const shops: Shop[] = [
    { id: '1', name: 'Fresh Groceries', category: 'Grocery', latitude: 24.8607, longitude: 67.0011, rating: 4.5, deliveryTime: '15-25 min' },
    { id: '2', name: 'Pizza Palace', category: 'Restaurant', latitude: 24.8647, longitude: 67.0031, rating: 4.2, deliveryTime: '20-30 min' },
    { id: '3', name: 'Tech Store', category: 'Electronics', latitude: 24.8587, longitude: 67.0051, rating: 4.8, deliveryTime: '30-45 min' },
  ];

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Default to Karachi if geolocation fails
          setUserLocation([67.0011, 24.8607]);
        }
      );
    } else {
      // Default location
      setUserLocation([67.0011, 24.8607]);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !userLocation) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: userLocation,
      zoom: 13,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add user location marker
    new mapboxgl.Marker({ color: '#22d3ee' })
      .setLngLat(userLocation)
      .setPopup(new mapboxgl.Popup().setHTML('<div class="p-2 text-sm font-medium">Your Location</div>'))
      .addTo(map.current);

    // Add shop markers
    shops.forEach((shop) => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-accent rounded-full border-2 border-white shadow-custom-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform';
      el.innerHTML = `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>`;

      new mapboxgl.Marker({ element: el })
        .setLngLat([shop.longitude, shop.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-3 min-w-48">
              <h3 class="font-semibold text-sm mb-1">${shop.name}</h3>
              <p class="text-xs text-muted-foreground mb-2">${shop.category}</p>
              <div class="flex items-center justify-between text-xs">
                <span class="flex items-center">
                  <span class="text-yellow-500 mr-1">⭐</span>
                  ${shop.rating}
                </span>
                <span class="text-muted-foreground">${shop.deliveryTime}</span>
              </div>
            </div>`
          )
        )
        .addTo(map.current);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);

  if (!mapboxToken) {
    return (
      <div className="relative w-full h-64 bg-muted rounded-lg border flex flex-col items-center justify-center p-6 space-y-4">
        <div className="flex items-center space-x-2 text-muted-foreground mb-2">
          <MapPin className="w-5 h-5" />
          <span className="text-sm font-medium">Map Configuration Required</span>
        </div>
        <div className="max-w-md text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Enter your Mapbox public token to enable interactive shop discovery
          </p>
          <Input
            type="text"
            placeholder="pk.eyJ1IjoieW91cm..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Get your token at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 lg:h-80 rounded-lg overflow-hidden shadow-custom-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Floating controls */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          size="sm" 
          variant="secondary"
          onClick={getUserLocation}
          className="shadow-custom-md backdrop-blur-sm bg-background/80 hover:bg-background/90"
        >
          <Navigation className="w-4 h-4 mr-2" />
          My Location
        </Button>
      </div>

      {/* Shop count indicator */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-custom-md">
          <span className="text-xs font-medium text-foreground">
            {shops.length} shops nearby
          </span>
        </div>
      </div>
    </div>
  );
};

export default MapboxMap;