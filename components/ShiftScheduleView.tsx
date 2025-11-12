import React, { useState, useMemo } from 'react';
import { JadwalKerja, UserProfile, ShiftConfig, Seksi, UnitKerja } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, UploadIcon, FilterXIcon } from './Icons';
import Modal from './Modal';
import { apiService } from '../services/apiService';

const ShiftChangeModal: React.FC<{isOpen: boolean, onClose: () => void, cellData: {nik:string, name:string, date:Date}, shiftConfigs: ShiftConfig[], onSave: (nik: string, date: Date, shiftCode: string) => void}> = ({isOpen, onClose, cellData, shiftConfigs, onSave}) => {
    
    const shiftModalGroups = useMemo(() => {
        const groups: Record<string, ShiftConfig[]> = {};
        shiftConfigs.forEach(shift => {
            if (!groups[shift.group]) {
                groups[shift.group] = [];
            }
            groups[shift.group].push(shift);
        });
        return Object.entries(groups).map(([name, shifts]) => ({ name, shifts: shifts.sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [shiftConfigs]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Jadwal Shift">
            <div className="p-2">
                <div className="mb-4 text-sm">
                    <p><span className="font-semibold">Karyawan:</span> {cellData.nik}</p>
                    <p className="font-bold text-lg">{cellData.name}</p>
                    <p className="mt-2"><span className="font-semibold">Hari, Tanggal:</span></p>
                    <p className="font-bold text-lg">{cellData.date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {shiftModalGroups.map(group => (
                        <div key={group.name}>
                            <h4 className="font-semibold text-sm mb-2 relative text-center">
                                <span className="bg-white px-2 z-10 relative">{group.name}</span>
                                <span className="absolute left-0 top-1/2 w-full h-px bg-gray-300"></span>
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {group.shifts.map(shift => (
                                     <button key={shift.code} onClick={() => onSave(cellData.nik, cellData.date, shift.code)} className={`p-2 rounded-md text-sm font-semibold transition-transform duration-150 hover:scale-105 ${shift.color}`}>
                                         <div>{shift.name || shift.code}</div>
                                         {shift.time && <div className="text-xs font-normal">{shift.time}</div>}
                                     </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-6">
                    <button onClick={onClose} className="bg-gray-500 text-white py-2 px-8 rounded-md shadow-sm text-sm font-medium hover:bg-gray-600">
                        Kembali
                    </button>
                </div>
            </div>
        </Modal>
    );
}

const UploadScheduleModal: React.FC<{ isOpen: boolean, onClose: () => void, onSuccess: () => void, currentDate: Date }> = ({ isOpen, onClose, onSuccess, currentDate }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].type === 'text/csv' || e.target.files[0].name.endsWith('.csv')) {
                setFile(e.target.files[0]);
                setError('');
            } else {
                setFile(null);
                setError('Hanya file format .csv yang diizinkan.');
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Silakan pilih file CSV untuk diunggah.");
            return;
        }
        setIsUploading(true);
        setError('');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csvText = event.target?.result as string;
                const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    throw new Error("File CSV kosong atau hanya berisi header.");
                }

                const headers = lines[0].split(',').map(h => h.trim());
                const schedulesToUpsert: Omit<JadwalKerja, 'id' | 'nama' | 'seksi'>[] = [];
                
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const nik = values[0];
                    if (!nik) continue; // Skip empty rows

                    for (let j = 2; j < headers.length; j++) {
                        const day = parseInt(headers[j], 10);
                        const shift = values[j];
                        if (!isNaN(day) && shift) {
                            const tanggal = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                            schedulesToUpsert.push({ nik, tanggal, shift });
                        }
                    }
                }
                
                if(schedulesToUpsert.length === 0) {
                    throw new Error("Tidak ada data jadwal valid yang ditemukan dalam file CSV.");
                }

                const promises = schedulesToUpsert.map(schedule => apiService.upsertJadwal(schedule));
                await Promise.all(promises);

                onSuccess();

            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Gagal memproses file. Pastikan formatnya benar.");
            } finally {
                setIsUploading(false);
            }
        };

        reader.onerror = () => {
             setError("Gagal membaca file.");
             setIsUploading(false);
        }

        reader.readAsText(file);
    };


    return (
         <Modal isOpen={isOpen} onClose={onClose} title="Upload Jadwal Shift (CSV)">
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-slate-600">
                        Unggah file CSV untuk memperbarui jadwal shift. File harus memiliki format:
                    </p>
                    <code className="mt-2 block text-xs bg-slate-100 p-2 rounded">
                        nik,nama,1,2,3,...,31
                        <br/>
                        00001234,"John Doe",1T13,1T13,OFF,...
                    </code>
                     <p className="text-sm text-slate-600 mt-2">
                        Kolom 'nama' hanya untuk referensi dan tidak akan diproses. Jadwal akan diperbarui untuk bulan dan tahun yang sedang ditampilkan.
                    </p>
                </div>
                <div 
                    className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="text-center">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600">
                            <label htmlFor="schedule-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500">
                                <span>Pilih file</span>
                                <input id="schedule-upload" name="schedule-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} ref={fileInputRef}/>
                            </label>
                            <p className="pl-1">atau tarik dan lepas</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">Hanya file .csv</p>
                    </div>
                </div>
                 {file && <p className="text-sm text-slate-700 font-medium">File terpilih: {file.name}</p>}
                 {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                    <button type="button" onClick={handleUpload} disabled={isUploading || !file} className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">{isUploading ? 'Mengunggah...' : 'Unggah & Proses'}</button>
                </div>
            </div>
        </Modal>
    );
};


export const ShiftScheduleView: React.FC<{
    schedules: JadwalKerja[], 
    employees: UserProfile[], 
    shiftConfigs: ShiftConfig[],
    showAdminControls?: boolean,
    onDataChange?: () => void,
    allSeksi?: Seksi[],
    allUnitKerja?: UnitKerja[],
}> = ({schedules, employees, shiftConfigs, showAdminControls = false, onDataChange = () => {}, allSeksi, allUnitKerja}) => {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // Default to Nov 2025
    const [selectedCell, setSelectedCell] = useState<{nik: string, name: string, date: Date} | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [seksiFilter, setSeksiFilter] = useState('all');
    const [unitKerjaFilter, setUnitKerjaFilter] = useState('all');

    const filteredEmployees = useMemo(() => {
        return employees.filter(employee => {
            const seksiMatch = seksiFilter === 'all' || employee.seksi === seksiFilter;
            const unitKerjaMatch = unitKerjaFilter === 'all' || employee.unitKerja === unitKerjaFilter;
            return seksiMatch && unitKerjaMatch;
        });
    }, [employees, seksiFilter, unitKerjaFilter]);

    const shiftMap = useMemo(() => {
        const map: Record<string, ShiftConfig> = {};
        shiftConfigs.forEach(sc => {
            map[sc.code] = sc;
        });
        return map;
    }, [shiftConfigs]);

    const scheduleMap = useMemo(() => {
        const map: Record<string, Record<number, JadwalKerja>> = {};
        schedules.forEach(schedule => {
            const [day, month, year] = schedule.tanggal.split('/').map(Number);
            if (year === currentDate.getFullYear() && month === currentDate.getMonth() + 1) {
                if (!map[schedule.nik]) {
                    map[schedule.nik] = {};
                }
                map[schedule.nik][day] = schedule;
            }
        });
        return map;
    }, [schedules, currentDate]);
    
    const { year, monthName, dayHeaders } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = currentDate.toLocaleString('id-ID', { month: 'long' });
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(year, month, i + 1);
            return {
                date: i + 1,
                dayName: dayNames[date.getDay()],
            }
        });
        return { year, monthName, dayHeaders };
    }, [currentDate]);

    const handleCellClick = (employee: UserProfile, day: number) => {
        if (!showAdminControls) return;
        setSelectedCell({
            nik: employee.nik,
            name: employee.name,
            date: new Date(year, currentDate.getMonth(), day)
        });
    }

    const handleModalClose = () => {
        setSelectedCell(null);
    }

    const handleShiftSave = async (nik: string, date: Date, shiftCode: string) => {
        const tanggal = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        await apiService.upsertJadwal({ nik, tanggal, shift: shiftCode });
        onDataChange();
        handleModalClose();
    }

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    }

    const handleDownloadCSV = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
    
        const headers = ['nik', 'nama'];
        for (let i = 1; i <= daysInMonth; i++) {
            headers.push(String(i));
        }
    
        const rows = filteredEmployees.map(employee => {
            const row = [employee.nik, `"${employee.name}"`]; // Enclose name in quotes in case it has commas
            for (let i = 1; i <= daysInMonth; i++) {
                const schedule = scheduleMap[employee.nik]?.[i];
                row.push(schedule?.shift || 'OFF');
            }
            return row.join(',');
        });
    
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `jadwal_shift_${monthName}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center p-4 bg-red-700 text-white rounded-t-lg">
                <button onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeftIcon/></button>
                <h2 className="text-xl font-bold">{monthName} {year}</h2>
                <button onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRightIcon/></button>
            </div>
             {showAdminControls && (
                <div className="p-4 border-b flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 text-sm rounded-md hover:bg-green-700 transition">
                            <DownloadIcon className="w-4 h-4" />
                            <span>Download Jadwal</span>
                        </button>
                        <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 text-sm rounded-md hover:bg-orange-600 transition">
                            <UploadIcon className="w-4 h-4" />
                            <span>Upload Jadwal</span>
                        </button>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                         <select
                            value={seksiFilter}
                            onChange={e => setSeksiFilter(e.target.value)}
                            className="form-select text-sm rounded-md border-gray-300 shadow-sm w-full sm:w-auto"
                        >
                            <option value="all">Semua Seksi</option>
                            {allSeksi?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <select
                            value={unitKerjaFilter}
                            onChange={e => setUnitKerjaFilter(e.target.value)}
                            className="form-select text-sm rounded-md border-gray-300 shadow-sm w-full sm:w-auto"
                        >
                            <option value="all">Semua Unit Kerja</option>
                            {allUnitKerja?.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                        </select>
                        <button 
                            onClick={() => { setSeksiFilter('all'); setUnitKerjaFilter('all'); }} 
                            className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition w-full sm:w-auto justify-center"
                        >
                            <FilterXIcon className="w-4 h-4" />
                            <span>Clear</span>
                        </button>
                    </div>
                </div>
             )}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="sticky left-0 bg-gray-100 p-2 border text-xs font-semibold text-gray-600 w-48 z-10">Karyawan</th>
                            {dayHeaders.map(({ date, dayName }) => (
                                <th key={date} className="p-2 border text-xs font-semibold text-gray-600 min-w-[80px]">
                                    <div>{dayName}</div>
                                    <div>{date}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {filteredEmployees.map(employee => (
                            <tr key={employee.nik} className="hover:bg-gray-50">
                                <td className="sticky left-0 bg-white hover:bg-gray-50 p-2 border-r text-left text-sm font-semibold text-gray-800 z-10">
                                    <div className="font-bold">{employee.nik}</div>
                                    <div className="text-xs text-gray-600">{employee.name}</div>
                                </td>
                                {dayHeaders.map(({date}) => {
                                    const schedule = scheduleMap[employee.nik]?.[date];
                                    const shiftCode = schedule?.shift || 'OFF';
                                    const shiftInfo = shiftMap[shiftCode] || { time: '', color: 'bg-gray-100' };
                                    const cellColor = shiftInfo.color.includes('bg-white') ? `${shiftInfo.color} border-gray-300` : `${shiftInfo.color} border-transparent`;
                                    return (
                                        <td key={date} className={`p-1 border text-xs ${showAdminControls ? 'cursor-pointer' : ''} ${cellColor}`} onClick={() => handleCellClick(employee, date)}>
                                            <div className="font-bold">{shiftCode}</div>
                                            <div className="text-[10px]">{shiftInfo.time}</div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedCell && 
                <ShiftChangeModal 
                    isOpen={!!selectedCell}
                    onClose={handleModalClose}
                    cellData={selectedCell}
                    shiftConfigs={shiftConfigs}
                    onSave={handleShiftSave}
                />
            }
            {isUploadModalOpen && (
                <UploadScheduleModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={() => {
                        setIsUploadModalOpen(false);
                        onDataChange();
                    }}
                    currentDate={currentDate}
                />
            )}
        </div>
    );
};