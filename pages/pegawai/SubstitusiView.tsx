import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UsulanSubstitusi, ShiftConfig, UsulanStatus, UsulanJenis, JadwalKerja } from '../../types';
import { ChevronLeftIcon, SearchIcon, PlusIcon, TrashIcon, CalendarIcon, FilterXIcon } from '../../components/Icons';
import Modal from '../../components/Modal';
import { apiService } from '../../services/apiService';

// Modal component
const PengajuanSubstitusiModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: UserProfile;
    jadwal: JadwalKerja[];
    shiftConfigs: ShiftConfig[];
}> = ({ isOpen, onClose, onSuccess, user, jadwal, shiftConfigs }) => {
    const [tanggal, setTanggal] = useState('');
    const [shiftAwal, setShiftAwal] = useState('');
    const [shiftBaru, setShiftBaru] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (tanggal) {
            const parts = tanggal.split('-'); // YYYY-MM-DD
            const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
            const scheduleForDate = jadwal.find(j => j.tanggal === formattedDate);
            setShiftAwal(scheduleForDate?.shift || 'Jadwal tidak ditemukan');
        } else {
            setShiftAwal('');
        }
    }, [tanggal, jadwal]);
    
    // Reset form when modal is opened/closed
    useEffect(() => {
        if (!isOpen) {
            setTanggal('');
            setShiftAwal('');
            setShiftBaru('');
            setKeterangan('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shiftAwal || shiftAwal === 'Jadwal tidak ditemukan') {
            alert('Tidak dapat mengajukan substitusi untuk tanggal ini (jadwal tidak ditemukan).');
            return;
        }
        if (shiftAwal === shiftBaru) {
            alert('Shift baru tidak boleh sama dengan shift awal.');
            return;
        }
        setIsSubmitting(true);
        try {
            const newSubstitusi: Omit<UsulanSubstitusi, 'id' | 'timestamp' | 'authorUid'> = {
                nik: user.nik,
                nama: user.name,
                seksi: user.seksi,
                status: UsulanStatus.Diajukan,
                rolePengaju: user.role,
                jenisAjuan: UsulanJenis.Substitusi,
                tanggalSubstitusi: tanggal,
                shiftAwal: shiftAwal,
                shiftBaru: shiftBaru,
                keterangan: keterangan,
            };
            await apiService.addSubstitusi(newSubstitusi);
            onSuccess();
        } catch (error) {
            console.error('Failed to submit substitution:', error);
            alert('Gagal mengajukan substitusi. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pengajuan Substitusi">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="tanggal" className="block text-sm font-medium text-slate-700">Tanggal <span className="text-red-500">*</span></label>
                    <div className="relative mt-1">
                        <input
                            type="date"
                            id="tanggal"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="form-input block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md"
                            required
                        />
                        <CalendarIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <div>
                    <label htmlFor="shiftAwal" className="block text-sm font-medium text-slate-700">Shift Awal <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="shiftAwal"
                        value={shiftAwal}
                        readOnly
                        className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md bg-slate-100"
                    />
                </div>
                <div>
                    <label htmlFor="shiftBaru" className="block text-sm font-medium text-slate-700">Shift Baru <span className="text-red-500">*</span></label>
                    <select
                        id="shiftBaru"
                        value={shiftBaru}
                        onChange={(e) => setShiftBaru(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md"
                        required
                    >
                        <option value="">Pilih Shift Baru</option>
                        {shiftConfigs.map(s => (
                            <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="keterangan" className="block text-sm font-medium text-slate-700">Keterangan <span className="text-red-500">*</span></label>
                    <textarea
                        id="keterangan"
                        rows={3}
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Keterangan"
                        required
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-400">
                        Kembali
                    </button>
                    <button type="submit" disabled={isSubmitting} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-900 disabled:bg-slate-400">
                        {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Main view component
export const SubstitusiView: React.FC<{
    user: UserProfile;
    usulanSubstitusi: UsulanSubstitusi[];
    jadwal: JadwalKerja[];
    shiftConfigs: ShiftConfig[];
    onDataChange: () => void;
    onDelete: (id: string) => void;
}> = ({ user, usulanSubstitusi, jadwal, shiftConfigs, onDataChange, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubstitusiId, setSelectedSubstitusiId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [searchTerm, setSearchTerm] = useState('');

    const selectedSubstitusi = useMemo(() => {
        return usulanSubstitusi.find(item => item.id === selectedSubstitusiId);
    }, [selectedSubstitusiId, usulanSubstitusi]);

    const isActionable = useMemo(() => {
        if (!selectedSubstitusi) return false;
        return selectedSubstitusi.status === UsulanStatus.Diajukan || selectedSubstitusi.status === UsulanStatus.Revisi;
    }, [selectedSubstitusi]);

    const handleDelete = () => {
        if (selectedSubstitusiId) {
            onDelete(selectedSubstitusiId);
            setSelectedSubstitusiId(null);
        }
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('Semua');
        setSearchTerm('');
    };
    
    const filteredSubstitusi = useMemo(() => {
        return usulanSubstitusi.filter(item => {
            const itemDate = item.tanggalSubstitusi;
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            
            if (statusFilter !== 'Semua' && item.status !== statusFilter) return false;
            
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            if (searchTerm &&
                !item.keterangan.toLowerCase().includes(lowerCaseSearchTerm)
            ) return false;
            
            return true;
        });
    }, [usulanSubstitusi, startDate, endDate, statusFilter, searchTerm]);

    const getDayName = (dateString: string) => {
        try {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('id-ID', { weekday: 'long' });
        } catch {
            return '-';
        }
    }
    
    return (
        <div>
            <header className="bg-red-700 text-white p-4 rounded-t-lg flex items-center">
                 <button className="mr-4 p-1 rounded-full hover:bg-red-800 transition-colors" aria-label="Kembali">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Data Substitusi Personal</h1>
            </header>

            <div className="bg-white p-6 rounded-b-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
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
                        <button onClick={() => setIsModalOpen(true)} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex-1"><PlusIcon className="w-5 h-5 mx-auto"/></button>
                        <button onClick={handleDelete} disabled={!isActionable} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex-1 disabled:bg-gray-400"><TrashIcon className="w-5 h-5 mx-auto"/></button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100">
                            <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-4 py-3">Pilih</th>
                                <th className="px-4 py-3">Nopeg</th>
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Hari</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Shift Awal</th>
                                <th className="px-4 py-3">Shift Baru</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Status SAP</th>
                                <th className="px-4 py-3">Keterangan</th>
                            </tr>
                        </thead>
                        {filteredSubstitusi.length === 0 ? (
                             <tbody className="bg-white">
                                <tr>
                                    <td colSpan={10} className="py-10 text-center text-gray-500">
                                        Tidak ada data yang cocok dengan filter Anda.
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSubstitusi.map(s => (
                                    <tr key={s.id} className={selectedSubstitusiId === s.id ? 'bg-red-50' : ''}>
                                        <td className="px-4 py-3">
                                            <input type="radio" name="selectedSubstitusi" value={s.id} checked={selectedSubstitusiId === s.id} onChange={() => setSelectedSubstitusiId(s.id)} className="form-radio h-4 w-4 text-red-600"/>
                                        </td>
                                        <td className="px-4 py-3">{s.nik}</td>
                                        <td className="px-4 py-3">{s.nama}</td>
                                        <td className="px-4 py-3">{getDayName(s.tanggalSubstitusi)}</td>
                                        <td className="px-4 py-3">{s.tanggalSubstitusi}</td>
                                        <td className="px-4 py-3">{s.shiftAwal}</td>
                                        <td className="px-4 py-3">{s.shiftBaru}</td>
                                        <td className="px-4 py-3">{s.status}</td>
                                        <td className="px-4 py-3">{s.status === UsulanStatus.Disetujui ? 'Approved' : 'Pending'}</td>
                                        <td className="px-4 py-3">{s.keterangan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>

                 <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-700">
                        Menampilkan 1 - {filteredSubstitusi.length} dari {filteredSubstitusi.length} entri
                    </p>
                    <div className="flex items-center">
                        <button className="px-2 py-1 border rounded-l-md bg-white hover:bg-gray-50 disabled:opacity-50" disabled>&lt;</button>
                        <button className="px-2 py-1 border-t border-b border-r rounded-r-md bg-white hover:bg-gray-50 disabled:opacity-50" disabled>&gt;</button>
                    </div>
                </div>

            </div>

            <PengajuanSubstitusiModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    onDataChange();
                }}
                user={user}
                jadwal={jadwal}
                shiftConfigs={shiftConfigs}
            />
        </div>
    );
};