import React, { useState, useMemo } from 'react';
import { UsulanCuti, UserProfile, UsulanJenis, UsulanStatus, JadwalKerja } from '../../types';
import { PlusIcon, FileTextIcon, SearchIcon, FilterXIcon, EyeIcon, XIcon, UsersIcon, ChevronLeftIcon } from '../../components/Icons';
import { TambahPengajuanCutiView } from './TambahPengajuanCutiView';

// --- NEW READ-ONLY DETAIL MODAL ---

const formatDetailTimestamp = (timestampStr: string): string => {
    if (!timestampStr) return 'N/A';
    const parts = timestampStr.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) return timestampStr;
    const [, day, month, year, hour, minute] = parts;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const datePart = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(':', '.');
    return `${datePart} - ${timePart}`;
};

const formatDetailDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const countLeaveDays = (startDateStr: string, endDateStr: string): number => {
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
};

const getStatusBadgeForDetail = (status: UsulanStatus, sap: boolean = false) => {
    if (sap) {
        return status === UsulanStatus.Disetujui 
            ? <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500 text-white">Sukses</span>
            : <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-500 text-white">Pending</span>;
    }
    switch (status) {
        case UsulanStatus.Disetujui: return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500 text-white">Approved</span>;
        case UsulanStatus.Ditolak: return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500 text-white">Ditolak</span>;
        case UsulanStatus.Revisi: return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-white">Revisi</span>;
        case UsulanStatus.Diajukan:
        default: return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-500 text-white">Diajukan</span>;
    }
};

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string; }> = ({ label, value, className = '' }) => (
    <div className={className}>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
    </div>
);

const CutiDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    proposal: UsulanCuti;
    allPegawai: UserProfile[];
}> = ({ isOpen, onClose, proposal, allPegawai }) => {
    if (!isOpen) return null;

    const approver = allPegawai.find(p => p.id === proposal.managerId);
    
    // Fallback logic for approver name if manager relationship is not set/found
    const approverName = approver ? `${approver.name}, ST.` : 'Atasan terkait';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Lihat Data</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close modal">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </header>
                
                <main className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b pb-4">
                        <DetailItem label="Waktu Permintaan" value={formatDetailTimestamp(proposal.timestamp)} />
                        <DetailItem label="Jenis Cuti/Dispensasi" value={proposal.jenisAjuan} />
                        <DetailItem label="Keperluan / Alamat" value={proposal.keterangan} />
                        <DetailItem label="Lokasi" value={"Pkp-makassar"} />
                        <div/>
                        <div/>
                        <DetailItem label="Status Pengajuan" value={getStatusBadgeForDetail(proposal.status)} />
                        <DetailItem label="Status SAP" value={getStatusBadgeForDetail(proposal.status, true)} />
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-700 mb-2">Rincian</h4>
                        <div className="overflow-x-auto border rounded-md">
                             <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="px-4 py-2 font-semibold">Tanggal Mulai</th>
                                        <th className="px-4 py-2 font-semibold">Tanggal Akhir</th>
                                        <th className="px-4 py-2 font-semibold">Jumlah Hari</th>
                                        <th className="px-4 py-2 font-semibold">Dibuat Oleh</th>
                                        <th className="px-4 py-2 font-semibold">Disetujui Oleh</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    <tr>
                                        <td className="px-4 py-2 border-t">{formatDetailDate(proposal.periode.startDate)}</td>
                                        <td className="px-4 py-2 border-t">{formatDetailDate(proposal.periode.endDate)}</td>
                                        <td className="px-4 py-2 border-t">{countLeaveDays(proposal.periode.startDate, proposal.periode.endDate)}</td>
                                        <td className="px-4 py-2 border-t">{proposal.nama}</td>
                                        <td className="px-4 py-2 border-t">{approverName}</td>
                                    </tr>
                                </tbody>
                             </table>
                        </div>
                    </div>
                </main>

                <footer className="px-6 py-4 border-t flex justify-end">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md hover:bg-gray-300 transition-colors">
                        Kembali
                    </button>
                </footer>
            </div>
        </div>
    );
};

// --- END OF NEW COMPONENT ---

const parseAndFormatDateOnly = (timestampStr: string): string => {
    if (!timestampStr) return 'Invalid Date';
    // Handle DD/MM/YYYY format, ignoring time part
    const datePart = timestampStr.split(' ')[0];
    const parts = datePart.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        // JS month is 0-indexed
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    }
    return 'Invalid Date';
};

const PengambilanCutiView: React.FC<{
    usulanCuti: UsulanCuti[],
    allPegawai: UserProfile[],
    onBuatAjuan: () => void,
    onViewAjuan: (proposal: UsulanCuti) => void,
    onDeleteAjuan: (proposalId: string) => void,
}> = ({ usulanCuti, allPegawai, onBuatAjuan, onViewAjuan, onDeleteAjuan }) => {
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [searchTerm, setSearchTerm] = useState('');

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('Semua');
        setSearchTerm('');
    };

    const filteredUsulanCuti = useMemo(() => {
        return usulanCuti.filter(item => {
            // Filter to only show Cuti Tahunan
            if (item.jenisAjuan !== UsulanJenis.CutiTahunan) return false;

            const itemStartDate = item.periode.startDate;
            const itemEndDate = item.periode.endDate;

            // Date range filter: checks for any overlap
            if (startDate && itemEndDate < startDate) return false;
            if (endDate && itemStartDate > endDate) return false;
            
            // Status filter
            if (statusFilter !== 'Semua' && item.status !== statusFilter) return false;
            
            // Search term filter (searches in keterangan and jenisAjuan)
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            if (searchTerm && 
                !item.keterangan.toLowerCase().includes(lowerCaseSearchTerm) &&
                !item.jenisAjuan.toLowerCase().includes(lowerCaseSearchTerm)
            ) return false;
            
            return true;
        });
    }, [usulanCuti, startDate, endDate, statusFilter, searchTerm]);


    const formatTimestampForDisplay = (timestampStr: string) => {
        if (!timestampStr) return '-';
        const parts = timestampStr.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return timestampStr;
        const [, day, month, year, hour, minute] = parts;
        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}`);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' - ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatPeriodeForDisplay = (periode: {startDate: string, endDate: string}) => {
        const startDate = new Date(periode.startDate + 'T00:00:00');
        const endDate = new Date(periode.endDate + 'T00:00:00');
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        if (startDate.getTime() === endDate.getTime()) {
            return `Tgl. Cuti: ${startDate.toLocaleDateString('id-ID', options)}`;
        }
        return `Tgl. Cuti: ${startDate.toLocaleDateString('id-ID', options)} s/d ${endDate.toLocaleDateString('id-ID', options)}`;
    };

    const getStatusBadge = (status: UsulanStatus) => {
        switch (status) {
            case UsulanStatus.Disetujui: return 'bg-green-100 text-green-800';
            case UsulanStatus.Ditolak: return 'bg-red-100 text-red-800';
            case UsulanStatus.Revisi: return 'bg-orange-100 text-orange-800';
            case UsulanStatus.Diajukan:
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };
    
    const resolveDelegateNames = (niks?: string[]): string => {
        if (!niks || niks.length === 0) return '-';
        return niks.map(nik => allPegawai.find(p => p.nik === nik)?.name || nik).join(', ');
    };

    return (
        <div className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
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
                    <div className="relative w-full sm:w-auto flex-grow">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="cari..." className="form-input rounded-md border-gray-300 shadow-sm text-sm p-2 pl-8 w-full"/>
                        <SearchIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
                    </div>
                    <button className="p-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700"><SearchIcon className="w-5 h-5"/></button>
                    <button onClick={handleClearFilters} className="p-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700"><FilterXIcon className="w-5 h-5"/></button>
                </div>
                 <button onClick={onBuatAjuan} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-900 transition-colors text-sm whitespace-nowrap w-full md:w-auto shrink-0">
                    Buat Pengajuan
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        {/* Placeholder for header */}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {filteredUsulanCuti.map(item => (
                            <tr key={item.id}>
                                <td className="px-4 py-4 align-top">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 space-x-1">
                                            <button onClick={() => onViewAjuan(item)} className="p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors" aria-label="Lihat detail">
                                                <EyeIcon className="w-4 h-4"/>
                                            </button>
                                            { (item.status === UsulanStatus.Diajukan || item.status === UsulanStatus.Revisi) &&
                                                <button onClick={() => onDeleteAjuan(item.id)} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors" aria-label="Hapus ajuan">
                                                    <XIcon className="w-4 h-4"/>
                                                </button>
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">#{item.id.substring(0,6)}</p>
                                            <p className="text-gray-500">{formatTimestampForDisplay(item.timestamp)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-top whitespace-nowrap">
                                    <p className="font-semibold text-gray-800">{item.jenisAjuan}</p>
                                    <p className="text-gray-500">{formatPeriodeForDisplay(item.periode)}</p>
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <UsersIcon className="w-4 h-4 flex-shrink-0"/>
                                        <span>{resolveDelegateNames(item.penggantiNik)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div className="flex items-center gap-2">
                                        <FileTextIcon className="w-4 h-4 flex-shrink-0 text-gray-500"/>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div className="flex items-center gap-2">
                                        <FileTextIcon className="w-4 h-4 flex-shrink-0 text-gray-500"/>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === UsulanStatus.Disetujui ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {item.status === UsulanStatus.Disetujui ? 'Sukses' : 'Pending'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};

const QuotaCutiView: React.FC<{ user: UserProfile, usulanCuti: UsulanCuti[], jadwal: JadwalKerja[] }> = ({ user, usulanCuti, jadwal }) => {
    
    const cutiDiambil = useMemo(() => {
      return usulanCuti
      .filter(usulan => 
        usulan.status === UsulanStatus.Disetujui && 
        usulan.jenisAjuan === UsulanJenis.CutiTahunan
      )
      .reduce((total, usulan) => {
        const startDate = new Date(usulan.periode.startDate + 'T00:00:00');
        const endDate = new Date(usulan.periode.endDate + 'T00:00:00');
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return total;
        }
        
        let daysToCount = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const daySchedule = jadwal.find(s => s.tanggal === dateString);
            
            // Only count if it's a scheduled workday (not OFF)
            if (daySchedule && daySchedule.shift !== 'OFF') {
                daysToCount++;
            }
        }
        return total + daysToCount;
      }, 0);
    }, [usulanCuti, jadwal]);

    const sisaCuti = user.totalCutiTahunan - cutiDiambil;
    const currentYear = 2025; // Align with mock data year

    return (
        <div className="mt-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-100">
                        <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th className="px-6 py-3">Periode</th>
                            <th className="px-6 py-3">Jenis</th>
                            <th className="px-6 py-3">Masa Berlaku</th>
                            <th className="px-6 py-3">Quota</th>
                            <th className="px-6 py-3">Diambil</th>
                            <th className="px-6 py-3">Sisa</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap">{currentYear}</td>
                            <td className="px-6 py-4 whitespace-nowrap">Cuti Tahunan</td>
                            <td className="px-6 py-4 whitespace-nowrap">{`01 Jan ${currentYear} s/d 31 Dec ${currentYear}`}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.totalCutiTahunan} Hari</td>
                            <td className="px-6 py-4 whitespace-nowrap">{cutiDiambil} Hari</td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold">{sisaCuti} Hari</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PembatalanCutiView: React.FC<{
    usulanCuti: UsulanCuti[],
    onAjukanPembatalan: (id: string) => void,
}> = ({ usulanCuti, onAjukanPembatalan }) => {
    
    const relevantCuti = useMemo(() => {
        return usulanCuti.filter(item => 
            [UsulanStatus.Disetujui, UsulanStatus.PembatalanDiajukan, UsulanStatus.Dibatalkan].includes(item.status)
        ).sort((a, b) => new Date(b.periode.startDate).getTime() - new Date(a.periode.startDate).getTime());
    }, [usulanCuti]);

    const getStatusComponent = (status: UsulanStatus) => {
        switch (status) {
            case UsulanStatus.PembatalanDiajukan:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Menunggu Approval</span>;
            case UsulanStatus.Dibatalkan:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Dibatalkan</span>;
            default:
                return null;
        }
    };
    
    return (
        <div className="mt-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th className="px-6 py-3">Tanggal Pengajuan</th>
                            <th className="px-6 py-3">Periode Cuti</th>
                            <th className="px-6 py-3">Keterangan</th>
                            <th className="px-6 py-3">Status Pembatalan</th>
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {relevantCuti.map(item => (
                             <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{parseAndFormatDateOnly(item.timestamp)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{`${new Date(item.periode.startDate+'T00:00:00').toLocaleDateString('id-ID')} - ${new Date(item.periode.endDate+'T00:00:00').toLocaleDateString('id-ID')}`}</td>
                                <td className="px-6 py-4">{item.keterangan}</td>
                                <td className="px-6 py-4">{getStatusComponent(item.status)}</td>
                                <td className="px-6 py-4">
                                     {item.status === UsulanStatus.Disetujui && (
                                        <button 
                                            onClick={() => onAjukanPembatalan(item.id)}
                                            className="text-sm font-medium text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md"
                                        >
                                            Ajukan Pembatalan
                                        </button>
                                     )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export const CutiView: React.FC<{
    user: UserProfile,
    usulanCuti: UsulanCuti[],
    allPegawai: UserProfile[],
    jadwal: JadwalKerja[],
    onDataChange: () => void,
    onDeleteAjuan: (proposalId: string) => void,
    onAjukanPembatalan: (id: string) => void,
    initialTab?: 'pengambilan' | 'quota' | 'pembatalan';
}> = ({ user, usulanCuti, allPegawai, jadwal, onDataChange, onDeleteAjuan, onAjukanPembatalan, initialTab = 'pengambilan' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [proposalToEdit, setProposalToEdit] = useState<UsulanCuti | null>(null);
    const [viewingCutiDetails, setViewingCutiDetails] = useState<UsulanCuti | null>(null);

    const handleBuatAjuan = () => {
        setProposalToEdit(null);
        setView('form');
    };

    const handleViewDetails = (proposal: UsulanCuti) => {
        setViewingCutiDetails(proposal);
    };

    const handleBackFromForm = () => {
        setView('list');
        setProposalToEdit(null);
    };
    
    const handleSuccessFromForm = () => {
        setView('list');
        setProposalToEdit(null);
        onDataChange();
    }
    
    const headerTitle = 'Cuti Tahunan/Besar';
    const showBackButton = view === 'form';
    
    return (
        <div>
            <header className="bg-red-700 text-white p-4 rounded-t-lg flex items-center">
                {showBackButton && (
                    <button onClick={handleBackFromForm} className="mr-4 p-1 rounded-full hover:bg-red-800 transition-colors" aria-label="Kembali">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                )}
                <h1 className="text-xl font-bold">{headerTitle}</h1>
            </header>
            
            {view === 'list' ? (
                <div className="bg-white p-6 rounded-b-lg shadow-md">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => setActiveTab('pengambilan')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pengambilan' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                <PlusIcon className="w-4 h-4" /> Pengambilan
                            </button>
                             <button onClick={() => setActiveTab('quota')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'quota' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                <FileTextIcon className="w-4 h-4" /> Quota Cuti
                            </button>
                            <button onClick={() => setActiveTab('pembatalan')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pembatalan' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                <XIcon className="w-4 h-4" /> Pembatalan Cuti
                            </button>
                        </nav>
                    </div>
                    
                    {activeTab === 'pengambilan' && (
                        <PengambilanCutiView 
                            usulanCuti={usulanCuti} 
                            allPegawai={allPegawai} 
                            onBuatAjuan={handleBuatAjuan} 
                            onViewAjuan={handleViewDetails} 
                            onDeleteAjuan={onDeleteAjuan}
                        />
                    )}
                    {activeTab === 'quota' && (
                        <QuotaCutiView user={user} usulanCuti={usulanCuti} jadwal={jadwal} />
                    )}
                    {activeTab === 'pembatalan' && (
                        <PembatalanCutiView usulanCuti={usulanCuti} onAjukanPembatalan={onAjukanPembatalan} />
                    )}
                </div>
            ) : (
                <TambahPengajuanCutiView 
                    user={user}
                    allPegawai={allPegawai}
                    jadwal={jadwal}
                    onSuccess={handleSuccessFromForm}
                    onBack={handleBackFromForm}
                    proposalToEdit={proposalToEdit}
                />
            )}

            {viewingCutiDetails && (
                <CutiDetailModal
                    isOpen={!!viewingCutiDetails}
                    onClose={() => setViewingCutiDetails(null)}
                    proposal={viewingCutiDetails}
                    allPegawai={allPegawai}
                />
            )}
        </div>
    );
};
