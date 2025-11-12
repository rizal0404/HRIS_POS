// Fix: Removed self-import of 'Shift' which was causing a circular dependency.
// import { Shift } from './types';

export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  Admin = 'Admin',
  Manager = 'Manager',
  Pegawai = 'Pegawai',
}

export enum UsulanStatus {
  Diajukan = 'Diajukan',
  Disetujui = 'Disetujui',
  Ditolak = 'Ditolak',
  Revisi = 'Revisi',
  PembatalanDiajukan = 'Pembatalan Diajukan',
  Dibatalkan = 'Dibatalkan',
}

export enum UsulanJenis {
  CutiTahunan = 'Cuti Tahunan',
  CutiBesar = 'Cuti Besar',
  Lembur = 'Lembur',
  IzinSakit = 'Izin/Sakit',
  Substitusi = 'Substitusi',
  PembetulanPresensi = 'Pembetulan Presensi',
}

export enum Shift {
  Shift1 = 'Shift 1',
  Shift2 = 'Shift 2',
  Shift3 = 'Shift 3',
  Off = 'Off',
  DayShift = 'Day Shift',
}

export interface UserProfile {
  id: string; // User UUID from Supabase Auth
  email: string;
  name: string;
  role: UserRole;
  nik: string;
  posisi: string;
  seksi: string;
  unitKerja: string;
  shiftKerja: Shift | string;
  noHp: string;
  alamat: string;
  totalCutiTahunan: number;
  managerId?: string; // ID (UUID) of the manager
  manager?: { name: string } | null;
}


export interface JadwalKerja {
  id: string;
  tanggal: string; // Format: DD/MM/YYYY
  nik: string;
  nama: string;
  seksi: string;
  shift: string;
}

// Base interface for all proposals
export interface BaseUsulan {
  id: string;
  authorUid?: string;
  timestamp: string; // ISO String or Firestore Timestamp string representation
  nik: string;
  nama: string;
  seksi: string;
  status: UsulanStatus;
  catatanAdmin?: string;
  rolePengaju: UserRole;
  managerId?: string; // ID of the manager who needs to approve
}

// Interface for Cuti and Izin/Sakit
export interface UsulanCuti extends BaseUsulan {
  jenisAjuan: UsulanJenis.CutiTahunan | UsulanJenis.IzinSakit | UsulanJenis.CutiBesar;
  periode: {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
  };
  keterangan: string;
  linkBerkas?: string;
  sisaCuti: number;
  cutiTerpakai: number;
  penggantiNik?: string[];
}

// Interface for Lembur
export interface UsulanLembur extends BaseUsulan {
  jenisAjuan: UsulanJenis.Lembur;
  tanggalLembur: string; // YYYY-MM-DD
  shift: string;
  jamAwal: string; // HH:mm
  jamAkhir: string; // HH:mm
  tanpaIstirahat: string[]; // e.g., ['Shift 1', 'Shift 3']
  kategoriLembur: string;
  keteranganLembur: string;
  jamLembur: number;
}

// Interface for Substitusi
export interface UsulanSubstitusi extends BaseUsulan {
  jenisAjuan: UsulanJenis.Substitusi;
  tanggalSubstitusi: string; // YYYY-MM-DD
  shiftAwal: string;
  shiftBaru: string;
  keterangan: string;
}

export interface UsulanPembetulanPresensi extends BaseUsulan {
    jenisAjuan: UsulanJenis.PembetulanPresensi;
    presensiId?: string; // Original presensi record ID
    tanggalPembetulan: string; // YYYY-MM-DD
    jamPembetulan: string; // HH:mm
    clockType: 'in' | 'out';
    alasan: string;
    linkBukti?: string;
}

// A union type for components that might handle both
export type Usulan = UsulanCuti | UsulanLembur | UsulanSubstitusi | UsulanPembetulanPresensi;


export interface ShiftConfig {
  id: string;
  code: string;
  name: string;
  time: string;
  color: string;
  group: string;
}

export interface Presensi {
  id: string;
  nik: string;
  nama: string;
  tanggal: string; // "DD/MM/YYYY"
  shift: string;

  clockInTimestamp?: any; // Firestore Timestamp
  clockInHealthStatus?: string;
  clockInWorkLocationType?: string;
  clockInWorkplace?: string;
  clockInNotes?: string;
  clockInLatitude?: number;
  clockInLongitude?: number;

  clockOutTimestamp?: any; // Firestore Timestamp
  clockOutHealthStatus?: string;
  clockOutWorkLocationType?: string;
  clockOutWorkplace?: string;
  clockOutNotes?: string;
  clockOutLatitude?: number;
  clockOutLongitude?: number;

  totalHours?: number;
}

export interface Seksi {
  id: string;
  name: string;
}

export interface UnitKerja {
  id: string;
  name: string;
}

export interface VendorConfig {
  id: string;
  namaVendor: string;
  namaAdmin: string;
}

export interface LeaveQuota {
  id: string;
  nik: string;
  namaKaryawan: string;
  jenisCuti: 'Cuti Tahunan' | 'Cuti Besar';
  periode: string; // e.g., "2025 s/d 2028"
  masaBerlakuStart: string; // YYYY-MM-DD
  masaBerlakuEnd: string;   // YYYY-MM-DD
  quota: number;
}