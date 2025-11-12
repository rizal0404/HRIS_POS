import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import Modal from './Modal';
import { UserProfile, Presensi, JadwalKerja, ShiftConfig, UsulanPembetulanPresensi, UsulanStatus } from '../types';
import { PembetulanPresensiModal } from './PembetulanPresensiModal';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons for the map
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Component to dynamically adjust map view
const MapBounds: React.FC<{ clockIn: L.LatLngTuple | null, clockOut: L.LatLngTuple | null }> = ({ clockIn, clockOut }) => {
    const map = useMap();
    useEffect(() => {
        const markers = [clockIn, clockOut].filter((p): p is L.LatLngTuple => p !== null);
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else {
            map.setView([-4.819, 119.640], 13); // Default view if no coords
        }
    }, [clockIn, clockOut, map]);
    return null;
};

// Helper to format timestamp
const formatFullTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
};

// Helper to get status badge styles
const getStatusBadge = (status: UsulanStatus) => {
    switch (status) {
        case UsulanStatus.Disetujui: return 'bg-green-100 text-green-800';
        case UsulanStatus.Ditolak: return 'bg-red-100 text-red-800';
        case UsulanStatus.Revisi: return 'bg-orange-100 text-orange-800';
        case UsulanStatus.Diajukan:
        default: return 'bg-yellow-100 text-yellow-800';
    }
};

const formatDateForInput = (dateStr: string) => { // DD/MM/YYYY to YYYY-MM-DD
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
};


interface PresensiDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        employee: UserProfile;
        presensi: Presensi | undefined;
        schedule: JadwalKerja | undefined;
        shiftInfo: ShiftConfig | undefined;
    };
    loggedInUser: UserProfile;
    pembetulanHistory?: UsulanPembetulanPresensi[];
}

export const PresensiDetailModal: React.FC<PresensiDetailModalProps> = ({ isOpen, onClose, data, loggedInUser, pembetulanHistory = [] }) => {
    const [pembetulanModalOpen, setPembetulanModalOpen] = useState(false);
    const [pembetulanType, setPembetulanType] = useState<'in' | 'out'>('in');

    if (!isOpen) return null;
    const { employee, presensi, schedule, shiftInfo } = data;

    const dateYYYYMMDD = formatDateForInput(presensi?.tanggal || schedule?.tanggal || '');
    const relevantCorrections = pembetulanHistory.filter(p => p.tanggalPembetulan === dateYYYYMMDD && p.nik === employee.nik);
    
    const inCorrection = relevantCorrections.find(c => c.clockType === 'in');
    const outCorrection = relevantCorrections.find(c => c.clockType === 'out');

    const handleCorrectionClick = (type: 'in' | 'out') => {
        const presensiDateStr = presensi?.tanggal || schedule?.tanggal;
        if (!presensiDateStr) {
            alert('Tanggal presensi tidak valid.');
            return;
        }

        const [day, month, year] = presensiDateStr.split('/').map(Number);
        const presensiDate = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let workingDaysAgo = 0;
        let checkDate = new Date(today);
        let limitDate = new Date(today);
        
        while (workingDaysAgo < 3 && checkDate > new Date(2000, 0, 1)) {
            const dayOfWeek = checkDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
                workingDaysAgo++;
            }
            if (workingDaysAgo < 3) {
                 checkDate.setDate(checkDate.getDate() - 1);
            }
        }
        limitDate = checkDate;
        
        if (presensiDate < limitDate) {
            alert('Pengajuan pembetulan hanya bisa untuk 3 hari kerja terakhir.');
            return;
        }
        
        setPembetulanType(type);
        setPembetulanModalOpen(true);
    };

    const clockInPos: L.LatLngTuple | null = (presensi && typeof presensi.clockInLatitude === 'number' && typeof presensi.clockInLongitude === 'number')
        ? [presensi.clockInLatitude, presensi.clockInLongitude]
        : null;

    const clockOutPos: L.LatLngTuple | null = (presensi && typeof presensi.clockOutLatitude === 'number' && typeof presensi.clockOutLongitude === 'number')
        ? [presensi.clockOutLatitude, presensi.clockOutLongitude]
        : null;

    const date = presensi?.clockInTimestamp?.toDate() || (schedule?.tanggal ? new Date(schedule.tanggal.split('/').reverse().join('-') + 'T00:00:00') : new Date());
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                        <h3 className="text-xl font-semibold text-slate-800">Presensi Tim/Bawahan</h3>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800" aria-label="Tutup modal">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Employee Info */}
                        <div className="space-y-1">
                            <div>
                                <p className="text-sm text-slate-500">Karyawan</p>
                                <p className="font-bold text-slate-800">{employee.nik}</p>
                                <p className="text-lg font-bold text-slate-900">{employee.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Hari, Tanggal</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800">
                                        {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${shiftInfo?.color || 'bg-slate-200'}`}>{schedule?.shift || 'OFF'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="h-64 w-full rounded-lg overflow-hidden bg-slate-200">
                            <MapContainer center={[-4.819, 119.640]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {clockInPos && <Marker position={clockInPos} icon={greenIcon}><Popup>Lokasi Clock-In</Popup></Marker>}
                                {clockOutPos && <Marker position={clockOutPos} icon={redIcon}><Popup>Lokasi Clock-Out</Popup></Marker>}
                                <MapBounds clockIn={clockInPos} clockOut={clockOutPos} />
                            </MapContainer>
                        </div>

                        {/* Clock Details */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                            <div onClick={() => handleCorrectionClick('in')} className="cursor-pointer p-2 -m-2 rounded-lg hover:bg-slate-200 transition-colors">
                                {presensi?.clockInTimestamp ? (
                                    <div>
                                        <p className="font-bold text-green-600">In</p>
                                        <p className="text-sm font-semibold">{formatFullTimestamp(presensi.clockInTimestamp)}</p>
                                        <p className="text-xs text-slate-600">{presensi.clockInWorkLocationType} - {presensi.clockInWorkplace || 'Lokasi tidak spesifik'}</p>
                                        <p className="text-xs text-slate-500">Kalabbirang, Pangkajene dan Kepulauan, Sulawesi Selatan, Sulawesi, Indonesia</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold text-slate-400">In</p>
                                        <p className="text-sm text-slate-500">Tidak ada data clock-in</p>
                                    </div>
                                )}
                                {inCorrection && (
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(inCorrection.status)}`}>
                                            Ajuan: {inCorrection.status} ({inCorrection.jamPembetulan})
                                        </span>
                                    </div>
                                )}
                            </div>
                        
                            <hr/>

                            <div onClick={() => handleCorrectionClick('out')} className="cursor-pointer p-2 -m-2 rounded-lg hover:bg-slate-200 transition-colors">
                                {presensi?.clockOutTimestamp ? (
                                    <div>
                                        <p className="font-bold text-red-600">Out</p>
                                        <p className="text-sm font-semibold">{formatFullTimestamp(presensi.clockOutTimestamp)}</p>
                                        <p className="text-xs text-slate-600">{presensi.clockOutWorkLocationType} - {presensi.clockOutWorkplace || 'Lokasi tidak spesifik'}</p>
                                        <p className="text-xs text-slate-500">Kalabbirang, Pangkajene dan Kepulauan, Sulawesi Selatan, Sulawesi, Indonesia</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold text-slate-400">Out</p>
                                        <p className="text-sm text-slate-500">Tidak ada data clock-out</p>
                                    </div>
                                )}
                                {outCorrection && (
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(outCorrection.status)}`}>
                                            Ajuan: {outCorrection.status} ({outCorrection.jamPembetulan})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-center">
                        <button onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-8 rounded-md hover:bg-gray-600 transition-colors">
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
            {pembetulanModalOpen && (
                <PembetulanPresensiModal
                    isOpen={pembetulanModalOpen}
                    onClose={() => setPembetulanModalOpen(false)}
                    onSuccess={() => {
                        setPembetulanModalOpen(false);
                        onClose(); // Close parent modal too for refresh
                    }}
                    presensiData={data}
                    clockType={pembetulanType}
                    loggedInUser={loggedInUser}
                />
            )}
        </>
    );
};