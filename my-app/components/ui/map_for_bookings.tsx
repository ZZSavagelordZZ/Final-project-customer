'use client'
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default icon issues in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icon definitions with more fitting icons
const icons = {
  restaurant: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png', // Fork and Knife Icon
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  hospital: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965567.png', // Hospital Cross Icon
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  bank: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998617.png', // Bank Building Icon
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  atm: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828665.png', // ATM Icon
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  shop: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077035.png', // Shop Icon
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  hotel: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448338.png', // Hotel Building Icon
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  mosque: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448363.png', // Mosque Icon
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  cafe: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1150/1150131.png', // Coffee Cup Icon
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  tourist: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Tourist Icon (can be customized)
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  }),
  default: new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

// RecenterControl Component
const RecenterControl: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  
  const nicosiaLocation = useMemo<[number, number]>(() => 
    [35.190103, 33.362347], 
    []
  );

  useEffect(() => {
    const recenterControl = L.Control.extend({
      options: {
        position: 'topright',
      },

      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

        const button = L.DomUtil.create('button', '', container);
        button.innerHTML = '📍';
        button.style.backgroundColor = 'white';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.padding = '5px';
        button.style.fontSize = '18px';

        button.title = 'Center on Nicosia Office';

        L.DomEvent.on(button, 'click', function (e) {
          e.preventDefault();
          map.setView(nicosiaLocation, 13);
        });

        return container;
      },
    });

    const control = new recenterControl();
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map, nicosiaLocation]);

  return null;
};

interface PointOfInterest {
  lat: number;
  lng: number;
  name: string;
  amenity?: string;
  tourism?: string;
}

// Add to existing interface definitions
interface MapComponentProps {
  initialLocations?: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
  onLocationSelect?: (lat: number, lng: number) => void;
}

// Add this new component to handle map clicks
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
};

// Update the MapComponent definition
const MapComponent: React.FC<MapComponentProps> = ({ initialLocations, onLocationSelect }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredPOIs, setFilteredPOIs] = useState<PointOfInterest[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Define allowed amenities and tourism types
  const allowedAmenities = [
    'hospital',
    'bank',
    'atm',
    'shop',
    'hotel',
    'mosque',
    'restaurant',
    'cafe',
  ];

  const allowedTourism = [
    'attraction',
    'museum',
    'zoo',
    'theme_park',
    'gallery',
    'viewpoint',
    'hotel', // Hotels can also be tagged under tourism
  ];

  useEffect(() => {
    if (initialLocations) {
      // If initialLocations provided, center the map on Cyprus
      const cyprusCenter: [number, number] = [35.1856, 33.3823];
      setPosition(cyprusCenter);
      setPointsOfInterest(initialLocations.map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
        name: loc.name
      })));
      setFilteredPOIs(initialLocations.map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
        name: loc.name
      })));
    } else {
      // Existing geolocation logic
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
        },
        (error) => {
          console.error('Error fetching location:', error);
          setErrorMessage('Failed to get your location. Please enable location services and try again.');
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [initialLocations]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPOIs(pointsOfInterest);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = pointsOfInterest.filter(
        (poi) =>
          (poi.amenity && poi.amenity.toLowerCase().includes(query)) ||
          (poi.tourism && poi.tourism.toLowerCase().includes(query))
      );
      setFilteredPOIs(filtered);
    }
  }, [searchQuery, pointsOfInterest]);

  const fetchPointsOfInterest = async (lat: number, lng: number, radius: number = 50000) => {
    if (!lat || !lng) return;

    const amenityFilter = allowedAmenities.join('|');
    const tourismFilter = allowedTourism.join('|');

    const query = `
      [out:json];
      (
        node[amenity~"^(${amenityFilter})$"](around:${radius},${lat},${lng});
        node[tourism~"^(${tourismFilter})$"](around:${radius},${lat},${lng});
      );
      out body;
    `;
    try {
      const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
        headers: { 'Content-Type': 'text/plain' },
      });
      const pois: PointOfInterest[] = response.data.elements.map((poi: any) => ({
        lat: poi.lat,
        lng: poi.lon,
        name: poi.tags.name || 'Unnamed POI',
        amenity: poi.tags.amenity,
        tourism: poi.tags.tourism,
      }));
      setPointsOfInterest(pois);
      setFilteredPOIs(pois);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching points of interest:', error);
      setErrorMessage('Failed to fetch points of interest. Please try again.');
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  const getIcon = (poi: PointOfInterest): L.Icon => {
    if (poi.amenity && icons[poi.amenity as keyof typeof icons]) {
      return icons[poi.amenity as keyof typeof icons];
    }
    if (poi.tourism && icons['tourist']) {
      return icons['tourist'];
    }
    return icons.default;
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  if (!position) {
    return <div>Loading map...</div>;
  }

  return (
    <div>
      {!initialLocations && (
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search within selected categories"
          style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        />
      )}
      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
      <MapContainer 
        center={position || [35.1856, 33.3823]} 
        zoom={initialLocations ? 9 : 13} 
        style={{ height: '300px', width: '100%' }}
      >
        <MapClickHandler onMapClick={handleMapClick} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredPOIs.map((poi, index) => (
          <Marker
            key={index}
            position={[poi.lat, poi.lng]}
            icon={getIcon(poi)}
          >
            <Popup>
              {poi.name} - {poi.amenity || poi.tourism}
            </Popup>
          </Marker>
        ))}
        {selectedPosition && (
          <Marker
            position={selectedPosition}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>Selected Location</Popup>
          </Marker>
        )}
        <RecenterControl position={position} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
