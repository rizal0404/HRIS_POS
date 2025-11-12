import React, { useState, useMemo } from 'react';
import { UserProfile, UsulanLembur, UsulanStatus } from '../../types';

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

interface RekapLemburBawahanTabProps {
    employees: UserProfile[];
    allLembur: UsulanLembur[];
}

export const RekapLemburBawahanTab: React.FC<RekapLemburBawahanTabProps> = ({ employees, allLembur }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const rekapData = useMemo(() => {
        const data = employees.map(employee => {
            const totalLembur = allLembur
                .filter(lembur => {
                    if (lembur.nik !== employee.nik || lembur.status !== UsulanStatus.Disetujui) {
                        return false;
                    }
                    const lemburDate = new Date(lembur.tanggalLembur + 'T00:00:00');
                    return lemburDate.getFullYear() === selectedYear && lemburDate.getMonth() === selectedMonth;
                })
                .reduce((total, lembur) => total + (lembur.jamLembur || 0), 0);

            return {
                nik: employee.nik,
                nama: employee.name,
                posisi: employee.posisi,
                seksi: employee.seksi,
                totalLembur: totalLembur,
            };
        });

        // Filter out employees with no overtime in the selected month
        return data.filter(d => d.totalLembur > 0).sort((a,b) => b.totalLembur - a.totalLembur);

    }, [employees, allLembur, selectedMonth, selectedYear]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <header className="bg-red-700 text-white p-4 -m-6 mb-6 rounded-t-lg">
                <h1 className="text-xl font-bold">Rekap Jam Lembur Bawahan</h1>
            </header>

            <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 items-center mb-4">
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="form-select rounded-md border-gray-300 shadow-sm">
                    {monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="form-select rounded-md border-gray-300 shadow-sm">
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-100 text-center font-bold">
                        <tr>
                            <th className="border border-gray-300 p-2 text-left">NIK</th>
                            <th className="border border-gray-300 p-2 text-left">Nama Karyawan</th>
                            <th className="border border-gray-300 p-2 text-left">Posisi</th>
                            <th className="border border-gray-300 p-2 text-left">Seksi</th>
                            <th className="border border-gray-300 p-2">Total Jam Lembur</th>
                        </tr>
                    </thead>
                    <tbody className="text-left">
                        {rekapData.length > 0 ? (
                            rekapData.map(row => (
                                <tr key={row.nik} className="even:bg-gray-50">
                                    <td className="border border-gray-300 p-2">{row.nik}</td>
                                    <td className="border border-gray-300 p-2 font-semibold">{row.nama}</td>
                                    <td className="border border-gray-300 p-2">{row.posisi}</td>
                                    <td className="border border-gray-300 p-2">{row.seksi}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{row.totalLembur.toFixed(2)} Jam</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center p-4 text-gray-500">
                                    Tidak ada data lembur untuk periode yang dipilih.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
