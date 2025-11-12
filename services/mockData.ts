import { UserProfile, JadwalKerja, UsulanCuti, UsulanLembur, UserRole, UsulanStatus, UsulanJenis, Shift, ShiftConfig, UsulanSubstitusi, Seksi, UnitKerja, VendorConfig, LeaveQuota } from '../types';

export const mockUserProfiles: UserProfile[] = [
    { id: 'amiruddin@example.com', email: 'amiruddin@example.com', name: 'AMIRUDDIN', role: UserRole.SuperAdmin, nik: '00004491', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 1', noHp: '0810000001', totalCutiTahunan: 12 },
    { id: 'arman@example.com', email: 'arman@example.com', name: 'ARMAN NAM', role: UserRole.Pegawai, nik: '00005950', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 2', noHp: '0810000002', totalCutiTahunan: 12, managerId: 'aswin@example.com' },
    { id: 'aswin@example.com', email: 'aswin@example.com', name: 'ASWIN BAHAR', role: UserRole.Manager, nik: '00005999', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 3', noHp: '0810000003', totalCutiTahunan: 12 },
    { id: 'dedi@example.com', email: 'dedi@example.com', name: 'DEDI FARID RAMU', role: UserRole.Pegawai, nik: '00005408', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 4', noHp: '0810000004', totalCutiTahunan: 12, managerId: 'aswin@example.com' },
    { id: 'ferdiansyah@example.com', email: 'ferdiansyah@example.com', name: 'FERDIANSYAH ANUGRAH', role: UserRole.Pegawai, nik: '00006079', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 5', noHp: '0810000005', totalCutiTahunan: 12, managerId: 'aswin@example.com' },
    { id: 'hafluddin@example.com', email: 'hafluddin@example.com', name: 'HAFLUDDIN', role: UserRole.Pegawai, nik: '00004792', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 6', noHp: '0810000006', totalCutiTahunan: 12 },
    { id: 'hambali@example.com', email: 'hambali@example.com', name: 'HAMBALI KAQU', role: UserRole.Pegawai, nik: '00004970', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 7', noHp: '0810000007', totalCutiTahunan: 12 },
    { id: 'harjuna@example.com', email: 'harjuna@example.com', name: 'HARJUNA', role: UserRole.Pegawai, nik: '00005201', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 8', noHp: '0810000008', totalCutiTahunan: 12 },
    { id: 'heriyawal@example.com', email: 'heriyawal@example.com', name: 'HERIYAWAL', role: UserRole.Pegawai, nik: '00005414', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 9', noHp: '0810000009', totalCutiTahunan: 12 },
    { id: 'ismail@example.com', email: 'ismail@example.com', name: 'ISMAIL IBRAHIM', role: UserRole.Pegawai, nik: '00006196', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 10', noHp: '0810000010', totalCutiTahunan: 12 },
    { id: 'muhammad@example.com', email: 'muhammad@example.com', name: 'MUHAMMAD APRIS CAM', role: UserRole.Pegawai, nik: '00005428', posisi: 'Analis', shiftKerja: 'Shift', seksi: 'QC 45', unitKerja: 'Unit QC', alamat: 'Alamat 11', noHp: '0810000011', totalCutiTahunan: 12 },
    { id: 'admin@example.com', email: 'admin@example.com', name: 'ADMIN HRD', role: UserRole.Admin, nik: '00000001', posisi: 'HR Staff', shiftKerja: 'Day Shift', seksi: 'HR', unitKerja: 'HR', alamat: 'Alamat 12', noHp: '0810000012', totalCutiTahunan: 12 },
];

const generateSchedules = (): JadwalKerja[] => {
    const schedules: JadwalKerja[] = [];
    const year = 2025;
    const month = 11; // November
    let idCounter = 1;

    const patterns: { [key: string]: string[] } = {
        '00004491': ['OFF', '1T13', 'SG7_30PG', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF'],
        '00005950': ['OFF', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13'],
        '00005999': ['OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13'],
        '00005408': ['OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS'],
        '00006079': ['OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS'],
        '00004792': ['1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF'],
        '00004970': ['2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', '3T13', '3T13', 'OFF', 'OFF', '2T13', '2T13', '1T13', '1T13', 'OFF', 'OFF'],
        '00005201': ['2T13', '1T13', '3T13', 'OFF', 'OFF', '2T13', '1T13', '3T13', 'OFF', 'OFF', '2T13', '1T13', '3T13', 'OFF', 'OFF', '2T13', '1T13', '3T13', 'OFF', 'OFF', '2T13', '1T13', '3T13', 'OFF', 'OFF', '2T13', '1T13', '3T13', 'OFF', 'OFF'],
        '00005414': ['STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS'],
        '00006196': ['OFF', '3T13', '2T13', '1T13', 'OFF', 'OFF', '3T13', '2T13', '1T13', 'OFF', 'OFF', '3T13', '2T13', '1T13', 'OFF', 'OFF', '3T13', '2T13', '1T13', 'OFF', 'OFF', '3T13', '2T13', '1T13', 'OFF', 'OFF', '3T13', '2T13', '1T13', 'OFF'],
        '00005428': ['STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS', 'STNS', 'STNS', 'STNJ', 'OFF', 'OFF', 'STNS', 'STNS'],
    };

    mockUserProfiles.forEach(pegawai => {
        const pattern = patterns[pegawai.nik] || [];
        for (let day = 1; day <= 30; day++) {
            const shift = pattern[day - 1] || 'OFF';
            const employee = mockUserProfiles.find(p => p.nik === pegawai.nik);
            if (employee) {
                schedules.push({
                    id: `jw${idCounter++}`,
                    tanggal: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
                    nik: pegawai.nik,
                    nama: employee.name,
                    seksi: employee.seksi,
                    shift: shift,
                });
            }
        }
    });

    // Add some old data for other tabs to still work
    schedules.push({ id: 'jw_old1', tanggal: '08/10/2025', nik: '00004491', nama: 'AMIRUDDIN', seksi: 'QC 45', shift: 'Shift1' });

    return schedules;
};


export const mockJadwalKerja: JadwalKerja[] = generateSchedules();

export const mockCuti: UsulanCuti[] = [
  { id: 'us1', timestamp: '04/11/2025 16:10:26', nik: '00005950', nama: 'ARMAN NAM', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiTahunan, periode: { startDate: '2025-11-06', endDate: '2025-11-08' }, keterangan: 'sakit', linkBerkas: 'https://drive.google.com', status: UsulanStatus.Diajukan, sisaCuti: 7, cutiTerpakai: 5, rolePengaju: UserRole.Pegawai, catatanAdmin: 'Sisa Cuti 7 hari', penggantiNik: ['00005999'], managerId: 'aswin@example.com' },
  { id: 'us3', timestamp: '07/11/2025 21:38:29', nik: '00005950', nama: 'ARMAN NAM', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiTahunan, periode: { startDate: '2025-11-08', endDate: '2025-11-08' }, keterangan: 'sakit', status: UsulanStatus.Diajukan, sisaCuti: 7, cutiTerpakai: 5, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  { id: 'us4', timestamp: '08/11/2025 09:00:00', nik: '00006079', nama: 'FERDIANSYAH ANUGRAH', seksi: 'QC 45', jenisAjuan: UsulanJenis.IzinSakit, periode: { startDate: '2025-11-10', endDate: '2025-11-10' }, keterangan: 'Demam', linkBerkas: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', status: UsulanStatus.Disetujui, sisaCuti: 10, cutiTerpakai: 2, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  // Data for Quota Cuti Bawahan demo
  { id: 'us101', timestamp: '15/09/2024 10:00:00', nik: '00004491', nama: 'AMIRUDDIN', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiTahunan, periode: { startDate: '2024-09-02', endDate: '2024-09-18' }, keterangan: 'Liburan keluarga', status: UsulanStatus.Disetujui, sisaCuti: 0, cutiTerpakai: 17, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  { id: 'us102', timestamp: '10/10/2023 10:00:00', nik: '00004491', nama: 'AMIRUDDIN', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiBesar, periode: { startDate: '2023-11-01', endDate: '2023-11-08' }, keterangan: 'Acara adat', status: UsulanStatus.Disetujui, sisaCuti: 9, cutiTerpakai: 8, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  { id: 'us103', timestamp: '01/10/2024 10:00:00', nik: '00004792', nama: 'HAFLUDDIN', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiTahunan, periode: { startDate: '2024-10-07', endDate: '2024-10-19' }, keterangan: 'Renovasi rumah', status: UsulanStatus.Disetujui, sisaCuti: 4, cutiTerpakai: 13, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  { id: 'us104', timestamp: '01/10/2023 10:00:00', nik: '00004792', nama: 'HAFLUDDIN', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiBesar, periode: { startDate: '2023-10-02', endDate: '2023-10-05' }, keterangan: 'Sakit', status: UsulanStatus.Disetujui, sisaCuti: 13, cutiTerpakai: 4, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  { id: 'us105', timestamp: '02/02/2025 10:00:00', nik: '00004970', nama: 'HAMBALI KAQU', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiTahunan, periode: { startDate: '2025-03-03', endDate: '2025-03-17' }, keterangan: 'Liburan', status: UsulanStatus.Disetujui, sisaCuti: 2, cutiTerpakai: 15, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  { id: 'us106', timestamp: '05/05/2024 10:00:00', nik: '00004970', nama: 'HAMBALI KAQU', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiBesar, periode: { startDate: '2024-06-03', endDate: '2024-06-12' }, keterangan: 'Liburan', status: UsulanStatus.Disetujui, sisaCuti: 7, cutiTerpakai: 10, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  { id: 'us107', timestamp: '01/06/2025 10:00:00', nik: '00005201', nama: 'HARJUNA', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiTahunan, periode: { startDate: '2025-07-01', endDate: '2025-07-13' }, keterangan: 'Liburan', status: UsulanStatus.Disetujui, sisaCuti: 4, cutiTerpakai: 13, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
  { id: 'us108', timestamp: '01/06/2024 10:00:00', nik: '00005201', nama: 'HARJUNA', seksi: 'QC 45', jenisAjuan: UsulanJenis.CutiBesar, periode: { startDate: '2024-08-01', endDate: '2024-08-02' }, keterangan: 'Liburan', status: UsulanStatus.Disetujui, sisaCuti: 15, cutiTerpakai: 2, rolePengaju: UserRole.Pegawai, managerId: 'aswin@example.com' },
];

export const mockLembur: UsulanLembur[] = [
    { 
        id: 'us2', 
        timestamp: '04/11/2025 16:24:16', 
        nik: '00005408', 
        nama: 'DEDI FARID RAMU', 
        seksi: 'RM & PM', 
        jenisAjuan: UsulanJenis.Lembur, 
        status: UsulanStatus.Diajukan, 
        jamLembur: 4, 
        rolePengaju: UserRole.Pegawai, 
        catatanAdmin: '4 Jam',
        tanggalLembur: '2025-11-04',
        shift: '3T13',
        jamAwal: '22:30',
        jamAkhir: '02:30',
        tanpaIstirahat: ['Shift 3'],
        kategoriLembur: 'Mengganti Rekan Kerja',
        keteranganLembur: 'Mengganti Sdr. Sudirman',
        managerId: 'aswin@example.com'
    },
];

export const mockSubstitusi: UsulanSubstitusi[] = [];

export const mockSeksi: Seksi[] = [
    { id: 'seksi-qc-23', name: 'QC 23' },
    { id: 'seksi-qc-45', name: 'QC 45' },
    { id: 'seksi-rm-pm', name: 'RM-PM' },
];

export const mockUnitKerja: UnitKerja[] = [
    { id: 'unit-qc', name: 'Unit QC' },
];

export const mockVendorConfig: VendorConfig[] = [
    { id: 'vc-1', namaVendor: 'KOPKAR SEMEN TONASA', namaAdmin: 'MUH. KASIM' },
];

export const mockShiftConfigs: ShiftConfig[] = [
    { id: 'stns', code: 'STNS', name: 'ST Non Shift', time: '07:30-16:30', color: 'bg-slate-100 text-slate-800', group: 'ST Non Shift' },
    { id: 'stnj', code: 'STNJ', name: 'ST Non Shift Jam Normal', time: '07:00-17:00', color: 'bg-slate-100 text-slate-800', group: 'ST Non Shift' },
    { id: 'stns7', code: 'STNS7', name: 'ST Non Shift 7', time: '07:00-16:00', color: 'bg-slate-100 text-slate-800', group: 'ST Non Shift' },
    { id: 'stnj7', code: 'STNJ7', name: 'ST Non Shift 7', time: '07:00-16:30', color: 'bg-slate-100 text-slate-800', group: 'ST Non Shift' },

    { id: 'st1-2pg', code: 'ST1-2PG', name: 'ST Shift 1-2 Pagi', time: '07:30-15:30', color: 'bg-green-100 text-green-800', group: 'ST Shift 1-2' },
    { id: 'st1-2si', code: 'ST1-2SI', name: 'ST Shift 1-2 Siang', time: '14:30-21:30', color: 'bg-yellow-100 text-yellow-800', group: 'ST Shift 1-2' },
    
    { id: 'sg1pg', code: 'SG1PG', name: 'SG Shift 1 Pagi', time: '07:30-15:30', color: 'bg-yellow-100 text-yellow-800', group: 'SG Shift' },
    { id: 'sg2si', code: 'SG2SI', name: 'SG Shift 2 Siang', time: '15:30-22:30', color: 'bg-yellow-100 text-yellow-800', group: 'SG Shift' },
    { id: 'sg3mi', code: 'SG3MI', name: 'SG Shift 3 Malam', time: '22:30-07:30', color: 'bg-gray-800 text-white', group: 'SG Shift' },
    { id: 'sg7_30pg', code: 'SG7_30PG', name: 'SG Shift 7.30 Pagi', time: '07:30-16:30', color: 'bg-teal-100 text-teal-800', group: 'SG Shift' },
    { id: 'sg7_30mi', code: 'SG7_30MI', name: 'SG Shift 7.30 Malam', time: '19:30-04:30', color: 'bg-indigo-800 text-white', group: 'SG Shift' },

    { id: '1t13', code: '1T13', name: 'Shift 1T13', time: '07:30-15:30', color: 'bg-white text-black', group: 'Shift Reguler' },
    { id: '2t13', code: '2T13', name: 'Shift 2T13', time: '15:30-22:30', color: 'bg-white text-black', group: 'Shift Reguler' },
    { id: '3t13', code: '3T13', name: 'Shift 3T13', time: '22:30-07:30', color: 'bg-white text-black', group: 'Shift Reguler' },
    
    { id: 'off', code: 'OFF', name: 'OFF', time: '', color: 'bg-red-100 text-red-800', group: 'Lainnya' },
];