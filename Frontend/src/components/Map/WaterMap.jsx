import { GoogleMap, InfoWindow, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useMemo, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const fallbackCenter = { lat: 20.5937, lng: 78.9629 };

function pinTone(area) {
  const status = area.supply_status;
  const demand = Number(area.total_demand || area.quantity || 0);
  if (status === 'shortage' || demand > 700) return 'red';
  if (status === 'moderate' || demand > 300) return 'orange';
  return 'green';
}

export default function WaterMap({ areas = [] }) {
  const [selected, setSelected] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting your location...');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey || 'missing-key' });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Browser location is not supported.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('Centered on your current location.');
      },
      () => setLocationStatus('Location permission denied. Showing available area locations.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const validAreas = areas.filter((a) => a.latitude && a.longitude);
  const center = useMemo(() => {
    if (currentLocation) return currentLocation;
    const first = validAreas[0];
    return first ? { lat: Number(first.latitude), lng: Number(first.longitude) } : fallbackCenter;
  }, [validAreas, currentLocation]);

  if (!apiKey || !isLoaded) {
    return (
      <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-100 via-white to-sky-100 p-5 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950">
        <div className="absolute inset-0 water-particles opacity-60" />
        <div className="relative z-10 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Supply Map</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{locationStatus}</p>
          {currentLocation && (
            <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-200">
              Current location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add `VITE_GOOGLE_MAPS_API_KEY` to enable Google Maps.</p>
        </div>
        <div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {currentLocation && (
            <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-cyan-200 bg-cyan-50/90 p-4 shadow-sm backdrop-blur dark:border-cyan-500/20 dark:bg-cyan-500/10">
              <div className="flex items-start gap-3">
                <LocateFixed className="mt-1 h-5 w-5 text-cyan-600" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Your Current Location</p>
                  <p className="mt-2 text-xs text-slate-500">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</p>
                </div>
              </div>
            </motion.div>
          )}
          {(validAreas.length ? validAreas : [{ name: 'No areas yet', area_type: 'create area', supply_status: 'no_data' }]).map((area, index) => (
            <motion.div key={area.id || index} whileHover={{ y: -4 }} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex items-start gap-3">
                <MapPin className={`mt-1 h-5 w-5 ${pinTone(area) === 'red' ? 'text-red-500' : pinTone(area) === 'orange' ? 'text-orange-500' : 'text-emerald-500'}`} />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{area.name}</p>
                  <p className="text-xs text-slate-500">{area.area_type} · {area.supply_status || 'no_data'}</p>
                  {area.latitude && <p className="mt-2 text-xs text-slate-500">{area.latitude}, {area.longitude}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[460px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-white/10">
      <GoogleMap mapContainerStyle={{ height: '100%', width: '100%' }} center={center} zoom={currentLocation ? 13 : 11}>
        {currentLocation && (
          <MarkerF
            position={currentLocation}
            title="Your Current Location"
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#06b6d4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 9,
            }}
          />
        )}
        {validAreas.map((area) => (
          <MarkerF
            key={area.id}
            position={{ lat: Number(area.latitude), lng: Number(area.longitude) }}
            onClick={() => setSelected(area)}
          />
        ))}
        {selected && (
          <InfoWindow position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }} onCloseClick={() => setSelected(null)}>
            <div className="min-w-48">
              <strong>{selected.name}</strong>
              <p>Demand: {selected.total_demand || 0} KL</p>
              <p>Allocated: {selected.total_allocated || 0} KL</p>
              <p>Status: {selected.supply_status || 'no data'}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
