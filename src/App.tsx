import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Red marker icon for outages
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  zIndexOffset: 0
});

// Blue marker icon for working on it
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  zIndexOffset: 1000
});

interface OutageReport {
  id: string;
  lat: number;
  lng: number;
  timestamp: Date;
  expiresAt: Date;
  type: 'outage' | 'working';
}

const App = () => {
  const [reports, setReports] = useState<OutageReport[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.3026, -62.7177]); // Default to St. Kitts center
  const mapRef = useRef<any>(null);
  
  // St. Kitts and Nevis boundaries (approximate)
  const stKittsNevisBounds = {
    north: 17.42,   // Northern tip of St. Kitts
    south: 17.06,   // Southern tip of Nevis
    east: -62.52,   // Eastern coast
    west: -62.87    // Western coast
  };
  
  // St. Kitts coordinates (center of the island)
  const stKittsCenter: [number, number] = [17.3026, -62.7177];

  // Check if coordinates are within St. Kitts and Nevis
  const isWithinStKittsNevis = (lat: number, lng: number): boolean => {
    return (
      lat >= stKittsNevisBounds.south &&
      lat <= stKittsNevisBounds.north &&
      lng >= stKittsNevisBounds.west &&
      lng <= stKittsNevisBounds.east
    );
  };

  // Get user's current location and update map center
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          setUserLocation({
            lat: userLat,
            lng: userLng
          });

          // Center map on user's location if they're within St. Kitts and Nevis
          if (isWithinStKittsNevis(userLat, userLng)) {
            setMapCenter([userLat, userLng]);
            // Also update the map view if map is already loaded
            if (mapRef.current) {
              mapRef.current.setView([userLat, userLng], 15);
            }
          } else {
            // Keep default center if user is outside the area
            setMapCenter(stKittsCenter);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to St. Kitts center if location access denied
          setUserLocation({ lat: stKittsCenter[0], lng: stKittsCenter[1] });
          setMapCenter(stKittsCenter);
        }
      );
    }
  }, []);

  // Clean up expired reports
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setReports(prev => prev.filter(report => report.expiresAt > now));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const getCenterCoordinates = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    }
    return { lat: stKittsCenter[0], lng: stKittsCenter[1] };
  };

  const handleReportOutage = () => {
    if (!userLocation) {
      alert('Location not available. Please enable location services.');
      return;
    }

    // Check if user is within St. Kitts and Nevis
    if (!isWithinStKittsNevis(userLocation.lat, userLocation.lng)) {
      alert('Sorry GPS thinks you are outside the area');
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    const newReport: OutageReport = {
      id: Date.now().toString(),
      lat: userLocation.lat,
      lng: userLocation.lng,
      timestamp: now,
      expiresAt: expiresAt,
      type: 'outage'
    };

    setReports(prev => [...prev, newReport]);
  };

  const handleWorkingOnIt = () => {
    if (!userLocation) {
      alert('Location not available. Please enable location services.');
      return;
    }

    // Check if user is within St. Kitts and Nevis
    if (!isWithinStKittsNevis(userLocation.lat, userLocation.lng)) {
      alert('Sorry GPS thinks you are outside the area');
      return;
    }

    const centerCoords = getCenterCoordinates();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    const newReport: OutageReport = {
      id: Date.now().toString(),
      lat: centerCoords.lat,
      lng: centerCoords.lng,
      timestamp: now,
      expiresAt: expiresAt,
      type: 'working'
    };

    setReports(prev => [...prev, newReport]);
  };

  return (
    <div className="app-container">
      {/* Center crosshairs */}
      <div className="crosshair-vertical"></div>
      <div className="crosshair-horizontal"></div>

      <MapContainer
        center={mapCenter}
        zoom={userLocation && isWithinStKittsNevis(userLocation.lat, userLocation.lng) ? 15 : 12}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render all markers */}
        {reports.map(report => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={report.type === 'outage' ? redIcon : blueIcon}
            zIndexOffset={report.type === 'working' ? 1000 : 0}
          >
            <Popup>
              <div>
                <strong>{report.type === 'outage' ? 'Service Outage' : 'Working On It'}</strong><br/>
                Reported: {report.timestamp.toLocaleTimeString()}<br/>
                Expires: {report.expiresAt.toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Working On It Button */}
      <button 
        className="working-button"
        onClick={handleWorkingOnIt}
      >
        Working On It
      </button>

      {/* Report Outage Button */}
      <button 
        className="report-button"
        onClick={handleReportOutage}
      >
        Report an Outage
      </button>
    </div>
  );
};

export default App;