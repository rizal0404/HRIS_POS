import React, { useState, useEffect } from 'react';
import { UserProfile, UsulanCuti, UsulanJenis, UsulanStatus, UserRole, JadwalKerja } from '../../types';
import { apiService } from '../../services/apiService';

interface TambahPengajuanCutiViewProps {
  user: UserProfile;
  allPegawai: UserProfile[];
  jadwal: JadwalKerja[];
  onSuccess: () => void;
  onBack: () => void;
  proposalToEdit?: UsulanCuti | null;
}

export const TambahPengajuanCutiView: React.FC<TambahPengajuanCutiViewProps> = ({ user, allPegawai, jadwal, onSuccess, onBack, proposalToEdit }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [delegasi, setDelegasi] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calculatedDays, setCalculatedDays] = useState(0);

    useEffect(() => {
        if (proposalToEdit) {
            setKeterangan(proposalToEdit.keterangan || '');
            setDelegasi(proposalToEdit.penggantiNik?.[0] || '');
            setStartDate(proposalToEdit.periode.startDate || '');
            setEndDate(proposalToEdit.periode.endDate || '');
        }
    }, [proposalToEdit]);

    useEffect(() => {
        if (!startDate) {
            setCalculatedDays(0);
            return;
        }

        const finalEndDate = endDate || startDate;
        if (new Date(finalEndDate) < new Date(startDate)) {
            setCalculatedDays(0);
            return;
        }

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(finalEndDate + 'T00:00:00');
        let count = 0;
        
        const scheduleMap = new Map(jadwal.map(j => [j.tanggal, j.shift]));

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateString = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const dayShift = scheduleMap.get(dateString);
            
            if (dayShift && dayShift !== 'OFF') {
                count++;
            }
        }
        setCalculatedDays(count);
    }, [startDate, endDate, jadwal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate) {
            alert('Tanggal mulai harus diisi.');
            return;
        }
        
        if (calculatedDays <= 0) {
            alert('Periode cuti yang dipilih tidak valid atau tidak mengandung hari kerja.');
            return;
        }

        setIsSubmitting(true);
        const finalEndDate = endDate || startDate;
        
        try {
            if (proposalToEdit) {
                 const updatedData: Partial<UsulanCuti> = {
                    periode: { startDate, endDate: finalEndDate },
                    keterangan,
                    penggantiNik: delegasi ? [delegasi] : [],
                };
                await apiService.updateCuti(proposalToEdit.id, updatedData);
            } else {
                 const newUsulan: Omit<UsulanCuti, 'id'|'timestamp'|'sisaCuti'|'cutiTerpakai'|'authorUid'> = {
                    nik: user.nik,
                    nama: user.name,
                    seksi: user.seksi,
                    jenisAjuan: UsulanJenis.CutiTahunan, // Note: This form is only for Cuti now
                    periode: { startDate, endDate: finalEndDate },
                    keterangan,
                    status: UsulanStatus.Diajukan,
                    rolePengaju: user.role as UserRole.Pegawai,
                    penggantiNik: delegasi ? [delegasi] : [],
                };
                await apiService.addCuti(newUsulan);
            }
            onSuccess();
        } catch (error) {
            console.error('Failed to submit leave request:', error);
            alert('Gagal mengirim ajuan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-0 sm:p-2 md:p-4 lg:p-6">
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Dari <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="form-input block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Sampai <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                           <input
                                type="date"
                                id="end-date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="form-input block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                placeholder="Kosongkan jika 1 hari"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mt-2">
                            Total hari cuti yang akan diambil: <span className="font-bold">{calculatedDays} hari</span>. Hari dengan jadwal 'OFF' tidak dihitung.
                        </div>
                    </div>
                </div>
                 <div>
                    <label htmlFor="delegasi" className="block text-sm font-medium text-gray-700 mb-1">
                        Delegasi
                    </label>
                    <select
                        id="delegasi"
                        value={delegasi}
                        onChange={(e) => setDelegasi(e.target.value)}
                        className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                    >
                        <option value="">Pilih Delegasi</option>
                        {allPegawai.filter(p => p.nik !== user.nik).map(p => (
                            <option key={p.nik} value={p.nik}>{p.name} ({p.nik})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 mb-1">
                        Keperluan / Alamat Waktu Cuti <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="keterangan"
                        rows={4}
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        className="form-textarea block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Masukkan alamat cuti"
                        required
                    />
                </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="bg-gray-400 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-500 transition-colors"
                >
                    Kembali
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-800 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-900 transition-colors disabled:bg-slate-400"
                >
                    {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
            </div>
        </form>
    );
};