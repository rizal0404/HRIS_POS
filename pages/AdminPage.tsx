import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserProfile, JadwalKerja, UsulanCuti, UsulanLembur, Usulan, ShiftConfig, Presensi, UsulanSubstitusi, Seksi, UnitKerja, VendorConfig, UsulanPembetulanPresensi, LeaveQuota, UserRole, UsulanJenis, UsulanStatus, UsulanIzinSakit } from '../types';
import { apiService } from '../services/apiService';

// Icons
import { HomeIcon, UsersIcon, FileTextIcon, CogIcon, GridIcon, LogOutIcon, MenuIcon, SearchIcon, CalendarIcon, ClockIcon, SitemapIcon, PlaneIcon, XIcon, ArrowLeftRightIcon, UserCheckIcon, UserIcon, BellIcon, AlertTriangleIcon } from '../components/Icons';

// Tab components
import { DashboardTab } from './admin/DashboardTab';
import { EmployeesTab } from './admin/EmployeesTab';
import { ProposalsTab } from './admin/ProposalsTab';
import { ShiftScheduleView } from '../components/ShiftScheduleView';
import { ShiftConfigTab } from './admin/ShiftConfigTab';
import { DataConfigTab } from './admin/DataConfigTab';
import { AdminPresensiTab } from './admin/AdminPresensiTab';
import { LaporanTab } from './admin/LaporanTab';
import { LemburMonitoringTab } from './admin/LemburMonitoringTab';
import { QuotaCutiBawahanTab } from './admin/QuotaCutiBawahanTab';
import { RekapLemburBawahanTab } from './admin/RekapLemburBawahanTab';
import { LaporanPresensiTab } from './admin/LaporanPresensiTab';

// Other components
import { Logo } from '../components/Logo';
import Modal from '../components/Modal';
import { ProposalDetailModal } from '../components/ProposalDetailModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface AdminPageProps {
  user: UserProfile;
  onLogout: () => void;
}

const Sidebar: React.FC<{
  isOpen: boolean;
  isMobile: boolean;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  onClose: () => void;
  user: UserProfile;
}> = ({ isOpen, isMobile, activeMenu, setActiveMenu, onClose, user }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const allMenuItems = [
    { id: 'beranda', title: 'Beranda', icon: <HomeIcon /> },
    { type: 'divider', title: 'Manajemen Ajuan' },
    { id: 'persetujuanCuti', title: 'Persetujuan Cuti', icon: <CalendarIcon /> },
    { id: 'persetujuanIzinSakit', title: 'Persetujuan Izin/Sakit', icon: <FileTextIcon /> },
    { id: 'persetujuanLembur', title: 'Persetujuan Lembur', icon: <ClockIcon /> },
    { id: 'persetujuanSubstitusi', title: 'Persetujuan Substitusi', icon: <ArrowLeftRightIcon /> },
    { id: 'persetujuanPembetulan', title: 'Persetujuan Pembetulan', icon: <UserCheckIcon /> },
    { type: 'divider', title: 'Manajemen Tim' },
    { id: 'dataManajemen', title: 'Data Manajemen', icon: <UsersIcon /> },
    { id: 'dataPegawai', title: 'Data Pegawai', icon: <UsersIcon /> },
    { id: 'jadwalShift', title: 'Jadwal Shift Tim', icon: <GridIcon /> },
    { id: 'presensiTim', title: 'Presensi Tim', icon: <UserCheckIcon /> },
    { type: 'divider', title: 'Laporan' },
    { id: 'laporan', title: 'Download Laporan', icon: <FileTextIcon /> },
    { id: 'laporanPresensi', title: 'Laporan Presensi', icon: <FileTextIcon /> },
    { id: 'monitoringLembur', title: 'Monitoring Lembur', icon: <FileTextIcon /> },
    { id: 'rekapLembur', title: 'Rekap Lembur Bawahan', icon: <FileTextIcon /> },
    { id: 'quotaCuti', title: 'Quota Cuti Bawahan', icon: <FileTextIcon /> },
    { type: 'divider', title: 'Konfigurasi' },
    { id: 'konfigurasiShift', title: 'Konfigurasi Shift', icon: <CogIcon /> },
    { id: 'konfigurasiSeksi', title: 'Data Seksi', icon: <CogIcon /> },
    { id: 'konfigurasiUnit', title: 'Data Unit Kerja', icon: <CogIcon /> },
    { id: 'konfigurasiVendor', title: 'Data Vendor', icon: <CogIcon /> },
  ];

  const menuItems = useMemo(() => {
    // For Admin, show a restricted set of menus
    if (user.role === UserRole.Admin) {
        const forbiddenIds = new Set([
            'persetujuanCuti',
            'persetujuanIzinSakit',
            'persetujuanLembur', 
            'persetujuanSubstitusi', 
            'persetujuanPembetulan',
            'dataManajemen',
            'dataPegawai',
            'konfigurasiShift',
            'konfigurasiSeksi',
            'konfigurasiUnit',
            'konfigurasiVendor'
        ]);
        const forbiddenTitles = new Set([
            'Manajemen Ajuan',
            'Konfigurasi'
        ]);

        return allMenuItems.filter(item => {
            if ('type' in item && item.type === 'divider') {
                return !forbiddenTitles.has(item.title);
            }
            if ('id' in item) {
                return !forbiddenIds.has(item.id);
            }
            return true;
        });
    }

    // For all other roles (SuperAdmin, Manager), show all menus.
    return allMenuItems;
  }, [user.role]);


  const filteredMenuItems = menuItems.filter(item =>
    item.type === 'divider' || item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpanded = isOpen || !isMobile;

  return (
    <aside className={`bg-white flex flex-col transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isExpanded ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-center h-16 border-b shrink-0 px-4">
        <Logo className={isExpanded ? "h-10 object-contain" : "h-8 w-16 object-contain"}/>
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
                    if (isMobile) onClose();
                  }}
                  className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${ activeMenu === item.id ? 'bg-red-50 text-red-700 font-bold border-r-4 border-red-500' : 'text-gray-600 hover:bg-gray-100' }`}
                  title={item.title}
                >
                  <span className="shrink-0">{React.cloneElement(item.icon, { className: 'w-6 h-6' })}</span>
                  <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>{item.title}</span>
                </button>
              </li>
            )
          )}
        </ul>
      </nav>
    </aside>
  );
};

const parseCustomTimestamp = (ts: string): Date => {
    const parts = ts.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) return new Date(0); // fallback to a very old date
    const [, day, month, year, hour, minute, second] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
};

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit lalu";
    return "Baru saja";
};

const TopBar: React.FC<{ 
  onToggleSidebar: () => void; 
  user: UserProfile | null; 
  onLogout: () => void;
  notifications: Usulan[];
  onNotificationClick: (proposal: Usulan) => void;
}> = ({ onToggleSidebar, user, onLogout, notifications, onNotificationClick }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);
  
  const getNotificationIcon = (jenis: UsulanJenis) => {
    switch(jenis) {
      case UsulanJenis.CutiTahunan:
      case UsulanJenis.CutiBesar:
        return <CalendarIcon className="w-5 h-5 text-blue-500" />;
      case UsulanJenis.IzinSakit:
        return <FileTextIcon className="w-5 h-5 text-green-500" />;
      case UsulanJenis.Lembur:
        return <ClockIcon className="w-5 h-5 text-orange-500" />;
      case UsulanJenis.Substitusi:
        return <ArrowLeftRightIcon className="w-5 h-5 text-purple-500" />;
      case UsulanJenis.PembetulanPresensi:
        return <UserCheckIcon className="w-5 h-5 text-teal-500" />;
      default:
        return <FileTextIcon className="w-5 h-5 text-gray-500" />;
    }
  }

  return (
    <header className="bg-white h-16 flex items-center justify-between px-4 sm:px-6 border-b shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
            <button onClick={onToggleSidebar} className="text-gray-500 hover:text-gray-700 md:hidden">
                <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">HR Dashboard</h1>
        </div>
      
        <div className="flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="text-gray-500 hover:text-gray-700 relative" aria-label="Notifikasi">
                  <BellIcon className="w-6 h-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center">{notifications.length}</span>
                    </span>
                  )}
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20 border">
                  <div className="py-2 px-4 border-b">
                    <h3 className="font-semibold text-gray-800">Notifikasi</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => { onNotificationClick(n); setIsNotificationsOpen(false); }} className="flex items-start gap-3 p-3 hover:bg-gray-100 cursor-pointer border-b">
                          <div className="flex-shrink-0 mt-1">{getNotificationIcon(n.jenisAjuan)}</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{n.nama}</p>
                            <p className="text-xs text-gray-600">
                              {n.status === UsulanStatus.PembatalanDiajukan
                                ? `Mengajukan pembatalan ${n.jenisAjuan}`
                                : `Mengajukan ${n.jenisAjuan}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{timeSince(parseCustomTimestamp(n.timestamp))}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 text-gray-500">
                        <AlertTriangleIcon className="w-12 h-12 mx-auto text-gray-300"/>
                        <p className="mt-2 text-sm">Tidak ada notifikasi baru.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="hidden sm:block font-semibold text-gray-700">{user?.name}</span>
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-700" aria-label="Logout">
                <LogOutIcon className="w-6 h-6" />
            </button>
        </div>
    </header>
  );
};

const getProposalType = (proposal: Usulan): 'cuti' | 'lembur' | 'substitusi' | 'pembetulan' | 'izinSakit' => {
    switch (proposal.jenisAjuan) {
        case UsulanJenis.CutiTahunan:
        case UsulanJenis.CutiBesar:
            return 'cuti';
        case UsulanJenis.IzinSakit:
            return 'izinSakit';
        case UsulanJenis.Lembur:
            return 'lembur';
        case UsulanJenis.Substitusi:
            return 'substitusi';
        case UsulanJenis.PembetulanPresensi:
            return 'pembetulan';
        default:
            throw new Error('Unknown proposal type');
    }
}

const AdminPage: React.FC<AdminPageProps> = ({ user, onLogout }) => {
    const [activeMenu, setActiveMenu] = useState('beranda');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [allManajemen, setAllManajemen] = useState<UserProfile[]>([]);
    const [allPegawai, setAllPegawai] = useState<UserProfile[]>([]);
    const [allSchedules, setAllSchedules] = useState<JadwalKerja[]>([]);
    const [allCuti, setAllCuti] = useState<UsulanCuti[]>([]);
    const [allIzinSakit, setAllIzinSakit] = useState<UsulanIzinSakit[]>([]);
    const [allLembur, setAllLembur] = useState<UsulanLembur[]>([]);
    const [allSubstitusi, setAllSubstitusi] = useState<UsulanSubstitusi[]>([]);
    const [allPembetulan, setAllPembetulan] = useState<UsulanPembetulanPresensi[]>([]);
    const [allPresensi, setAllPresensi] = useState<Presensi[]>([]);
    const [allShiftConfigs, setAllShiftConfigs] = useState<ShiftConfig[]>([]);
    const [allSeksi, setAllSeksi] = useState<Seksi[]>([]);
    const [allUnitKerja, setAllUnitKerja] = useState<UnitKerja[]>([]);
    const [allVendorConfigs, setAllVendorConfigs] = useState<VendorConfig[]>([]);
    const [allLeaveQuotas, setAllLeaveQuotas] = useState<LeaveQuota[]>([]);
    
    // Modal states
    const [proposalToView, setProposalToView] = useState<Usulan | null>(null);
    const [proposalToActOn, setProposalToActOn] = useState<Usulan | null>(null);
    const [rejectionNote, setRejectionNote] = useState('');
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                manajemen, pegawai, schedules, cuti, izinSakit, lembur, substitusi, pembetulan, presensi,
                shiftConfigs, seksi, unitKerja, vendorConfigs, leaveQuotas
            ] = await Promise.all([
                apiService.getManagementProfiles(),
                apiService.getPegawaiProfiles(),
                apiService.getAllJadwal(),
                apiService.getAllCuti(),
                apiService.getAllIzinSakit(),
                apiService.getAllLembur(),
                apiService.getAllSubstitusi(),
                apiService.getAllPembetulanPresensi(),
                apiService.getAllPresensi(),
                apiService.getShiftConfigs(),
                apiService.getAllSeksi(),
                apiService.getAllUnitKerja(),
                apiService.getAllVendorConfigs(),
                apiService.getAllLeaveQuotas(),
            ]);
            setAllManajemen(manajemen);
            setAllPegawai(pegawai);
            setAllSchedules(schedules);
            setAllCuti(cuti);
            setAllIzinSakit(izinSakit);
            setAllLembur(lembur);
            setAllSubstitusi(substitusi);
            setAllPembetulan(pembetulan);
            setAllPresensi(presensi);
            setAllShiftConfigs(shiftConfigs);
            setAllSeksi(seksi);
            setAllUnitKerja(unitKerja);
            setAllVendorConfigs(vendorConfigs);
            setAllLeaveQuotas(leaveQuotas);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setIsSidebarOpen(!mobile);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const allEmployees = useMemo(() => [...allManajemen, ...allPegawai], [allManajemen, allPegawai]);

    const subordinates = useMemo(() => {
        if (user.role === UserRole.SuperAdmin) {
            return allEmployees;
        }
        if (user.role === UserRole.Admin) {
            return allPegawai;
        }
        if (user.role === UserRole.Manager) {
            return allEmployees.filter(e => e.managerId === user.id || e.id === user.id);
        }
        return [user];
    }, [user, allEmployees, allPegawai]);

    const proposalsForUser = useMemo(() => {
        const subordinateNiks = new Set(subordinates.map(e => e.nik));
        const allProposals: Usulan[] = [...allCuti, ...allIzinSakit, ...allLembur, ...allSubstitusi, ...allPembetulan];
        if (user.role === UserRole.SuperAdmin) {
            return allProposals;
        }
        return allProposals.filter(p => subordinateNiks.has(p.nik));
    }, [subordinates, allCuti, allIzinSakit, allLembur, allSubstitusi, allPembetulan, user.role]);

    const proposalsForLaporan = useMemo(() => {
        const combinedProposals: Usulan[] = [...allCuti, ...allIzinSakit, ...allLembur, ...allSubstitusi];
        if (user.role === UserRole.Admin) {
            return combinedProposals.filter(p => allPegawai.some(e => e.nik === p.nik));
        }
        return combinedProposals;
    }, [user, allPegawai, allCuti, allIzinSakit, allLembur, allSubstitusi]);


    const handleApprove = async (proposal: Usulan) => {
        const type = getProposalType(proposal);
        await apiService.updateProposalStatus(proposal.id, type, UsulanStatus.Disetujui);
        setProposalToView(null);
        fetchData();
    };

    const handleReject = (proposal: Usulan) => {
        setProposalToActOn(proposal);
        setIsRejectionModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!proposalToActOn) return;
        const type = getProposalType(proposalToActOn);
        const status = rejectionNote ? UsulanStatus.Revisi : UsulanStatus.Ditolak;
        await apiService.updateProposalStatus(proposalToActOn.id, type, status, rejectionNote || 'Ditolak oleh atasan.');
        setIsRejectionModalOpen(false);
        setProposalToActOn(null);
        setRejectionNote('');
        setProposalToView(null);
        fetchData();
    };

    const handleApproveCancellation = async (proposal: Usulan) => {
        const type = getProposalType(proposal);
        if (type !== 'cuti' && type !== 'izinSakit') return;
        await apiService.updateProposalStatus(proposal.id, type, UsulanStatus.Dibatalkan, 'Pembatalan disetujui oleh atasan.');
        setProposalToView(null);
        fetchData();
    };

    const handleRejectCancellation = async (proposal: Usulan) => {
        const type = getProposalType(proposal);
        if (type !== 'cuti' && type !== 'izinSakit') return;
        await apiService.updateProposalStatus(proposal.id, type, UsulanStatus.Disetujui, 'Pembatalan ditolak oleh atasan.');
        setProposalToView(null);
        fetchData();
    };

    const handleBulkAction = async (ids: string[], action: 'approve' | 'reject') => {
        const status = action === 'approve' ? UsulanStatus.Disetujui : UsulanStatus.Ditolak;
        const allProposals: Usulan[] = [...allCuti, ...allIzinSakit, ...allLembur, ...allSubstitusi, ...allPembetulan];
        const proposalsToUpdate = allProposals.filter(p => ids.includes(p.id));

        for (const p of proposalsToUpdate) {
            const type = getProposalType(p);
            try {
                await apiService.updateProposalStatus(p.id, type, status, action === 'reject' ? 'Ditolak massal' : undefined);
            } catch (error) {
                console.error(`Gagal ${action} ajuan ${p.id}:`, error);
            }
        }
        fetchData();
    };

    const handleNotificationClick = (proposal: Usulan) => {
        let targetMenu = '';
        switch (proposal.jenisAjuan) {
            case UsulanJenis.CutiTahunan:
            case UsulanJenis.CutiBesar:
                targetMenu = 'persetujuanCuti';
                break;
            case UsulanJenis.IzinSakit:
                targetMenu = 'persetujuanIzinSakit';
                break;
            case UsulanJenis.Lembur:
                targetMenu = 'persetujuanLembur';
                break;
            case UsulanJenis.Substitusi:
                targetMenu = 'persetujuanSubstitusi';
                break;
            case UsulanJenis.PembetulanPresensi:
                targetMenu = 'persetujuanPembetulan';
                break;
        }
        if (targetMenu) {
            setActiveMenu(targetMenu);
            setProposalToView(proposal);
        }
    };

    const pendingProposals = useMemo(() => {
        return proposalsForUser
            .filter(p => p.status === UsulanStatus.Diajukan || p.status === UsulanStatus.PembatalanDiajukan)
            .sort((a, b) => parseCustomTimestamp(b.timestamp).getTime() - parseCustomTimestamp(a.timestamp).getTime());
    }, [proposalsForUser]);


    const renderContent = () => {
        if (isLoading) {
            return <div className="flex items-center justify-center h-full"><p>Loading data...</p></div>;
        }

        const canEditConfig = user.role === UserRole.SuperAdmin;

        switch (activeMenu) {
            case 'beranda':
                return <DashboardTab proposals={proposalsForUser} employees={subordinates} />;
            case 'persetujuanCuti':
                return <ProposalsTab title="Persetujuan Cuti" proposals={proposalsForUser.filter(p => p.jenisAjuan === UsulanJenis.CutiTahunan || p.jenisAjuan === UsulanJenis.CutiBesar)} employees={allEmployees} onViewDetails={setProposalToView} onApproveClick={handleApprove} onRejectClick={handleReject} canApprove={true} onPreviewClick={() => {}} onBulkApprove={(ids) => handleBulkAction(ids, 'approve')} onBulkReject={(ids) => handleBulkAction(ids, 'reject')} />;
            case 'persetujuanIzinSakit':
                return <ProposalsTab title="Persetujuan Izin/Sakit" proposals={proposalsForUser.filter(p => p.jenisAjuan === UsulanJenis.IzinSakit)} employees={allEmployees} onViewDetails={setProposalToView} onApproveClick={handleApprove} onRejectClick={handleReject} canApprove={true} onPreviewClick={() => {}} onBulkApprove={(ids) => handleBulkAction(ids, 'approve')} onBulkReject={(ids) => handleBulkAction(ids, 'reject')} />;
            case 'persetujuanLembur':
                return <ProposalsTab title="Persetujuan Lembur" proposals={proposalsForUser.filter(p => p.jenisAjuan === UsulanJenis.Lembur)} employees={allEmployees} onViewDetails={setProposalToView} onApproveClick={handleApprove} onRejectClick={handleReject} canApprove={true} onPreviewClick={() => {}} onBulkApprove={(ids) => handleBulkAction(ids, 'approve')} onBulkReject={(ids) => handleBulkAction(ids, 'reject')} />;
            case 'persetujuanSubstitusi':
                return <ProposalsTab title="Persetujuan Substitusi" proposals={proposalsForUser.filter(p => p.jenisAjuan === UsulanJenis.Substitusi)} employees={allEmployees} onViewDetails={setProposalToView} onApproveClick={handleApprove} onRejectClick={handleReject} canApprove={true} onPreviewClick={() => {}} onBulkApprove={(ids) => handleBulkAction(ids, 'approve')} onBulkReject={(ids) => handleBulkAction(ids, 'reject')} />;
            case 'persetujuanPembetulan':
                return <ProposalsTab title="Persetujuan Pembetulan" proposals={proposalsForUser.filter(p => p.jenisAjuan === UsulanJenis.PembetulanPresensi)} employees={allEmployees} onViewDetails={setProposalToView} onApproveClick={handleApprove} onRejectClick={handleReject} canApprove={true} onPreviewClick={() => {}} onBulkApprove={(ids) => handleBulkAction(ids, 'approve')} onBulkReject={(ids) => handleBulkAction(ids, 'reject')} />;
            case 'dataManajemen':
                return <EmployeesTab employees={allManajemen} allEmployees={allEmployees} allSeksi={allSeksi} allUnitKerja={allUnitKerja} onDataChange={fetchData} mode="manajemen" />;
            case 'dataPegawai':
                return <EmployeesTab employees={allPegawai} allEmployees={allEmployees} allSeksi={allSeksi} allUnitKerja={allUnitKerja} onDataChange={fetchData} mode="pegawai" />;
            case 'jadwalShift':
                return <ShiftScheduleView schedules={allSchedules} employees={allPegawai} shiftConfigs={allShiftConfigs} showAdminControls onDataChange={fetchData} allSeksi={allSeksi} allUnitKerja={allUnitKerja} />;
            case 'presensiTim':
                return <AdminPresensiTab allPresensi={allPresensi} schedules={allSchedules} employees={subordinates} shiftConfigs={allShiftConfigs} loggedInUser={user} allPembetulanPresensi={allPembetulan} />;
            case 'laporan':
                return <LaporanTab proposals={proposalsForLaporan} />;
            case 'laporanPresensi':
                return <LaporanPresensiTab employees={subordinates} allSchedules={allSchedules} allPresensi={allPresensi} allLembur={allLembur} allCuti={allCuti} allShiftConfigs={allShiftConfigs} allVendorConfigs={allVendorConfigs} allPembetulan={allPembetulan} />;
            case 'monitoringLembur':
                return <LemburMonitoringTab employeesForDropdown={subordinates} allUsulanLembur={allLembur} allUsulanCuti={allCuti} allUsulanPembetulan={allPembetulan} allSchedules={allSchedules} allShiftConfigs={allShiftConfigs} allPresensi={allPresensi} allEmployees={allEmployees} allVendorConfigs={allVendorConfigs} />;
            case 'rekapLembur':
                return <RekapLemburBawahanTab employees={subordinates} allLembur={allLembur} />;
            case 'quotaCuti':
                return <QuotaCutiBawahanTab employees={subordinates} allCuti={allCuti} leaveQuotas={allLeaveQuotas} />;
            case 'konfigurasiShift':
                return <ShiftConfigTab shiftConfigs={allShiftConfigs} onDataChange={fetchData} canEdit={canEditConfig} />;
            case 'konfigurasiSeksi':
                return <DataConfigTab title="Data Seksi" itemTitle="Seksi" items={allSeksi} fields={[{name: 'name', label: 'Nama Seksi'}]} onDataChange={fetchData} api={{add: apiService.addSeksi, update: apiService.updateSeksi, delete: apiService.deleteSeksi}} />;
            case 'konfigurasiUnit':
                return <DataConfigTab title="Data Unit Kerja" itemTitle="Unit Kerja" items={allUnitKerja} fields={[{name: 'name', label: 'Nama Unit'}]} onDataChange={fetchData} api={{add: apiService.addUnitKerja, update: apiService.updateUnitKerja, delete: apiService.deleteUnitKerja}} />;
            case 'konfigurasiVendor':
                return <DataConfigTab title="Data Vendor" itemTitle="Vendor" items={allVendorConfigs} fields={[{name: 'namaVendor', label: 'Nama Vendor'}, {name: 'namaAdmin', label: 'Nama Admin'}]} onDataChange={fetchData} api={{add: apiService.addVendorConfig, update: apiService.updateVendorConfig, delete: apiService.deleteVendorConfig}} />;
            default:
                return <div>Pilih menu</div>;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
            {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsSidebarOpen(false)}></div>}
            <Sidebar user={user} isOpen={isSidebarOpen} isMobile={isMobile} activeMenu={activeMenu} setActiveMenu={setActiveMenu} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={user} onLogout={onLogout} notifications={pendingProposals} onNotificationClick={handleNotificationClick} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="p-4 sm:p-6 lg:p-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
            
            {proposalToView && (
                <ProposalDetailModal
                    proposal={proposalToView}
                    employees={allEmployees}
                    onClose={() => setProposalToView(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onApproveCancellation={handleApproveCancellation}
                    onRejectCancellation={handleRejectCancellation}
                />
            )}

            {isRejectionModalOpen && (
                <Modal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} title="Tolak / Minta Revisi Ajuan">
                    <div className="space-y-4">
                        <p>Berikan catatan untuk penolakan atau permintaan revisi. Kosongkan jika hanya ingin menolak.</p>
                        <textarea
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                            rows={4}
                            className="w-full form-textarea rounded-md"
                            placeholder="Contoh: Silakan lampirkan surat dokter..."
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsRejectionModalOpen(false)} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                            <button onClick={handleConfirmReject} className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700">Kirim</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminPage;