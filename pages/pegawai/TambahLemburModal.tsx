import React, { useState, useEffect } from 'react';
import { UserProfile, JadwalKerja, UsulanJenis, UsulanStatus, UserRole, UsulanLembur } from '../../types';
import { apiService } from '../../services/apiService';
import Modal from '../../components/Modal';
import { CalendarIcon } from '../../components/Icons';

interface TambahLemburModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
    onSuccess: () => void;
    jadwal: JadwalKerja[];
    lemburToEdit?: UsulanLembur | null;
}

export const TambahLemburModal: React.FC<TambahLemburModalProps> = ({ isOpen, onClose, user, onSuccess, jadwal, lemburToEdit }) => {
    const [tanggal, setTanggal] = useState('');
    const [shift, setShift] = useState('');
    const [shiftDisplay, setShiftDisplay] = useState('Jam Kerja Aktif -');
    const [jamAwal, setJamAwal] = useState('');
    const [jamAkhir, setJamAkhir] = useState('');
    const [tanpaIstirahat, setTanpaIstirahat] = useState<string[]>([]);
    const [kategori, setKategori] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setTanggal('');
            setShift('');
            setShiftDisplay('Jam Kerja Aktif -');
            setJamAwal('');
            setJamAkhir('');
            setTanpaIstirahat([]);
            setKategori('');
            setKeterangan('');
        } else if (lemburToEdit) {
            // Populate form if editing
            setTanggal(lemburToEdit.tanggalLembur);
            setJamAwal(lemburToEdit.jamAwal);
            setJamAkhir(lemburToEdit.jamAkhir);
            setTanpaIstirahat(lemburToEdit.tanpaIstirahat || []);
            setKategori(lemburToEdit.kategoriLembur);
            setKeterangan(lemburToEdit.keteranganLembur);
        }
    }, [isOpen, lemburToEdit]);

    useEffect(() => {
        if (tanggal) {
            const parts = tanggal.split('-'); // YYYY-MM-DD
            const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
            const scheduleForDate = jadwal.find(j => j.tanggal === formattedDate);
            if(scheduleForDate) {
                setShift(scheduleForDate.shift);
                setShiftDisplay(`Jam Kerja Aktif - ${scheduleForDate.shift}`);
            } else {
                setShift('');
                setShiftDisplay('Jam Kerja Aktif - (Jadwal tidak ditemukan)');
            }
        } else {
            setShift('');
            setShiftDisplay('Jam Kerja Aktif -');
        }
    }, [tanggal, jadwal]);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setTanpaIstirahat(prev => {
            if (checked) {
                return [...prev, value];
            } else {
                return prev.filter(item => item !== value);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simple time diff calculation for jamLembur
        const start = new Date(`${tanggal}T${jamAwal}:00`);
        const end = new Date(`${tanggal}T${jamAkhir}:00`);
        if (end < start) { // handles overnight case simply
            end.setDate(end.getDate() + 1);
        }
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        try {
            if (lemburToEdit) {
                const updatedLembur: Partial<UsulanLembur> = {
                    tanggalLembur: tanggal,
                    shift: shift,
                    jamAwal: jamAwal,
                    jamAkhir: jamAkhir,
                    tanpaIstirahat: tanpaIstirahat,
                    kategoriLembur: kategori,
                    keteranganLembur: keterangan,
                    jamLembur: parseFloat(diffHours.toFixed(2)),
                };
                await apiService.updateLembur(lemburToEdit.id, updatedLembur);
            } else {
                const newLembur: Omit<UsulanLembur, 'id' | 'timestamp' | 'authorUid'> = {
                    nik: user.nik,
                    nama: user.name,
                    seksi: user.seksi,
                    jenisAjuan: UsulanJenis.Lembur,
                    status: UsulanStatus.Diajukan,
                    rolePengaju: user.role as UserRole.Pegawai,
                    tanggalLembur: tanggal,
                    shift: shift,
                    jamAwal: jamAwal,
                    jamAkhir: jamAkhir,
                    tanpaIstirahat: tanpaIstirahat,
                    kategoriLembur: kategori,
                    keteranganLembur: keterangan,
                    jamLembur: parseFloat(diffHours.toFixed(2)),
                };
                await apiService.addLembur(newLembur);
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to submit overtime request:", error);
            alert('Gagal mengirim ajuan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={lemburToEdit ? "Ubah Data Lembur" : "Tambah Data Lembur"}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* Tanggal */}
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] md:items-center gap-2">
                        <label htmlFor="tanggal" className="text-sm font-medium text-gray-700 md:text-right">Tanggal :</label>
                        <div className="relative">
                            <input
                                type="date"
                                id="tanggal"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="form-input block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                required
                            />
                            <CalendarIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Shift */}
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] md:items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 md:text-right">Shift:</label>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="w-24 h-9 bg-gray-100 rounded-md"></div>
                            <span className="text-sm text-gray-600">{shiftDisplay}</span>
                        </div>
                    </div>

                    {/* Jam Awal */}
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] md:items-center gap-2">
                        <label htmlFor="jam-awal" className="text-sm font-medium text-gray-700 md:text-right">Jam Awal :</label>
                        <input
                            type="time"
                            id="jam-awal"
                            value={jamAwal}
                            onChange={e => setJamAwal(e.target.value)}
                            className="form-input block w-full py-2 border-gray-300 sm:text-sm rounded-md"
                            required
                        />
                    </div>

                    {/* Jam Akhir */}
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] md:items-center gap-2">
                        <label htmlFor="jam-akhir" className="text-sm font-medium text-gray-700 md:text-right">Jam Akhir :</label>
                        <input
                            type="time"
                            id="jam-akhir"
                            value={jamAkhir}
                            onChange={e => setJamAkhir(e.target.value)}
                            className="form-input block w-full py-2 border-gray-300 sm:text-sm rounded-md"
                            required
                        />
                    </div>
                    
                    {/* Tanpa Istirahat */}
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] md:items-start gap-2">
                        <label className="text-sm font-medium text-gray-700 md:text-right md:pt-1.5">Tanpa Istirahat</label>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                                <input id="shift1-check" type="checkbox" value="Shift 1" checked={tanpaIstirahat.includes('Shift 1')} onChange={handleCheckboxChange} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"/>
                                <label htmlFor="shift1-check" className="text-sm">Shift 1</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="shift2-check" type="checkbox" value="Shift 2" checked={tanpaIstirahat.includes('Shift 2')} onChange={handleCheckboxChange} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"/>
                                <label htmlFor="shift2-check" className="text-sm">Shift 2</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="shift3-check" type="checkbox" value="Shift 3" checked={tanpaIstirahat.includes('Shift 3')} onChange={handleCheckboxChange} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"/>
                                <label htmlFor="shift3-check" className="text-sm">Shift 3</label>
                            </div>
                        </div>
                    </div>

                    {/* Kategori Lembur */}
                     <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] md:items-center gap-2">
                        <label htmlFor="kategori-lembur" className="text-sm font-medium text-gray-700 md:text-right">Kategori Lembur :</label>
                        <select
                            id="kategori-lembur"
                            value={kategori}
                            onChange={e => setKategori(e.target.value)}
                            className="form-select block w-full py-2 border-gray-300 sm:text-sm rounded-md"
                            required
                        >
                            <option value="">pilih kategori lembur</option>
                            <option>Mengganti Rekan Kerja</option>
                            <option>Pekerjaan Mendesak</option>
                            <option>Perintah Atasan</option>
                            <option>Lainnya</option>
                        </select>
                    </div>

                    {/* Keterangan */}
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] md:items-start gap-2">
                        <label htmlFor="keterangan" className="text-sm font-medium text-gray-700 md:text-right md:pt-2">Keterangan</label>
                        <textarea
                            id="keterangan"
                            rows={3}
                            value={keterangan}
                            onChange={e => setKeterangan(e.target.value)}
                            className="form-textarea block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="Isikan keterangan lembur"
                        />
                    </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row sm:justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-400 text-black font-bold py-2 px-8 rounded-md hover:bg-gray-500 transition-colors"
                    >
                        Kembali
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-black text-white font-bold py-2 px-8 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};