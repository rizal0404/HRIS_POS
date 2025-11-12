import React, { useState, useMemo } from 'react';
import { UsulanCuti, UserProfile, UsulanJenis, UsulanStatus, JadwalKerja } from '../../types';
import { PlusIcon, FileTextIcon, SearchIcon, FilterXIcon, EyeIcon, XIcon, UsersIcon, ChevronLeftIcon } from '../../components/Icons';
import { TambahPengajuanCutiView } from './TambahPengajuanCutiView';

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

    const handleBuatAjuan = () => {
        setProposalToEdit(null);
        setView('form');
    };

    const handleViewAjuan = (proposal: UsulanCuti) => {
        setProposalToEdit(proposal);
        setView('form');
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
                            onViewAjuan={handleViewAjuan} 
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
        </div>
    );
};
