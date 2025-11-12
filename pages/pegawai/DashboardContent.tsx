import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, JadwalKerja, Usulan, Presensi, UsulanStatus } from '../../types';
import { ClockIcon } from '../../components/Icons';

const AttendanceCard: React.FC<{
    onAttend: (action: 'in' | 'out') => void, 
    jadwal: JadwalKerja[],
    todayPresensi: Presensi | undefined
}> = ({ onAttend, jadwal, todayPresensi }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const today = currentTime;
    
    const todaySchedule = useMemo(() => {
        const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        return jadwal.find(j => j.tanggal === todayStr);
    }, [jadwal, today]);
    
    const formatTimestamp = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return '--:--:--';
        return timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const hasClockedIn = !!todayPresensi?.clockInTimestamp;
    const hasClockedOut = !!todayPresensi?.clockOutTimestamp;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Hari ini untuk dilakukan</h2>
            <div className="flex flex-col items-center gap-6">
                <div className="w-full flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex items-center gap-4">
                        <ClockIcon className="h-8 w-8 text-slate-400"/>
                        <div>
                            <p className="font-semibold text-slate-800">{currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} <span className="font-bold text-red-600">{todaySchedule?.shift || 'OFF'}</span></p>
                            <p className="text-slate-500">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</p>
                        </div>
                    </div>
                    <div className="flex-grow flex items-center gap-4 w-full sm:w-auto">
                        <button 
                            onClick={() => onAttend('in')} 
                            disabled={hasClockedIn}
                            className="flex-1 bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition shadow-sm disabled:bg-green-300 disabled:cursor-not-allowed"
                        >
                            In
                        </button>
                        <button 
                            onClick={() => onAttend('out')} 
                            disabled={!hasClockedIn || hasClockedOut}
                            className="flex-1 bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition shadow-sm disabled:bg-red-300 disabled:cursor-not-allowed"
                        >
                            Out
                        </button>
                    </div>
                </div>
                {(todayPresensi?.clockInTimestamp || todayPresensi?.clockOutTimestamp) && (
                     <div className="w-full border-t border-slate-200 pt-4 flex justify-around text-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Check-In</p>
                            <p className="text-lg font-bold text-green-600">{formatTimestamp(todayPresensi?.clockInTimestamp)}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium text-slate-500">Check-Out</p>
                            <p className="text-lg font-bold text-red-600">{formatTimestamp(todayPresensi?.clockOutTimestamp)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const DashboardContent: React.FC<{
    user: UserProfile,
    onAttend: (action: 'in' | 'out') => void,
    jadwal: JadwalKerja[],
    todayPresensi: Presensi | undefined,
    usulan: Usulan[],
}> = ({ user, onAttend, jadwal, todayPresensi, usulan }) => {

    const ajuanDalamProses = useMemo(() => usulan.filter(u => u.status === UsulanStatus.Diajukan).length, [usulan]);
    const ajuanSelesai = useMemo(() => usulan.filter(u => u.status === UsulanStatus.Disetujui).length, [usulan]);
    const ajuanDitolakRevisi = useMemo(() => usulan.filter(u => u.status === UsulanStatus.Ditolak || u.status === UsulanStatus.Revisi).length, [usulan]);

    return (
        <div className="space-y-6">
            <div className="bg-red-600 text-white p-6 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold">Halo 👋, {user.name}</h1>
                <p className="mt-1 opacity-90">Selamat datang di dasbor Anda.</p>
            </div>

             <div className="grid grid-cols-3 gap-4">
                 <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <p className="text-xs text-slate-500">Ajuan Karyawan Dalam Proses</p>
                    <p className="text-2xl font-bold text-slate-800">{ajuanDalamProses}</p>
                    <p className="text-xs text-slate-500">Dalam Proses</p>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-md text-center border-2 border-green-400">
                    <p className="text-xs text-slate-500">Ajuan Karyawan - Baru Selesai Diproses</p>
                    <p className="text-2xl font-bold text-green-600">{ajuanSelesai}</p>
                    <p className="text-xs text-slate-500">Baru Selesai Diproses</p>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <p className="text-xs text-slate-500">Ajuan Yang Ditolak / Revisi</p>
                    <p className="text-2xl font-bold text-red-600">{ajuanDitolakRevisi}</p>
                    <p className="text-xs text-slate-500">Total Ditolak/Revisi</p>
                </div>
            </div>

            <AttendanceCard onAttend={onAttend} jadwal={jadwal} todayPresensi={todayPresensi} />

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-4">
                    <ClockIcon className="w-8 h-8 text-slate-400" />
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-1">Timesheet</h2>
                        <p className="text-slate-600">Jangan lupa untuk mencatatkan kegiatan harian Anda!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
