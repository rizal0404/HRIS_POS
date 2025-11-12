import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserProfile, JadwalKerja, UsulanCuti, UsulanLembur, ShiftConfig, Presensi, Usulan, UsulanJenis, UsulanSubstitusi, VendorConfig, UsulanPembetulanPresensi, UsulanStatus, UserRole } from '../types';
import { apiService } from '../services/apiService';
import { HomeIcon, GridIcon, ChevronRightIcon, ClockIcon, CalendarIcon, SearchIcon, MenuIcon, ArrowLeftRightIcon, UserCheckIcon, UserIcon, PlaneIcon, SitemapIcon, LogOutIcon, FileTextIcon, XIcon } from '../components/Icons';

import { DashboardContent } from './pegawai/DashboardContent';
import { CutiView } from './pegawai/CutiView';
import { LemburView } from './pegawai/LemburView';
import { ShiftScheduleView } from '../components/ShiftScheduleView';
import { PresensiHistoryView } from '../components/PresensiHistoryView';
import { ProposalFormModal } from './pegawai/ProposalFormModal';
import { ClockInModal } from './pegawai/ClockInModal';
import { TambahLemburModal } from './pegawai/TambahLemburModal';
import { SubstitusiView } from './pegawai/SubstitusiView';
import { Logo } from '../components/Logo';
import ConfirmationModal from '../components/ConfirmationModal';
import { PersonalTab } from './pegawai/PersonalTab';
import { LaporanPresensiPage } from './pegawai/LaporanPresensiPage';
import Modal from '../components/Modal';


// --- NEW COMPONENTS FOR IZIN/SAKIT ---

const AjuanIzinSakitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSuccess: () => void;
}> = ({ isOpen, onClose, user, onSuccess }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [alasan, setAlasan] = useState('');
    const [buktiFile, setBuktiFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!buktiFile) {
            alert('Bukti untuk Izin/Sakit wajib diunggah.');
            return;
        }
        setIsSubmitting(true);
        try {
            const fileName = `${user.nik}-izin-${Date.now()}-${buktiFile.name.replace(/\s+/g, '_')}`;
            const fileUrl = await apiService.uploadProofFile(buktiFile, fileName);

            await apiService.addCuti({
                nik: user.nik,
                nama: user.name,
                seksi: user.seksi,
                jenisAjuan: UsulanJenis.IzinSakit,
                periode: { startDate, endDate: endDate || startDate },
                keterangan: alasan,
                status: UsulanStatus.Diajukan,
                rolePengaju: user.role,
                linkBerkas: fileUrl,
                penggantiNik: [],
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to submit izin/sakit request:', error);
            alert('Gagal mengirim ajuan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajuan Izin/Sakit">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Periode</label>
                     <div className="mt-1 flex items-center gap-2">
                         <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-md" />
                         <span className="text-slate-500">s/d</span>
                         <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-md" placeholder="Kosongkan jika 1 hari"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="alasan" className="block text-sm font-medium text-slate-700">Alasan/Diagnosa</label>
                    <textarea id="alasan" value={alasan} onChange={e => setAlasan(e.target.value)} rows={3} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Upload Bukti (Wajib)</label>
                    <div className="mt-1">
                        <input type="file" ref={fileInputRef} onChange={e => setBuktiFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" accept="image/*,application/pdf" required/>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Batal
                    </button>
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
                        {isSubmitting ? "Mengirim..." : "Kirim Ajuan"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const IzinSakitView: React.FC<{
  usulanIzinSakit: UsulanCuti[];
  onBuatAjuan: () => void;
  onDeleteAjuan: (proposalId: string) => void;
}> = ({ usulanIzinSakit, onBuatAjuan, onDeleteAjuan }) => {
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
            return `Tgl. Izin: ${startDate.toLocaleDateString('id-ID', options)}`;
        }
        return `Tgl. Izin: ${startDate.toLocaleDateString('id-ID', options)} s/d ${endDate.toLocaleDateString('id-ID', options)}`;
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

    return (
        <div>
            <header className="bg-red-700 text-white p-4 rounded-t-lg flex items-center">
                <h1 className="text-xl font-bold">Ajuan Izin/Sakit</h1>
            </header>
            <div className="bg-white p-6 rounded-b-lg shadow-md">
                <div className="flex justify-end mb-6">
                     <button onClick={onBuatAjuan} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-900 transition-colors text-sm whitespace-nowrap">
                        Buat Pengajuan Izin/Sakit
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-4 py-3">Tanggal Pengajuan</th>
                                <th className="px-4 py-3">Periode</th>
                                <th className="px-4 py-3">Keterangan</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Bukti</th>
                                <th className="px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {usulanIzinSakit.map(item => (
                                <tr key={item.id}>
                                    <td className="px-4 py-4">{formatTimestampForDisplay(item.timestamp)}</td>
                                    <td className="px-4 py-4">{formatPeriodeForDisplay(item.periode)}</td>
                                    <td className="px-4 py-4">{item.keterangan}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {item.linkBerkas ? (
                                            <a href={item.linkBerkas} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat</a>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-4">
                                        { (item.status === UsulanStatus.Diajukan || item.status === UsulanStatus.Revisi) &&
                                            <button onClick={() => onDeleteAjuan(item.id)} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors" aria-label="Hapus ajuan">
                                                <XIcon className="w-4 h-4"/>
                                            </button>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {usulanIzinSakit.length === 0 && <p className="text-center py-4 text-gray-500">Belum ada ajuan Izin/Sakit.</p>}
                </div>
            </div>
        </div>
    );
};

// --- NEW LAYOUT COMPONENTS ---

const Sidebar: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}> = ({ isOpen, setIsOpen, isMobile, activeMenu, setActiveMenu }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const menuItems = [
    { id: 'beranda', title: 'Beranda', icon: <HomeIcon /> },
    { type: 'divider', title: 'Time Management' },
    { id: 'cuti', title: 'Cuti', icon: <CalendarIcon /> },
    { id: 'izinSakit', title: 'Izin/Sakit', icon: <FileTextIcon /> },
    //{ id: 'pembatalanCuti', title: 'Ajukan Pembatalan Cuti', icon: <XIcon /> },
    { id: 'lembur', title: 'Lembur', icon: <ClockIcon /> },
    { id: 'substitusi', title: 'Substitusi', icon: <ArrowLeftRightIcon /> },
    { id: 'presensi', title: 'Absensi/Presensi', icon: <UserCheckIcon /> },
    { id: 'laporanPresensi', title: 'Laporan Presensi', icon: <FileTextIcon /> },
    { id: 'jadwalShift', title: 'Jadwal Shift Tim', icon: <GridIcon /> },
    { type: 'divider', title: 'Master Data' },
    { id: 'personal', title: 'Personal', icon: <UserIcon /> },
    { type: 'divider', title: 'Payroll' },
    { id: 'payslip', title: 'Payslip', icon: <FileTextIcon /> },
    { type: 'divider', title: 'Travel Management' },
    { id: 'sppd', title: 'SPPD', icon: <PlaneIcon /> },
    { type: 'divider', title: 'Organisasi' },
    { id: 'organisasi', title: 'Organisasi', icon: <SitemapIcon /> },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.type === 'divider' || item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpanded = isOpen || !isMobile;

  return (
    <aside className={`bg-white flex flex-col transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isExpanded ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-center h-16 border-b shrink-0 px-4">
        {isExpanded ? (
            <Logo className="h-10 object-contain"/>
        ) : (
            <Logo className="h-8 w-16 object-contain"/>
        )}
      </div>
      <div className={`p-4 border-b ${!isExpanded && 'py-2'}`}>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={isExpanded ? "Cari menu..." : ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-gray-100 rounded-md border-gray-300 focus:ring-red-500 focus:border-red-500 transition-all ${isExpanded ? 'pl-10 pr-4 py-2' : 'pl-10 w-12 h-10'}`}
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="py-4">
          {filteredMenuItems.map((item, index) =>
            item.type === 'divider' ? (
              <li key={index} className={`px-4 mt-4 mb-2 text-xs font-semibold text-gray-400 uppercase ${!isExpanded && 'text-center'}`}>
                {isExpanded ? item.title : '•'}
              </li>
            ) : (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveMenu(item.id);
                    if (isMobile) setIsOpen(false);
                  }}
                  className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                    activeMenu === item.id
                      ? 'bg-red-50 text-red-700 font-bold border-r-4 border-red-500'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={item.title}
                >
                  <span className="shrink-0">{React.cloneElement(item.icon, { className: 'w-6 h-6' })}</span>
                  <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>{item.title}</span>
                  {isExpanded && <ChevronRightIcon className="w-4 h-4 ml-auto" />}
                </button>
              </li>
            )
          )}
        </ul>
      </nav>
    </aside>
  );
};

const TopBar: React.FC<{
  onToggleSidebar: () => void;
  user: UserProfile | null;
  onLogout: () => void;
}> = ({ onToggleSidebar, user, onLogout }) => {
  return (
    <header className="bg-white h-16 flex items-center justify-between px-4 sm:px-6 border-b shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
            <button onClick={onToggleSidebar} className="text-gray-500 hover:text-gray-700">
                <MenuIcon className="w-6 h-6" />
            </button>
        </div>
      
        <div className="flex items-center gap-4">
             <button className="text-gray-500 hover:text-gray-700">
                <SearchIcon className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-500"/>
            </div>
             <span className="hidden sm:block font-semibold text-gray-700">{user?.name}</span>
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-700" aria-label="Logout">
                <LogOutIcon className="w-6 h-6" />
            </button>
        </div>
    </header>
  );
};

interface PegawaiPageProps {
  user: UserProfile;
  onLogout: () => void;
}

const TimedAlert: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const baseClasses = "fixed top-5 right-5 z-[100] px-6 py-4 rounded-lg shadow-lg text-white transition-opacity duration-300";
    const typeClasses = type === 'success' ? "bg-green-500" : "bg-red-500";

    return (
        <div className={`${baseClasses} ${typeClasses}`} role="alert">
            <span className="font-bold">{type === 'success' ? 'Berhasil' : 'Gagal'}:</span> {message}
        </div>
    );
};


const PegawaiPage: React.FC<PegawaiPageProps> = ({ user, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState<string>('beranda');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [pegawai, setPegawai] = useState<UserProfile | null>(null);
  const [jadwal, setJadwal] = useState<JadwalKerja[]>([]);
  const [usulanCuti, setUsulanCuti] = useState<UsulanCuti[]>([]);
  const [usulanLembur, setUsulanLembur] = useState<UsulanLembur[]>([]);
  const [usulanSubstitusi, setUsulanSubstitusi] = useState<UsulanSubstitusi[]>([]);
  const [usulanPembetulan, setUsulanPembetulan] = useState<UsulanPembetulanPresensi[]>([]);
  const [presensi, setPresensi] = useState<Presensi[]>([]);
  const [allPegawai, setAllPegawai] = useState<UserProfile[]>([]);
  const [allJadwal, setAllJadwal] = useState<JadwalKerja[]>([]);
  const [shiftConfigs, setShiftConfigs] = useState<ShiftConfig[]>([]);
  const [vendorConfigs, setVendorConfigs] = useState<VendorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isIzinSakitModalOpen, setIsIzinSakitModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Usulan | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceAction, setAttendanceAction] = useState<'in' | 'out'>('in');
  const [isLemburModalOpen, setIsLemburModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<{ id: string; type: 'cuti' | 'lembur' | 'substitusi' | 'pembetulan' } | null>(null);
  const [cutiToCancelId, setCutiToCancelId] = useState<string | null>(null);


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        pegawaiData,
        jadwalData,
        cutiData,
        lemburData,
        substitusiData,
        pembetulanData,
        allPegawaiData,
        allJadwalData,
        shiftConfigsData,
        presensiData,
        vendorConfigsData,
      ] = await Promise.all([
        apiService.getUserProfileByNik(user.nik),
        apiService.getJadwalByNik(user.nik),
        apiService.getCutiByNik(user.nik),
        apiService.getLemburByNik(user.nik),
        apiService.getSubstitusiByNik(user.nik),
        apiService.getPembetulanPresensiByNik(user.nik),
        apiService.getAllUserProfiles(),
        apiService.getAllJadwal(),
        apiService.getShiftConfigs(),
        apiService.getPresensiByNik(user.nik),
        apiService.getAllVendorConfigs(),
      ]);
      setPegawai(pegawaiData);
      setJadwal(jadwalData);
      setUsulanCuti(cutiData);
      setUsulanLembur(lemburData);
      setUsulanSubstitusi(substitusiData);
      setUsulanPembetulan(pembetulanData);
      setPresensi(presensiData);
      setAllPegawai(allPegawaiData.sort((a, b) => (a.nik || '').localeCompare(b.nik || '')));
      setAllJadwal(allJadwalData);
      setShiftConfigs(shiftConfigsData);
      setVendorConfigs(vendorConfigsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.nik]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (!mobile) {
            setIsSidebarOpen(true); // Always open on desktop
        } else {
            setIsSidebarOpen(false); // Default to closed on mobile
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleProposalSubmitted = () => {
    setIsProposalModalOpen(false);
    setEditingProposal(null);
    fetchData(); 
  }

  const handleLemburSubmitted = () => {
    setIsLemburModalOpen(false);
    setAlert({ message: 'Ajuan lembur berhasil dikirim.', type: 'success' });
    fetchData();
  }

  const todayPresensi = useMemo(() => {
      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      return presensi.find(p => p.tanggal === todayStr);
  }, [presensi]);

  const handleAttendanceClick = (action: 'in' | 'out') => {
    if (action === 'in') {
      if (todayPresensi?.clockInTimestamp) {
        setAlert({ message: 'Anda sudah melakukan clock-in hari ini.', type: 'error' });
        return;
      }
    }

    if (action === 'out') {
      if (!todayPresensi?.clockInTimestamp) {
        setAlert({ message: 'Anda harus clock-in terlebih dahulu sebelum clock-out.', type: 'error' });
        return;
      }
      if (todayPresensi?.clockOutTimestamp) {
        setAlert({ message: 'Anda sudah melakukan clock-out hari ini.', type: 'error' });
        return;
      }
    }

    setAttendanceAction(action);
    setIsAttendanceModalOpen(true);
  };

    const handleAttendanceSuccess = (message: string) => {
        setIsAttendanceModalOpen(false);
        setAlert({ message, type: 'success' });
        fetchData();
    };

    const handleAttendanceError = (message: string) => {
        setIsAttendanceModalOpen(false);
        setAlert({ message, type: 'error' });
    };

    const handleDeleteProposal = (proposalId: string, type: 'cuti' | 'lembur' | 'substitusi' | 'pembetulan') => {
        setProposalToDelete({ id: proposalId, type });
        setIsConfirmModalOpen(true);
    };
    
    const handleConfirmDelete = async () => {
        if (!proposalToDelete) return;
        try {
            await apiService.deleteProposal(proposalToDelete.id, proposalToDelete.type);
            setAlert({ message: 'Ajuan berhasil dihapus.', type: 'success' });
            fetchData();
        } catch (error) {
            console.error('Failed to delete proposal:', error);
            setAlert({ message: 'Gagal menghapus ajuan.', type: 'error' });
        }
        setProposalToDelete(null);
    };
    
    const handleRequestCutiCancellation = (id: string) => {
        setCutiToCancelId(id);
    };

    const handleConfirmCutiCancellation = async () => {
        if (!cutiToCancelId) return;
        try {
            await apiService.requestCutiCancellation(cutiToCancelId);
            setAlert({ message: 'Pengajuan pembatalan berhasil dikirim.', type: 'success' });
            fetchData();
        } catch (error) {
            console.error('Failed to request cancellation:', error);
            setAlert({ message: 'Gagal mengajukan pembatalan.', type: 'error' });
        }
        setCutiToCancelId(null);
    };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  const renderContent = () => {
    const allUsulan = [...usulanCuti, ...usulanLembur, ...usulanSubstitusi, ...usulanPembetulan];
    switch (activeMenu) {
        case 'beranda':
            return <DashboardContent 
                        user={user}
                        onAttend={handleAttendanceClick}
                        jadwal={jadwal}
                        todayPresensi={todayPresensi}
                        usulan={allUsulan}
                    />;
        case 'cuti':
            return <CutiView
                        user={user}
                        usulanCuti={usulanCuti}
                        allPegawai={allPegawai}
                        jadwal={jadwal}
                        onDataChange={fetchData}
                        onDeleteAjuan={(id) => handleDeleteProposal(id, 'cuti')}
                        onAjukanPembatalan={handleRequestCutiCancellation}
                    />;
        case 'izinSakit':
            return <IzinSakitView
                usulanIzinSakit={usulanCuti.filter(u => u.jenisAjuan === UsulanJenis.IzinSakit)}
                onBuatAjuan={() => setIsIzinSakitModalOpen(true)}
                onDeleteAjuan={(id) => handleDeleteProposal(id, 'cuti')}
            />;
        case 'pembatalanCuti':
            return <CutiView
                        user={user}
                        usulanCuti={usulanCuti}
                        allPegawai={allPegawai}
                        jadwal={jadwal}
                        onDataChange={fetchData}
                        onDeleteAjuan={(id) => handleDeleteProposal(id, 'cuti')}
                        onAjukanPembatalan={handleRequestCutiCancellation}
                        initialTab="pembatalan"
                    />;
        case 'lembur':
            return <LemburView 
                        user={user}
                        onAdd={() => setIsLemburModalOpen(true)} 
                        usulanLembur={usulanLembur} 
                        usulanCuti={usulanCuti}
                        usulanPembetulan={usulanPembetulan}
                        jadwal={jadwal}
                        shiftConfigs={shiftConfigs}
                        onDelete={(id) => handleDeleteProposal(id, 'lembur')}
                        presensi={presensi}
                        allPegawai={allPegawai}
                        vendorConfigs={vendorConfigs}
                    />;
        case 'substitusi':
            return <SubstitusiView
                        user={user}
                        usulanSubstitusi={usulanSubstitusi}
                        jadwal={jadwal}
                        shiftConfigs={shiftConfigs}
                        onDataChange={fetchData}
                        onDelete={(id) => handleDeleteProposal(id, 'substitusi')}
                    />;
        case 'jadwalShift':
            return <ShiftScheduleView 
                        schedules={allJadwal} 
                        employees={allPegawai.filter(e => e.role === 'Pegawai')} 
                        shiftConfigs={shiftConfigs} 
                    />;
        case 'presensi':
             return pegawai ? <PresensiHistoryView presensiHistory={presensi} schedules={jadwal} employee={pegawai} shiftConfigs={shiftConfigs} loggedInUser={user} pembetulanHistory={usulanPembetulan} /> : <p>Loading...</p>;
        case 'laporanPresensi':
            return <LaporanPresensiPage
                        user={user}
                        jadwal={jadwal}
                        presensi={presensi}
                        usulanLembur={usulanLembur}
                        usulanCuti={usulanCuti}
                        shiftConfigs={shiftConfigs}
                        vendorConfigs={vendorConfigs}
                    />;
        case 'personal':
            return pegawai ? <PersonalTab user={pegawai} onDataChange={fetchData} /> : <p>Loading profile...</p>;
        default:
            return <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-slate-800">{activeMenu.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h2>
                <p className="mt-4 text-slate-600">This feature is under construction. Please check back later.</p>
            </div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      {alert && <TimedAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
       {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <Sidebar 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            user={user} 
            onLogout={onLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {renderContent()}
            </div>
        </main>
      </div>
      <ProposalFormModal 
        isOpen={isProposalModalOpen} 
        onClose={() => { setIsProposalModalOpen(false); setEditingProposal(null); }} 
        user={user}
        onSuccess={handleProposalSubmitted}
        jadwal={jadwal}
        allPegawai={allPegawai}
        allJadwal={allJadwal}
        proposalToEdit={editingProposal}
      />
      <AjuanIzinSakitModal
        isOpen={isIzinSakitModalOpen}
        onClose={() => setIsIzinSakitModalOpen(false)}
        onSuccess={() => {
            setIsIzinSakitModalOpen(false);
            setAlert({ message: 'Ajuan Izin/Sakit berhasil dikirim.', type: 'success' });
            fetchData();
        }}
        user={user}
      />
      <ClockInModal 
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSuccess={handleAttendanceSuccess}
        onError={handleAttendanceError}
        user={user}
        actionType={attendanceAction}
        jadwal={jadwal}
      />
      <TambahLemburModal
        isOpen={isLemburModalOpen}
        onClose={() => setIsLemburModalOpen(false)}
        onSuccess={handleLemburSubmitted}
        user={user}
        jadwal={jadwal}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Ajuan"
        message="Apakah Anda yakin ingin menghapus ajuan ini? Tindakan ini tidak dapat diurungkan."
      />
      <ConfirmationModal
        isOpen={!!cutiToCancelId}
        onClose={() => setCutiToCancelId(null)}
        onConfirm={handleConfirmCutiCancellation}
        title="Ajukan Pembatalan Cuti"
        message="Apakah Anda yakin ingin mengajukan pembatalan untuk cuti ini? Permintaan akan dikirim ke atasan untuk persetujuan."
        confirmText="Ya, Ajukan"
      />
    </div>
  );
};

export default PegawaiPage;
