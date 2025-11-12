import React, { useState, useMemo } from 'react';
import { UserProfile, UsulanCuti, LeaveQuota, UsulanStatus } from '../../types';
import { SearchIcon, FilterXIcon, PrintIcon, XIcon } from '../../components/Icons';

// Helper to calculate leave days
const countLeaveDays = (startDateStr: string, endDateStr: string): number => {
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
};

// Helper to format date ranges for display
const formatMasaBerlaku = (start: string, end: string): string => {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return `${startDate.toLocaleDateString('id-ID', options)} s/d ${endDate.toLocaleDateString('id-ID', options)}`;
}

interface QuotaCutiBawahanTabProps {
    employees: UserProfile[];
    allCuti: UsulanCuti[];
    leaveQuotas: LeaveQuota[];
}

export const QuotaCutiBawahanTab: React.FC<QuotaCutiBawahanTabProps> = ({ employees, allCuti, leaveQuotas }) => {
    
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Aggregate data: calculate 'diambil' and 'sisa'
    const processedData = useMemo(() => {
        const currentYear = new Date().getFullYear();

        // Data from the leaveQuotas table (source of truth for Cuti Besar, etc.)
        const dataFromQuotas = leaveQuotas.map(quota => {
            const masaBerlakuStart = new Date(quota.masaBerlakuStart + 'T00:00:00');
            const masaBerlakuEnd = new Date(quota.masaBerlakuEnd + 'T00:00:00');

            const diambil = allCuti
                .filter(c => 
                    c.nik === quota.nik &&
                    c.jenisAjuan === quota.jenisCuti &&
                    c.status === UsulanStatus.Disetujui
                )
                .reduce((total, cuti) => {
                    const cutiStart = new Date(cuti.periode.startDate + 'T00:00:00');
                    if (cutiStart >= masaBerlakuStart && cutiStart <= masaBerlakuEnd) {
                        return total + countLeaveDays(cuti.periode.startDate, cuti.periode.endDate);
                    }
                    return total;
                }, 0);
            
            const sisa = quota.quota - diambil;
            
            return {
                ...quota,
                diambil,
                sisa
            };
        });

        // Generate 'Cuti Tahunan' from employee profiles for employees not in the main quota list for the current year's annual leave.
        const employeesWithAnnualQuotaInDB = new Set(
            leaveQuotas
                .filter(q => q.jenisCuti === 'Cuti Tahunan' && new Date(q.masaBerlakuStart).getFullYear() <= currentYear && new Date(q.masaBerlakuEnd).getFullYear() >= currentYear)
                .map(q => q.nik)
        );

        const generatedAnnualQuotas = employees
            .filter(emp => !employeesWithAnnualQuotaInDB.has(emp.nik) && emp.totalCutiTahunan > 0)
            .map(emp => {
                const diambil = allCuti
                    .filter(c =>
                        c.nik === emp.nik &&
                        c.jenisAjuan === 'Cuti Tahunan' &&
                        c.status === UsulanStatus.Disetujui &&
                        new Date(c.periode.startDate).getFullYear() === currentYear
                    )
                    .reduce((total, cuti) => total + countLeaveDays(cuti.periode.startDate, cuti.periode.endDate), 0);
                
                const sisa = emp.totalCutiTahunan - diambil;

                return {
                    id: `generated-tahunan-${emp.nik}-${currentYear}`,
                    nik: emp.nik,
                    namaKaryawan: emp.name,
                    jenisCuti: 'Cuti Tahunan' as 'Cuti Tahunan',
                    periode: String(currentYear),
                    masaBerlakuStart: `${currentYear}-01-01`,
                    masaBerlakuEnd: `${currentYear}-12-31`,
                    quota: emp.totalCutiTahunan,
                    diambil,
                    sisa
                };
            });

        return [...dataFromQuotas, ...generatedAnnualQuotas];
    }, [employees, allCuti, leaveQuotas]);


    // Filter data based on UI controls
    const filteredData = useMemo(() => {
        return processedData.filter(item => {
            if (employeeFilter !== 'all' && item.nik !== employeeFilter) return false;
            if (leaveTypeFilter !== 'all' && item.jenisCuti !== leaveTypeFilter) return false;

            const lowerSearch = searchTerm.toLowerCase();
            if (searchTerm && !item.namaKaryawan.toLowerCase().includes(lowerSearch)) return false;

            return true;
        });
    }, [processedData, employeeFilter, leaveTypeFilter, searchTerm]);
    
    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        return filteredData.slice(startIndex, startIndex + entriesPerPage);
    }, [filteredData, currentPage, entriesPerPage]);


    return (
        <div>
            <header className="bg-red-700 text-white p-4 rounded-t-lg flex items-center gap-4">
                <button className="p-1 rounded-full hover:bg-red-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Quota Cuti Bawahan</h1>
            </header>

            <div className="bg-white p-6 rounded-b-lg shadow-md">
                {/* Filter section */}
                <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-slate-50 border rounded-lg">
                    <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} className="form-select rounded-md border-gray-300 shadow-sm text-sm p-2.5">
                        <option value="all">Pilih Karyawan</option>
                        {employees.map(e => <option key={e.nik} value={e.nik}>{e.name}</option>)}
                    </select>
                    <select value={leaveTypeFilter} onChange={e => setLeaveTypeFilter(e.target.value)} className="form-select rounded-md border-gray-300 shadow-sm text-sm p-2.5">
                        <option value="all">Cuti Tahunan / Besar</option>
                        <option value="Cuti Tahunan">Cuti Tahunan</option>
                        <option value="Cuti Besar">Cuti Besar</option>
                    </select>
                     <div className="relative flex-grow">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="cari..." className="form-input rounded-md border-gray-300 shadow-sm text-sm p-2.5 pl-8 w-full"/>
                        <SearchIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
                    </div>
                    <button className="p-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700"><SearchIcon className="w-5 h-5"/></button>
                    <button className="p-2.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"><FilterXIcon className="w-5 h-5"/></button>
                    <button className="p-2.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"><XIcon className="w-5 h-5"/></button>
                    <button className="p-2.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"><PrintIcon className="w-5 h-5"/></button>
                </div>
                
                {/* Pagination info */}
                <div className="flex items-center gap-2 mb-4 text-sm">
                    <span>Tampilkan</span>
                    <select value={entriesPerPage} onChange={e => setEntriesPerPage(Number(e.target.value))} className="form-select rounded-md border-gray-300 shadow-sm text-sm p-2">
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                    </select>
                    <span>entri</span>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">Nama Karyawan</th>
                                <th className="px-4 py-3">Jenis Cuti</th>
                                <th className="px-4 py-3">Periode</th>
                                <th className="px-4 py-3">Masa Berlaku</th>
                                <th className="px-4 py-3">Quota</th>
                                <th className="px-4 py-3">Diambil</th>
                                <th className="px-4 py-3">Sisa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map(item => (
                                <tr key={item.id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{item.namaKaryawan}</td>
                                    <td className="px-4 py-3">{item.jenisCuti}</td>
                                    <td className="px-4 py-3">{item.periode}</td>
                                    <td className="px-4 py-3">{formatMasaBerlaku(item.masaBerlakuStart, item.masaBerlakuEnd)}</td>
                                    <td className="px-4 py-3">{item.quota} Days</td>
                                    <td className="px-4 py-3">{item.diambil} Days</td>
                                    <td className="px-4 py-3">{item.sisa} Days</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination controls */}
                 <div className="flex justify-between items-center mt-4 text-sm">
                     <p>Menampilkan {paginatedData.length} dari {filteredData.length} entri</p>
                    {/* ... pagination buttons if needed */}
                </div>
            </div>
        </div>
    );
};