import React, { useState, useMemo } from 'react';
import { Presensi, JadwalKerja, UserProfile, ShiftConfig, UsulanPembetulanPresensi, UsulanStatus } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './Icons';
import { PresensiDetailModal } from './PresensiDetailModal';

const formatDateForSupabase = (dateStr: string): string => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
};

export const PresensiHistoryView: React.FC<{ 
    presensiHistory: Presensi[], 
    schedules: JadwalKerja[], 
    employee: UserProfile,
    shiftConfigs: ShiftConfig[],
    loggedInUser: UserProfile,
    pembetulanHistory: UsulanPembetulanPresensi[],
}> = ({ presensiHistory, schedules, employee, shiftConfigs, loggedInUser, pembetulanHistory }) => {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // Nov 2025

    const [viewingPresensi, setViewingPresensi] = useState<{ 
        employee: UserProfile; 
        presensi: Presensi | undefined; 
        schedule: JadwalKerja | undefined; 
        shiftInfo: ShiftConfig | undefined 
    } | null>(null);

    const shiftMap = useMemo(() => {
        const map = new Map<string, ShiftConfig>();
        shiftConfigs.forEach(sc => map.set(sc.code, sc));
        return map;
    }, [shiftConfigs]);


    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = `${String(i).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
            
            const schedule = schedules.find(s => s.tanggal === dateString);
            let presensi = presensiHistory.find(p => p.tanggal === dateString);

            // Merge with approved corrections
            const approvedCorrections = pembetulanHistory.filter(p => 
                p.tanggalPembetulan === formatDateForSupabase(dateString) &&
                p.status === UsulanStatus.Disetujui
            );

            if (approvedCorrections.length > 0) {
                let finalPresensi = presensi ? { ...presensi } : { id: `corrected-${employee.nik}-${dateString}`, nik: employee.nik, nama: employee.name, tanggal: dateString, shift: schedule?.shift || 'OFF' };

                const inCorrection = approvedCorrections.find(c => c.clockType === 'in');
                if (inCorrection) {
                    const newTimestamp = new Date(`${inCorrection.tanggalPembetulan}T${inCorrection.jamPembetulan}`);
                    finalPresensi.clockInTimestamp = { toDate: () => newTimestamp };
                }

                const outCorrection = approvedCorrections.find(c => c.clockType === 'out');
                if (outCorrection) {
                    const newTimestamp = new Date(`${outCorrection.tanggalPembetulan}T${outCorrection.jamPembetulan}`);
                    finalPresensi.clockOutTimestamp = { toDate: () => newTimestamp };
                }
                presensi = finalPresensi;
            }


            days.push({ date, schedule, presensi });
        }
        return days;

    }, [currentDate, schedules, presensiHistory, pembetulanHistory, employee]);

    const formatTime = (timestamp: any): string => {
        if (!timestamp || !timestamp.toDate) return '--:--';
        return timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const handleRowClick = (data: { presensi?: Presensi, schedule?: JadwalKerja }) => {
        const shiftInfo = data.schedule ? shiftMap.get(data.schedule.shift) : undefined;
        setViewingPresensi({
            employee,
            presensi: data.presensi,
            schedule: data.schedule,
            shiftInfo,
        });
    };

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    return (
        <div className="bg-white rounded-lg shadow-md">
            <header className="bg-red-700 text-white p-4 rounded-t-lg flex justify-between items-center">
                <button onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya"><ChevronLeftIcon /></button>
                <div className="text-center">
                    <button className="font-semibold bg-white text-red-700 px-4 py-1 rounded-md shadow-sm">
                        {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                        <CalendarIcon className="w-4 h-4 inline-block ml-2"/>
                    </button>
                </div>
                <button onClick={() => changeMonth(1)} aria-label="Bulan berikutnya"><ChevronRightIcon /></button>
            </header>
            <div className="p-0 sm:p-4">
                <div className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b">
                        <p className="font-bold text-slate-800">{employee.nik}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{employee.name}</h3>
                    </div>
                    <ul className="divide-y divide-slate-200">
                       {monthData.map(({ date, schedule, presensi }, index) => {
                            const isOffDay = schedule?.shift === 'OFF' || [0, 6].includes(date.getDay());
                            return (
                                <li key={index} onClick={() => handleRowClick({ presensi, schedule })} className={`flex flex-wrap items-center p-4 cursor-pointer hover:bg-slate-50 ${isOffDay && !presensi ? 'bg-red-50' : 'bg-white'}`}>
                                    <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                                        <p className={`font-bold text-xs uppercase ${isOffDay ? 'text-red-500' : 'text-slate-500'}`}>
                                            {schedule?.shift || (isOffDay ? 'OFF' : '---')}
                                        </p>
                                        <p className="font-semibold text-slate-800">{dayNames[date.getDay()]}</p>
                                        <p className="text-sm text-slate-600">{date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                    </div>
                                    <div className="w-full sm:w-2/3 flex justify-between items-center">
                                        <div className="text-sm">
                                            <p className="text-slate-500 text-xs">{presensi?.clockInWorkLocationType || ''}</p>
                                            <div className="flex flex-col">
                                                <p className="font-semibold">
                                                    <span className={`${presensi?.clockInTimestamp ? 'text-green-600' : 'text-slate-400'}`}>{formatTime(presensi?.clockInTimestamp)}</span>
                                                    <span className="text-slate-400 text-xs"> WIB</span>
                                                </p>
                                                <p className="font-semibold">
                                                    <span className={`${presensi?.clockOutTimestamp ? 'text-red-600' : 'text-slate-400'}`}>{formatTime(presensi?.clockOutTimestamp)}</span>
                                                    <span className="text-slate-400 text-xs"> WIB</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-xl ${presensi?.totalHours != null ? 'text-slate-800' : 'text-slate-400'}`}>
                                                {presensi?.totalHours != null ? presensi.totalHours.toFixed(1) : '--.-'}
                                            </p>
                                            <p className="text-sm text-slate-500">Jam</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            {viewingPresensi && (
                <PresensiDetailModal
                    isOpen={!!viewingPresensi}
                    onClose={() => setViewingPresensi(null)}
                    data={viewingPresensi}
                    loggedInUser={loggedInUser}
                    pembetulanHistory={pembetulanHistory}
                />
            )}
        </div>
    );
};