import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, JadwalKerja } from '../../types';
import { apiService } from '../../services/apiService';
import Modal from '../../components/Modal';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Define custom icons
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Configuration constants
const WORKPLACES = [
  //{ name: 'Pabrik Tonasa', lat: -4.78841, lon: 119.61284 }, // Kantor Staf as a central point for the factory
  { name: 'Tonasa 23', lat: -4.783714780572759, lon: 119.61610006600712 },
  { name: 'Tonasa 4', lat: -4.78831873823137, lon: 119.61654058396095 },
  { name: 'Tonasa 5', lat: -4.790931202719051, lon: 119.61694886888938 },
  { name: 'Crusher', lat: -4.7893251806455295, lon: 119.62039780223822 },
  { name: 'Kantor Staf', lat: -4.788360643865878, lon: 119.61309925103656 },
];
const MAX_DISTANCE_METERS = 350;
const DEFAULT_MAP_CENTER: [number, number] = [-4.819, 119.640];
const ACCURACY_THRESHOLD_METERS = 150;

// Helper function to calculate distance
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Component to adjust map view dynamically
const ChangeView: React.FC<{ userPos: [number, number] | null, workplacePos: [number, number] | null }> = ({ userPos, workplacePos }) => {
  const map = useMap();
  useEffect(() => {
    if (userPos && workplacePos) {
      const bounds = L.latLngBounds([userPos, workplacePos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userPos) {
      map.flyTo(userPos, 16);
    } else if (workplacePos) {
      map.flyTo(workplacePos, 14);
    }
  }, [userPos, workplacePos, map]);
  return null;
};

interface ClockInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
    user: UserProfile;
    actionType: 'in' | 'out';
    jadwal: JadwalKerja[];
}

export const ClockInModal: React.FC<ClockInModalProps> = ({isOpen, onClose, onSuccess, onError, user, actionType, jadwal}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [position, setPosition] = useState<GeolocationPosition | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);

    // Form state
    const [healthStatus, setHealthStatus] = useState('Sehat');
    const [workLocation, setWorkLocation] = useState('Bekerja di Pabrik');
    const [workplace, setWorkplace] = useState(WORKPLACES[0].name);
    const [notes, setNotes] = useState('');
    
    const today = currentTime;
    const todaySchedule = useMemo(() => {
        const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        return jadwal.find(j => j.tanggal === todayStr);
    }, [jadwal, today]);

    const selectedWorkplaceDetails = useMemo(() => WORKPLACES.find(wp => wp.name === workplace), [workplace]);

    const fetchLocation = useCallback(() => {
        setIsFetchingLocation(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => { setPosition(pos); setIsFetchingLocation(false); },
            (err) => { setLocationError(err.message); setIsFetchingLocation(false); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchLocation();
            const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
            return () => clearInterval(timerId);
        }
    }, [isOpen, fetchLocation]);
    
    useEffect(() => {
        if (position && selectedWorkplaceDetails) {
            const calculatedDistance = getDistanceFromLatLonInM(
                position.coords.latitude, position.coords.longitude,
                selectedWorkplaceDetails.lat, selectedWorkplaceDetails.lon
            );
            setDistance(calculatedDistance);
        } else {
            setDistance(null);
        }
    }, [position, selectedWorkplaceDetails]);

    const isActionDisabled = useMemo(() => {
        if (isSubmitting) return true;
        if (workLocation === 'Bekerja di Pabrik') {
            if (isFetchingLocation || !position || locationError) return true;
            if (position.coords.accuracy > ACCURACY_THRESHOLD_METERS) return true;
            if (distance === null || distance > MAX_DISTANCE_METERS) return true;
        }
        return false;
    }, [isSubmitting, workLocation, isFetchingLocation, position, locationError, distance]);

    const locationMessage = () => {
        const accuracy = position?.coords.accuracy ?? 0;
        const isAccuracyLow = accuracy > ACCURACY_THRESHOLD_METERS;

        if (isFetchingLocation) return { text: "Mencari lokasi Anda...", color: "bg-blue-50 text-blue-800" };
        if (locationError) return { text: `Gagal mendapatkan lokasi: ${locationError}`, color: "bg-red-100 text-red-800" };
        if (position) {
            if (isAccuracyLow) {
                 return { text: `Akurasi rendah (${accuracy.toFixed(0)}m). Coba ke area lebih terbuka.`, color: "bg-orange-100 text-orange-800" };
            }
            if (distance !== null && distance > MAX_DISTANCE_METERS) {
                return { text: `Jarak Anda ${distance.toFixed(0)}m. Anda harus dalam radius ${MAX_DISTANCE_METERS}m untuk clock-in.`, color: "bg-red-100 text-red-800" };
            }
            return { text: `Lokasi Anda dengan akurasi ${accuracy.toFixed(2)} meter.`, color: "bg-green-50 text-green-800" };
        }
        return { text: "Lokasi tidak tersedia.", color: "bg-gray-100 text-gray-800" };
    };

    const handleSubmit = async () => {
        if (isActionDisabled) {
             onError('Kondisi lokasi tidak memenuhi syarat.');
             return;
        }
        setIsSubmitting(true);
        try {
            if (!todaySchedule) throw new Error("Jadwal kerja untuk hari ini tidak ditemukan.");
            await apiService.submitClockEvent(user, actionType, {
                healthStatus, workLocationType: workLocation,
                workplace: workLocation === 'Bekerja di Pabrik' ? workplace : undefined,
                notes, position, todaySchedule
            });
            onSuccess(`${actionType === 'in' ? 'Clock In' : 'Clock Out'} berhasil!`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan.";
            onError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const title = actionType === 'in' ? 'Clock In' : 'Clock Out';
    const { text: locText, color: locColor } = locationMessage();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="h-48 w-full rounded-lg overflow-hidden relative bg-slate-200">
                    <MapContainer center={DEFAULT_MAP_CENTER} zoom={13} scrollWheelZoom={true} style={{height: '100%', width: '100%'}}>
                        <ChangeView 
                            userPos={position ? [position.coords.latitude, position.coords.longitude] : null}
                            workplacePos={selectedWorkplaceDetails ? [selectedWorkplaceDetails.lat, selectedWorkplaceDetails.lon] : null}
                        />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {position && (
                            <>
                                <Marker position={[position.coords.latitude, position.coords.longitude]} icon={blueIcon}>
                                  <Popup>Lokasi Anda Saat Ini</Popup>
                                </Marker>
                                <Circle center={[position.coords.latitude, position.coords.longitude]} radius={position.coords.accuracy} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6' }} />
                            </>
                        )}
                        {selectedWorkplaceDetails && (
                            <>
                                <Marker position={[selectedWorkplaceDetails.lat, selectedWorkplaceDetails.lon]} icon={redIcon}>
                                    <Popup>{selectedWorkplaceDetails.name}</Popup>
                                </Marker>
                                <Circle center={[selectedWorkplaceDetails.lat, selectedWorkplaceDetails.lon]} radius={MAX_DISTANCE_METERS} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1 }} />
                            </>
                        )}
                    </MapContainer>
                </div>
                <div className={`text-center text-sm p-2 rounded-md ${locColor}`}>
                     <p className="font-semibold">{locText}</p>
                    {!isFetchingLocation && <button onClick={fetchLocation} className="text-blue-600 font-semibold hover:underline">Klik disini untuk refresh lokasi Anda!</button>}
                </div>
                <div className="text-center p-3 bg-slate-100 rounded-lg">
                    <p className="font-bold text-lg">{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} <span className="text-blue-600">{todaySchedule?.shift || 'OFF'}</span></p>
                    <p className="font-mono text-2xl font-bold tracking-wider">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</p>
                     <p className="text-xs text-slate-500">{new Date().toString()}</p>
                </div>
                <div>
                    <label htmlFor="healthStatus" className="block text-sm font-medium text-slate-700">Kondisi Kesehatan Anda Saat Ini</label>
                    <select id="healthStatus" value={healthStatus} onChange={e => setHealthStatus(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 rounded-md">
                        <option>Sehat</option>
                        <option>Kurang Sehat</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="workLocation" className="block text-sm font-medium text-slate-700">Lokasi Kerja Anda Hari Ini</label>
                    <select id="workLocation" value={workLocation} onChange={e => setWorkLocation(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 rounded-md">
                        <option>Bekerja di Pabrik</option>
                        <option>Bekerja di Rumah</option>
                        <option>Perjalanan Dinas</option>
                    </select>
                </div>
                {workLocation === 'Bekerja di Pabrik' && (
                    <div>
                        <label htmlFor="workplace" className="block text-sm font-medium text-slate-700">Pilihan Tempat Kerja</label>
                        <select id="workplace" value={workplace} onChange={e => setWorkplace(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 rounded-md">
                            {WORKPLACES.map(wp => <option key={wp.name}>{wp.name}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Catatan/Alasan</label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md" />
                </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-400 py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-slate-500">Batal</button>
                    <button type="button" onClick={handleSubmit} disabled={isActionDisabled} className={`py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${actionType === 'in' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} disabled:bg-slate-300 disabled:cursor-not-allowed`}>
                        {isSubmitting ? 'Memproses...' : title}
                    </button>
                </div>
            </div>
        </Modal>
    )
}