import React, { useState, useMemo } from 'react';
import { UsulanLembur, UsulanStatus } from '../../../types';
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, FilterXIcon, ChevronLeftIcon, ChevronRightIcon } from '../../../components/Icons';

const getStatusAbbreviation = (status: UsulanStatus) => {
    switch (status) {
        case UsulanStatus.Disetujui: return 'A'; // Approved
        case UsulanStatus.Diajukan: return 'P'; // Pending
        case UsulanStatus.Ditolak: return 'R'; // Rejected
        case UsulanStatus.Revisi: return 'V'; // Revision
        default: return '?';
    }
}

interface DataLemburTabProps {
    onAdd: () => void;
    usulanLembur: UsulanLembur[];
    onDelete: (id: string) => void;
}

export const DataLemburTab: React.FC<DataLemburTabProps> = ({ onAdd, usulanLembur, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [selectedLemburId, setSelectedLemburId] = useState<string | null>(null);
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [searchTerm, setSearchTerm] = useState('');

    const selectedLembur = useMemo(() => {
        return usulanLembur.find(item => item.id === selectedLemburId);
    }, [selectedLemburId, usulanLembur]);

    const isActionable = useMemo(() => {
        if (!selectedLembur) return false;
        return selectedLembur.status === UsulanStatus.Diajukan || selectedLembur.status === UsulanStatus.Revisi;
    }, [selectedLembur]);

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('Semua');
        setSearchTerm('');
    };

    const filteredData = useMemo(() => {
        setCurrentPage(1); // Reset to first page on filter change
        return usulanLembur.filter(item => {
            const itemDate = item.tanggalLembur;
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            
            if (statusFilter !== 'Semua' && item.status !== statusFilter) return false;
            
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            if (searchTerm &&
                !item.keteranganLembur.toLowerCase().includes(lowerCaseSearchTerm) &&
                !item.kategoriLembur.toLowerCase().includes(lowerCaseSearchTerm)
            ) return false;
            
            return true;
        });
    }, [usulanLembur, startDate, endDate, statusFilter, searchTerm]);

    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        return filteredData.slice(startIndex, startIndex + entriesPerPage);
    }, [filteredData, currentPage, entriesPerPage]);

    const handleDelete = () => {
        if (selectedLemburId) {
            onDelete(selectedLemburId);
            setSelectedLemburId(null);
        } else {
            alert("Silakan pilih salah satu data lembur untuk dihapus.");
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b">
                <div className="flex flex-wrap items-center gap-2 w-full">
                    <div className="flex items-center border rounded-md bg-white shadow-sm">
                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-2.5 rounded-l-md border-r">Dari</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input border-0 rounded-r-md text-sm p-2 w-36"/>
                    </div>
                     <div className="flex items-center border rounded-md bg-white shadow-sm">
                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-2.5 rounded-l-md border-r">Sampai</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="form-input border-0 rounded-r-md text-sm p-2 w-36"/>
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select rounded-md border-gray-300 shadow-sm text-sm p-2 w-full sm:w-auto">
                        <option value="Semua">Semua Status</option>
                        <option value={UsulanStatus.Diajukan}>Belum Approve</option>
                        <option value={UsulanStatus.Disetujui}>Approved</option>
                        <option value={UsulanStatus.Ditolak}>Ditolak</option>
                        <option value={UsulanStatus.Revisi}>Revisi</option>
                    </select>
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="cari..." className="form-input rounded-md border-gray-300 shadow-sm text-sm p-2 flex-grow min-w-[150px]"/>
                    <button className="p-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700"><SearchIcon className="w-5 h-5"/></button>
                    <button onClick={handleClearFilters} className="p-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700"><FilterXIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button onClick={onAdd} className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex-1"><PlusIcon className="w-5 h-5 mx-auto"/></button>
                    <button className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400 flex-1" disabled={!isActionable}><EditIcon className="w-5 h-5 mx-auto"/></button>
                    <button onClick={handleDelete} className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 flex-1" disabled={!isActionable}><TrashIcon className="w-5 h-5 mx-auto"/></button>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">Tampilkan</span>
                <select value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }} className="form-select rounded-md border-gray-300 shadow-sm text-sm p-2">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                </select>
                <span className="text-sm">entri</span>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-center align-middle">
                        <tr>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">Pilih</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">No Karyawan</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">Nama Karyawan</th>
                            <th colSpan={3} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-b border-r">Mulai Lembur</th>
                            <th colSpan={3} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-b border-r">Akhir Lembur</th>
                            <th colSpan={3} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-b border-r">Tanpa Istirahat</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">Lama Lembur</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">Status</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">Status SAP</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">Create By</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">Update By</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r align-middle">Kategori</th>
                            <th rowSpan={2} className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider align-middle">Keterangan</th>
                        </tr>
                            <tr>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">Hari</th>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">Tanggal</th>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">Jam</th>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">Hari</th>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">Tanggal</th>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">Jam</th>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">T1</th>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">T2</th>
                            <th className="px-2 py-3 font-medium text-gray-500 uppercase tracking-wider border-r">T3</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.map((item) => {
                            const dateObj = new Date(item.tanggalLembur + 'T00:00:00Z');
                            const dayName = isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
                            const formattedDate = isNaN(dateObj.getTime()) ? item.tanggalLembur : dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                            const lamaLemburHours = Math.floor(item.jamLembur);
                            const lamaLemburMinutes = Math.round((item.jamLembur - lamaLemburHours) * 60);
                            const formattedLamaLembur = `${String(lamaLemburHours).padStart(2, '0')} Jam ${String(lamaLemburMinutes).padStart(2, '0')} Menit`;

                            return (
                            <tr key={item.id} className={selectedLemburId === item.id ? 'bg-red-50' : ''}>
                                <td className="px-2 py-2 whitespace-nowrap border-r text-center">
                                    <input type="radio" name="selectedLembur" value={item.id} checked={selectedLemburId === item.id} onChange={() => setSelectedLemburId(item.id)} className="form-radio h-4 w-4 text-red-600"/>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{item.nik}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{item.nama}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{dayName}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{formattedDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{item.jamAwal}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{dayName}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{formattedDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{item.jamAkhir}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r text-center">{item.tanpaIstirahat.includes('Shift 1') ? '✓' : ''}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r text-center">{item.tanpaIstirahat.includes('Shift 2') ? '✓' : ''}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r text-center">{item.tanpaIstirahat.includes('Shift 3') ? '✓' : ''}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{formattedLamaLembur}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r text-red-600 font-bold text-center">{getStatusAbbreviation(item.status)}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r text-center">{item.status === UsulanStatus.Disetujui ? '1' : '0'}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{item.nik}</td>
                                <td className="px-2 py-2 whitespace-nowrap border-r"></td>
                                <td className="px-2 py-2 whitespace-nowrap border-r">{item.kategoriLembur}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{item.keteranganLembur}</td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-700">
                    Menampilkan {paginatedData.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} - {Math.min(currentPage * entriesPerPage, totalEntries)} dari {totalEntries} entri
                </p>
                <div className="flex items-center">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-2 py-1 border rounded-l-md bg-white hover:bg-gray-50 disabled:opacity-50">
                        <ChevronLeftIcon className="w-5 h-5"/>
                    </button>
                    {[...Array(totalPages).keys()].map(num => (
                            <button key={num + 1} onClick={() => setCurrentPage(num + 1)} className={`px-4 py-2 border-t border-b ${num > 0 ? 'border-l' : ''} ${currentPage === num + 1 ? 'bg-red-600 text-white' : 'bg-white hover:bg-gray-50'}`}>
                            {num + 1}
                        </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-2 py-1 border rounded-r-md bg-white hover:bg-gray-50 disabled:opacity-50">
                        <ChevronRightIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};