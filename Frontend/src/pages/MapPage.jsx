import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import WaterMap from '../components/Map/WaterMap';
import { waterApi } from '../services/api';

export default function MapPage() {
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    waterApi.mapData()
      .then(({ data }) => setAreas(data.data || []))
      .catch(() => toast.error('Unable to load map data'));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Water Distribution Map</h2>
        <p className="text-slate-500 dark:text-slate-400">Pins show live area demand, allocation, and shortage status.</p>
      </div>
      <WaterMap areas={areas} />
    </div>
  );
}
