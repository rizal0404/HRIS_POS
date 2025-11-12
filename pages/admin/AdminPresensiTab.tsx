import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserProfile, Presensi, JadwalKerja, ShiftConfig, UsulanPembetulanPresensi, UsulanStatus } from '../../types';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { PresensiDetailModal } from '../../components/PresensiDetailModal';

// Helper function to format time from Firestore Timestamp
const formatTime = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return '--:--';
    return timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// Date Scroller Component
const DateScroller: React.FC<{
    currentMonth: Date;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    onMonthChange: (amount: number) => void;
}> = ({ currentMonth, selectedDate, onDateSelect, onMonthChange }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const selectedDateRef = useRef<HTMLButtonElement>(null);

    const daysInMonth = useMemo(() => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const days = [];
        while (date.getMonth() === currentMonth.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentMonth]);

    useEffect(() => {
        if (selectedDateRef.current) {
            selectedDateRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [selectedDate]);

    return (
        <div className="bg-red-600 text-white rounded-b-lg shadow-md">
            <div className="flex justify-between items-center px-4 py-2">
                <button onClick={() => onMonthChange(-1)} aria-label="Bulan sebelumnya" className="p-2 rounded-full hover:bg-red-700">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <button className="font-semibold bg-white text-red-700 px-4 py-1.5 rounded-full shadow-sm text-sm flex items-center gap-2">
                        <span>{currentMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</span>
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                </div>
                <button onClick={() => onMonthChange(1)} aria-label="Bulan berikutnya" className="p-2 rounded-full hover:bg-red-700">
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>
            <div ref={scrollContainerRef} className="flex overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-red-400 scrollbar-track-red-700">
                {daysInMonth.map(day => {
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    return (
                        <button
                            key={day.toISOString()}
                            ref={isSelected ? selectedDateRef : null}
                            onClick={() => onDateSelect(day)}
                            className={`flex-shrink-0 text-center p-3 rounded-md w-16 transition-colors ${isSelected ? 'bg-red-700' : 'hover:bg-red-500'}`}
                        >
                            <span className="text-xs uppercase">{day.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                            <span className={`block text-lg font-bold mt-1 relative ${isSelected ? 'after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-1 after:bg-white after:rounded-full' : ''}`}>
                                {day.getDate()}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


// Main Component
export const AdminPresensiTab: React.FC<{ allPresensi: Presensi[], schedules: JadwalKerja[], employees: UserProfile[], shiftConfigs: ShiftConfig[], loggedInUser: UserProfile, allPembetulanPresensi: UsulanPembetulanPresensi[] }> = ({ allPresensi, schedules, employees, shiftConfigs, loggedInUser, allPembetulanPresensi }) => {
    const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
    const [teamFilter, setTeamFilter] = useState('all');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const [viewingPresensi, setViewingPresensi] = useState<{ employee: UserProfile; presensi: Presensi | undefined; schedule: JadwalKerja | undefined; shiftInfo: ShiftConfig | undefined } | null>(null);

    const handleScroll = () => {
        if (mainContentRef.current) {
            if (mainContentRef.current.scrollTop > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        }
    };
    
    const scrollToTop = () => {
        mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const shiftMap = useMemo(() => {
        const map = new Map<string, ShiftConfig>();
        shiftConfigs.forEach(sc => map.set(sc.code, sc));
        return map;
    }, [shiftConfigs]);

    const dailyData = useMemo(() => {
        const selectedDateString = selectedDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const selectedDateYYYYMMDD = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        
        return employees
            .filter(employee => teamFilter === 'all' || employee.nik === teamFilter)
            .map(employee => {
                const schedule = schedules.find(s => s.nik === employee.nik && s.tanggal === selectedDateString);
                let presensiRecord = allPresensi.find(p => p.nik === employee.nik && p.tanggal === selectedDateString);
                const shiftInfo = schedule ? shiftMap.get(schedule.shift) : shiftMap.get('OFF');

                // Merge with approved corrections
                const approvedCorrections = allPembetulanPresensi.filter(p => 
                    p.nik === employee.nik &&
                    p.tanggalPembetulan === selectedDateYYYYMMDD &&
                    p.status === UsulanStatus.Disetujui
                );

                if (approvedCorrections.length > 0) {
                    let finalPresensi = presensiRecord ? { ...presensiRecord } : { id: `corrected-${employee.nik}-${selectedDateString}`, nik: employee.nik, nama: employee.name, tanggal: selectedDateString, shift: schedule?.shift || 'OFF' };

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
                    presensiRecord = finalPresensi;
                }

                return {
                    employee,
                    schedule,
                    presensi: presensiRecord,
                    shiftInfo
                };
            }).sort((a,b) => {
                const aShift = a.schedule?.shift || 'z';
                const bShift = b.schedule?.shift || 'z';
                if(aShift < bShift) return -1;
                if(aShift > bShift) return 1;
                return (a.employee.name || '').localeCompare(b.employee.name || '');
            });

    }, [selectedDate, employees, schedules, allPresensi, shiftMap, teamFilter, allPembetulanPresensi]);
    
    const handleMonthChange = (amount: number) => {
        setSelectedDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            const newMonthDays = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
            if (newDate.getDate() > newMonthDays) {
                newDate.setDate(newMonthDays);
            }
            return newDate;
        });
    };

    return (
        <div className="flex flex-col -m-4 sm:-m-6 lg:-m-8 bg-slate-100" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="bg-white p-4 rounded-t-lg shadow-md z-10 sticky top-0">
                <label htmlFor="team-filter" className="block text-sm font-medium text-slate-700">Tim/Bawahan</label>
                <select 
                    id="team-filter"
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                >
                    <option value="all">Semua Bawahan Sampai N+2</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.nik}>{emp.name}</option>
                    ))}
                </select>
            </div>
            
            <DateScroller
                currentMonth={selectedDate}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onMonthChange={handleMonthChange}
            />

            <div className="p-4 flex-grow overflow-y-auto" ref={mainContentRef} onScroll={handleScroll}>
                 <div className="bg-white rounded-lg shadow-md">
                     <div className="p-4 border-b">
                        <h3 className="font-bold text-slate-800">{selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                    </div>
                    <ul className="divide-y divide-slate-200">
                        {dailyData.length > 0 ? dailyData.map(data => {
                            const { employee, schedule, presensi, shiftInfo } = data;
                            return (
                             <li key={employee.id} onClick={() => setViewingPresensi(data)} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer">
                                <div className="flex items-center gap-4">
                                     <span className={`w-12 text-center text-xs font-bold p-2 rounded-md ${shiftInfo?.color || 'bg-slate-100 text-slate-800'}`}>
                                        {schedule?.shift || 'OFF'}
                                    </span>
                                    <div>
                                        <p className="text-xs text-slate-500">{employee.nik}</p>
                                        <p className="font-bold text-slate-900">{employee.name}</p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right w-full sm:w-auto pl-16 sm:pl-0">
                                    <p className="text-xs text-slate-500">{presensi?.clockInWorkLocationType || (presensi ? 'Presensi Tercatat' : 'Tidak Ada Presensi')}</p>
                                    <div className="text-sm">
                                        <span className={`${presensi?.clockInTimestamp ? 'text-green-600 font-semibold' : 'text-slate-400'}`}>
                                            {formatTime(presensi?.clockInTimestamp)}
                                        </span>
                                        <span className="text-xs text-slate-400"> WIB</span>
                                    </div>
                                    <div className="text-sm">
                                         <span className={`${presensi?.clockOutTimestamp ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                                            {formatTime(presensi?.clockOutTimestamp)}
                                        </span>
                                        <span className="text-xs text-slate-400"> WIB</span>
                                    </div>
                                </div>
                            </li>
                        )}) : (
                            <li className="p-8 text-center text-slate-500">Tidak ada data jadwal untuk ditampilkan.</li>
                        )}
                    </ul>
                </div>
            </div>
            
            {showScrollTop && (
                <button onClick={scrollToTop} className="absolute bottom-8 right-8 bg-slate-800 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-900 transition-colors z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                </button>
            )}

            {viewingPresensi && (
                <PresensiDetailModal
                    isOpen={!!viewingPresensi}
                    onClose={() => setViewingPresensi(null)}
                    data={viewingPresensi}
                    loggedInUser={loggedInUser}
                    pembetulanHistory={allPembetulanPresensi}
                />
            )}
        </div>
    );
};