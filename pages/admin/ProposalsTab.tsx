import React, { useState, useMemo, useEffect } from 'react';
import { Usulan, UsulanCuti, UsulanLembur, UserProfile, UsulanStatus, UsulanJenis, UsulanSubstitusi, UsulanPembetulanPresensi } from '../../types';
import { SearchIcon, FilterXIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';

const getPeriodeDisplay = (proposal: Usulan): string => {
    if (proposal.jenisAjuan === UsulanJenis.Lembur) {
        const p = proposal as UsulanLembur;
        const date = new Date(p.tanggalLembur + 'T00:00:00');
        return `${date.toLocaleDateString('id-ID')} (${p.shift})`;
    } else if (proposal.jenisAjuan === UsulanJenis.Substitusi) {
        const p = proposal as UsulanSubstitusi;
        const date = new Date(p.tanggalSubstitusi + 'T00:00:00');
        return `${date.toLocaleDateString('id-ID')} (${p.shiftAwal} -> ${p.shiftBaru})`;
    } else if (proposal.jenisAjuan === UsulanJenis.PembetulanPresensi) {
        const p = proposal as UsulanPembetulanPresensi;
        const date = new Date(p.tanggalPembetulan + 'T00:00:00');
        return `${date.toLocaleDateString('id-ID')} (Clock ${p.clockType})`;
    }
    else {
        const p = proposal as UsulanCuti;
        const startDate = new Date(p.periode.startDate + 'T00:00:00').toLocaleDateString('id-ID');
        const endDate = new Date(p.periode.endDate + 'T00:00:00').toLocaleDateString('id-ID');
        return startDate === endDate ? startDate : `${startDate} s/d ${endDate}`;
    }
}

const getKeteranganDisplay = (proposal: Usulan): string => {
    if (proposal.jenisAjuan === UsulanJenis.Lembur) {
        return (proposal as UsulanLembur).keteranganLembur;
    }
     if (proposal.jenisAjuan === UsulanJenis.PembetulanPresensi) {
        return (proposal as UsulanPembetulanPresensi).alasan;
    }
    return (proposal as UsulanCuti | UsulanSubstitusi).keterangan;
}

const getProposalDate = (p: Usulan): string => {
    if (p.jenisAjuan === UsulanJenis.Lembur) return (p as UsulanLembur).tanggalLembur;
    if (p.jenisAjuan === UsulanJenis.Substitusi) return (p as UsulanSubstitusi).tanggalSubstitusi;
    if (p.jenisAjuan === UsulanJenis.PembetulanPresensi) return (p as UsulanPembetulanPresensi).tanggalPembetulan;
    return (p as UsulanCuti).periode.startDate; // Use start date for range filtering
}


export const ProposalsTab: React.FC<{
    proposals: Usulan[], 
    employees: UserProfile[], 
    onApproveClick: (proposal: Usulan) => void, 
    onRejectClick: (proposal: Usulan) => void, 
    onPreviewClick: (url: string) => void,
    onViewDetails: (proposal: Usulan) => void,
    canApprove: boolean,
    title: string,
    onBulkApprove: (ids: string[]) => void;
    onBulkReject: (ids: string[]) => void;
}> = ({proposals, employees, onApproveClick, onRejectClick, onPreviewClick, onViewDetails, canApprove, title, onBulkApprove, onBulkReject}) => {

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<UsulanStatus | 'Semua'>('Semua');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    const filteredProposals = useMemo(() => {
        return proposals.filter(p => {
            const proposalDate = getProposalDate(p);
            if (startDate && proposalDate < startDate) return false;
            if (endDate && proposalDate > endDate) return false;

            if (statusFilter !== 'Semua' && p.status !== statusFilter) return false;

            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            if (searchTerm && 
                !p.nama.toLowerCase().includes(lowerCaseSearchTerm) &&
                !p.nik.toLowerCase().includes(lowerCaseSearchTerm) &&
                !getKeteranganDisplay(p).toLowerCase().includes(lowerCaseSearchTerm)
            ) return false;

            return true;
        });
    }, [proposals, startDate, endDate, statusFilter, searchTerm]);
    
    // Reset page and selection when filters change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [startDate, endDate, statusFilter, searchTerm, entriesPerPage]);


    const totalEntries = filteredProposals.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const paginatedProposals = useMemo(() => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        return filteredProposals.slice(startIndex, startIndex + entriesPerPage);
    }, [filteredProposals, currentPage, entriesPerPage]);


    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIdsOnPage = new Set(paginatedProposals.map(p => p.id));
            setSelectedIds(allIdsOnPage);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
        } else {
            newSelectedIds.add(id);
        }
        setSelectedIds(newSelectedIds);
    };
    
    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('Semua');
        setSearchTerm('');
    };

    const isAllOnPageSelected = paginatedProposals.length > 0 && paginatedProposals.every(p => selectedIds.has(p.id));

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{title.replace('Review', 'Persetujuan')}</h2>
            
            <div className="space-y-4 mb-4">
                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 border rounded-lg">
                     <div className="flex items-center border rounded-md bg-white shadow-sm">
                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-2.5 rounded-l-md border-r">Dari</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input border-0 rounded-r-md text-sm p-2 w-36"/>
                    </div>
                     <div className="flex items-center border rounded-md bg-white shadow-sm">
                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-2.5 rounded-l-md border-r">Sampai</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="form-input border-0 rounded-r-md text-sm p-2 w-36"/>
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="form-select rounded-md border-gray-300 shadow-sm text-sm p-2.5">
                        <option value="Semua">Semua Status</option>
                        {Object.values(UsulanStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="relative flex-grow">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="cari..." className="form-input rounded-md border-gray-300 shadow-sm text-sm p-2.5 pl-8 w-full"/>
                        <SearchIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
                    </div>
                    <button onClick={handleClearFilters} title="Hapus Filter" className="p-2.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300">
                        <FilterXIcon className="w-5 h-5"/>
                    </button>
                </div>
                
                {/* Action Bar */}
                 <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setSelectedIds(new Set(paginatedProposals.map(p => p.id)))} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Select All</button>
                    <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Select None</button>
                    <button 
                        onClick={() => onBulkApprove(Array.from(selectedIds))}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed">
                        Approve
                    </button>
                    <button 
                        onClick={() => onBulkReject(Array.from(selectedIds))}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed">
                        Reject
                    </button>
                    <span className="text-sm text-gray-500 ml-auto">{selectedIds.size} item terpilih</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center">
                                <input type="checkbox"
                                    checked={isAllOnPageSelected}
                                    onChange={handleSelectAll}
                                    className="form-checkbox h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                            </th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Jenis</th>
                            <th className="px-4 py-3">Periode</th>
                            <th className="px-4 py-3">Keterangan</th>
                            <th className="px-4 py-3">Pengganti</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Waktu Approval</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProposals.map(p => {
                            const isCutiType = p.jenisAjuan === UsulanJenis.CutiTahunan || p.jenisAjuan === UsulanJenis.IzinSakit;
                            const penggantiNik = isCutiType ? (p as UsulanCuti).penggantiNik : undefined;
                            const penggantiNames = penggantiNik?.map(nik => employees.find(e => e.nik === nik)?.name).filter(Boolean).join(', ') || '-';
                            const linkBerkas = isCutiType ? (p as UsulanCuti).linkBerkas : undefined;

                            return (
                                <tr 
                                    key={p.id} 
                                    className={`border-b hover:bg-slate-50 ${selectedIds.has(p.id) ? 'bg-red-50' : ''}`}
                                >
                                    <td className="px-4 py-3 text-center">
                                         <input type="checkbox"
                                            checked={selectedIds.has(p.id)}
                                            onChange={() => handleSelectOne(p.id)}
                                            className="form-checkbox h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900 cursor-pointer" onClick={() => onViewDetails(p)}>{p.nama}</td>
                                    <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(p)}>{p.jenisAjuan}</td>
                                    <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(p)}>{getPeriodeDisplay(p)}</td>
                                    <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(p)}>{getKeteranganDisplay(p)}</td>
                                    <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(p)}>{penggantiNames}</td>
                                    <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(p)}>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ 
                                            p.status === UsulanStatus.Disetujui ? 'bg-green-100 text-green-800' : 
                                            p.status === UsulanStatus.Ditolak ? 'bg-red-100 text-red-800' :
                                            p.status === UsulanStatus.Revisi ? 'bg-orange-100 text-orange-800' :
                                            p.status === UsulanStatus.PembatalanDiajukan ? 'bg-purple-100 text-purple-800' :
                                            p.status === UsulanStatus.Dibatalkan ? 'bg-gray-200 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(p)}>
                                        {p.approvalTimestamp || '-'}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 {totalEntries === 0 && <div className="text-center py-10 text-slate-500">Tidak ada data ajuan.</div>}
            </div>

             <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-700">
                    Menampilkan {paginatedProposals.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} - {Math.min(currentPage * entriesPerPage, totalEntries)} dari {totalEntries} entri
                </p>
                <div className="flex items-center">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-2 py-1 border rounded-l-md bg-white hover:bg-gray-50 disabled:opacity-50">
                        <ChevronLeftIcon className="w-5 h-5"/>
                    </button>
                    <span className="px-4 py-2 border-t border-b bg-white text-sm">
                       Halaman {currentPage} dari {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-2 py-1 border rounded-r-md bg-white hover:bg-gray-50 disabled:opacity-50">
                        <ChevronRightIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
}