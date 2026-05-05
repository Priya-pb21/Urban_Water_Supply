import { GoogleMap, InfoWindow, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useMemo, useState } from 'react';
import { Crosshair, LocateFixed, MapPin, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { waterApi } from '../../services/api';

const fallbackCenter = { lat: 20.5937, lng: 78.9629 };

const emptyForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  type: 'residential',
  priority: 'medium',
  daily_demand_kl: '',
};

function markerSvg(type) {
  const config = {
    hospital: { color: '#dc2626', label: '+' },
    residential: { color: '#2563eb', label: 'H' },
    government: { color: '#d97706', label: '*' },
    commercial: { color: '#0891b2', label: '$' },
    industrial: { color: '#0f766e', label: 'I' },
  }[type] || { color: '#0891b2', label: 'W' };

  const svg = `
    <svg width="42" height="52" viewBox="0 0 42 52" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 2C10.5 2 2 10.4 2 20.8C2 35.2 21 50 21 50C21 50 40 35.2 40 20.8C40 10.4 31.5 2 21 2Z" fill="${config.color}" stroke="white" stroke-width="3"/>
      <circle cx="21" cy="21" r="11" fill="white" fill-opacity="0.95"/>
      <text x="21" y="26" text-anchor="middle" font-size="16" font-family="Arial" font-weight="800" fill="${config.color}">${config.label}</text>
    </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(42, 52),
    anchor: new window.google.maps.Point(21, 50),
  };
}

function normalizeArea(area) {
  return {
    ...area,
    type: area.type || area.area_type,
    daily_demand_kl: area.daily_demand_kl || area.total_demand || 0,
  };
}

export default function WaterMap({ areas = [] }) {
  const [displayAreas, setDisplayAreas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting your location...');
  const [addMode, setAddMode] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey || 'missing-key' });

  useEffect(() => {
    setDisplayAreas(areas.map(normalizeArea));
  }, [areas]);

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

  const validAreas = displayAreas.filter((a) => a.latitude && a.longitude);
  const center = useMemo(() => {
    if (currentLocation) return currentLocation;
    const first = validAreas[0];
    return first ? { lat: Number(first.latitude), lng: Number(first.longitude) } : fallbackCenter;
  }, [validAreas, currentLocation]);

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await response.json();
      return data.display_name || `Location ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch {
      return `Location ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  };

  const openLocationForm = async (lat, lon) => {
    const address = await reverseGeocode(lat, lon);
    setForm({
      ...emptyForm,
      name: address.split(',')[0],
      address,
      latitude: lat.toFixed(8),
      longitude: lon.toFixed(8),
    });
    setFormOpen(true);
    setAddMode(false);
  };

  const submitLocation = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        daily_demand_kl: Number(form.daily_demand_kl || 0),
      };
      const { data } = await waterApi.addLocation(payload);
      setDisplayAreas((current) => [normalizeArea(data.data), ...current]);
      setFormOpen(false);
      setForm(emptyForm);
      toast.success('Location added to map');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to add location');
    } finally {
      setSaving(false);
    }
  };

  const formPanel = formOpen && (
    <motion.form
      onSubmit={submitLocation}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 18 }}
      className="absolute right-4 top-20 z-20 w-[min(92vw,390px)] glass-card rounded-2xl p-4 shadow-2xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Add Location</h3>
          <p className="text-xs text-slate-500">Coordinates and address are editable.</p>
        </div>
        <motion.button
          type="button"
          onClick={() => setFormOpen(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>
      <div className="grid gap-3">
        <input className="input" placeholder="Area name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <textarea className="input min-h-20" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
          <input className="input" type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="hospital">Hospital</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="government">Government</option>
          </select>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <input className="input" type="number" min="0" step="0.01" placeholder="Daily Water Demand (KL)" value={form.daily_demand_kl} onChange={(e) => setForm({ ...form, daily_demand_kl: e.target.value })} required />
        <motion.button
          className="btn-primary"
          disabled={saving}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {saving ? 'Saving...' : 'Submit Location'}
        </motion.button>
      </div>
    </motion.form>
  );

  if (!apiKey || !isLoaded) {
    return (
      <div className="relative min-h-[420px] overflow-hidden rounded-2xl glass-card p-5">
        <div className="absolute inset-0 water-particles opacity-60" />
        <div className="relative z-10 mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Supply Map</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{locationStatus}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add `VITE_GOOGLE_MAPS_API_KEY` to enable click-to-add on Google Maps.</p>
          </div>
          <motion.button
            type="button"
            className="btn-primary"
            onClick={() => currentLocation && openLocationForm(currentLocation.lat, currentLocation.lng)}
            disabled={!currentLocation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-4 w-4" /> Add Current Location
          </motion.button>
        </div>
        <div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {currentLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-2xl border border-cyan-200/50 p-4 dark:border-cyan-500/20"
            >
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <LocateFixed className="h-5 w-5 text-cyan-600" />
                </motion.div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Your Current Location</p>
                  <p className="mt-2 text-xs text-slate-500">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</p>
                </div>
              </div>
            </motion.div>
          )}
          <AnimatePresence mode="popLayout">
            {(validAreas.length ? validAreas : [{ name: 'No areas yet', area_type: 'create area', supply_status: 'no_data' }]).map((area, index) => (
              <motion.div
                key={area.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl border border-white/70 p-4 dark:border-white/10"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{area.name}</p>
                    <p className="text-xs text-slate-500">{area.area_type} · {area.priority_level || 'medium'} · {area.daily_demand_kl || 0} KL/day</p>
                    {area.latitude && <p className="mt-2 text-xs text-slate-500">{area.latitude}, {area.longitude}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {formPanel}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl glass-card shadow-sm">
      <motion.div
        className="absolute left-4 top-4 z-10 flex flex-wrap gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          type="button"
          onClick={() => setAddMode((value) => !value)}
          className={addMode ? 'btn-primary' : 'btn-secondary'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Crosshair className="h-4 w-4" /> {addMode ? 'Click Map to Add' : 'Add Location'}
        </motion.button>
        {currentLocation && (
          <motion.button
            type="button"
            onClick={() => openLocationForm(currentLocation.lat, currentLocation.lng)}
            className="btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LocateFixed className="h-4 w-4" /> Use Current Location
          </motion.button>
        )}
      </motion.div>

      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        center={center}
        zoom={currentLocation ? 13 : 11}
        onClick={(event) => {
          if (!addMode) return;
          openLocationForm(event.latLng.lat(), event.latLng.lng());
        }}
        options={{
          draggableCursor: addMode ? 'crosshair' : undefined,
          draggingCursor: addMode ? 'crosshair' : undefined,
        }}
      >
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
            icon={markerSvg(area.area_type || area.type)}
            onClick={() => setSelected(area)}
          />
        ))}
        {selected && (
          <InfoWindow position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }} onCloseClick={() => setSelected(null)}>
            <div className="min-w-56 glass-card rounded-xl p-3">
              <strong className="text-slate-900 dark:text-white">{selected.name}</strong>
              <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <p>Type: {selected.area_type || selected.type}</p>
                <p>Priority: {selected.priority_level || 'medium'}</p>
                <p>Daily demand: {selected.daily_demand_kl || selected.total_demand || 0} KL</p>
                <p>Allocated: {selected.total_allocated || 0} KL</p>
                {selected.address && <p style={{ maxWidth: 220 }} className="break-words">{selected.address}</p>}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      <AnimatePresence>
        {formPanel}
      </AnimatePresence>
    </div>
  );
}
