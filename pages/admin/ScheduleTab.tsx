import React from 'react';
import { JadwalKerja } from '../../types';
import { PlusCircleIcon } from '../../components/Icons';

export const ScheduleTab: React.FC<{schedules: JadwalKerja[], onAddSchedule: () => void}> = ({schedules, onAddSchedule}) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Jadwal Kerja Pegawai</h2>
            <button onClick={onAddSchedule} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                <PlusCircleIcon className="w-5 h-5"/>
                <span>Tambah Jadwal</span>
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">NIK</th>
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">Seksi</th>
                        <th className="px-4 py-3">Shift</th>
                    </tr>
                </thead>
                <tbody>
                    {schedules.map(s => (
                        <tr key={s.id} className="border-b hover:bg-slate-50">
                            <td className="px-4 py-3">{s.tanggal}</td>
                            <td className="px-4 py-3">{s.nik}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{s.nama}</td>
                            <td className="px-4 py-3">{s.seksi}</td>
                            <td className="px-4 py-3">{s.shift}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
