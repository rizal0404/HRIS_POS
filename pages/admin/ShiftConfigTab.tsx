import React, { useState, useEffect } from 'react';
import { ShiftConfig } from '../../types';
import { apiService } from '../../services/apiService';
import Modal from '../../components/Modal';
import { PlusCircleIcon } from '../../components/Icons';

const COLOR_OPTIONS = [
  { name: 'White', class: 'bg-white text-black' },
  { name: 'Gray', class: 'bg-slate-100 text-slate-800' },
  { name: 'Red', class: 'bg-red-100 text-red-800' },
  { name: 'Yellow', class: 'bg-yellow-100 text-yellow-800' },
  { name: 'Green', class: 'bg-green-100 text-green-800' },
  { name: 'Teal', class: 'bg-teal-100 text-teal-800' },
  { name: 'Blue', class: 'bg-blue-100 text-blue-800' },
  { name: 'Sky', class: 'bg-sky-100 text-sky-800' },
  { name: 'Indigo', class: 'bg-indigo-100 text-indigo-800' },
  { name: 'Purple', class: 'bg-purple-100 text-purple-800' },
  { name: 'Pink', class: 'bg-pink-100 text-pink-800' },
  { name: 'Dark Gray', class: 'bg-gray-800 text-white' },
  { name: 'Dark Indigo', class: 'bg-indigo-800 text-white' },
];

const ShiftConfigModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: () => void, shift: ShiftConfig | null}> = ({isOpen, onClose, onSave, shift}) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        time: '',
        group: '',
        color: COLOR_OPTIONS[0].class,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                code: shift?.code || '',
                name: shift?.name || '',
                time: shift?.time || '',
                group: shift?.group || '',
                color: shift?.color || COLOR_OPTIONS[0].class,
            });
        }
    }, [isOpen, shift]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        let success = false;
        try {
            if(shift) {
                await apiService.updateShiftConfig({ ...formData, id: shift.id });
            } else {
                await apiService.addShiftConfig(formData);
            }
            success = true;
        } catch (error) {
            console.error("Failed to save shift config", error);
            alert(`Gagal menyimpan konfigurasi shift: ${error instanceof Error ? error.message : 'Silakan coba lagi.'}`);
        }
        
        setIsSubmitting(false);
        if (success) {
            onSave();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={shift ? "Ubah Shift" : "Tambah Shift Baru"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-slate-700">Kode Shift</label>
                    <input type="text" id="code" name="code" value={formData.code} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md" placeholder="e.g., STNS"/>
                </div>
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nama Shift</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md" placeholder="e.g., ST Non Shift"/>
                </div>
                 <div>
                    <label htmlFor="time" className="block text-sm font-medium text-slate-700">Jam Kerja</label>
                    <input type="text" id="time" name="time" value={formData.time} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md" placeholder="e.g., 07:30-16:30"/>
                </div>
                 <div>
                    <label htmlFor="group" className="block text-sm font-medium text-slate-700">Grup Shift</label>
                    <input type="text" id="group" name="group" value={formData.group} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md" placeholder="e.g., ST Non Shift"/>
                </div>
                 <div>
                    <label htmlFor="color" className="block text-sm font-medium text-slate-700">Warna</label>
                    <select id="color" name="color" value={formData.color} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {COLOR_OPTIONS.map(opt => <option key={opt.class} value={opt.class}>{opt.name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Batal
                    </button>
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export const ShiftConfigTab: React.FC<{
    shiftConfigs: ShiftConfig[], 
    onDataChange: () => void,
    canEdit?: boolean,
}> = ({shiftConfigs, onDataChange, canEdit = false}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<ShiftConfig | null>(null);
    const [deletingShift, setDeletingShift] = useState<ShiftConfig | null>(null);

    const handleAdd = () => {
        setEditingShift(null);
        setIsModalOpen(true);
    }
    const handleEdit = (shift: ShiftConfig) => {
        setEditingShift(shift);
        setIsModalOpen(true);
    }
    const handleDelete = (shift: ShiftConfig) => {
        setDeletingShift(shift);
    }
    const handleConfirmDelete = async () => {
        if (deletingShift) {
            await apiService.deleteShiftConfig(deletingShift.id);
            setDeletingShift(null);
            onDataChange();
        }
    }
    const handleSave = () => {
        setIsModalOpen(false);
        onDataChange();
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Konfigurasi Shift Kerja</h2>
                <button 
                    onClick={handleAdd} 
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
                    disabled={!canEdit}
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    <span>Tambah Shift</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-4 py-3">Kode</th>
                            <th className="px-4 py-3">Nama Shift</th>
                            <th className="px-4 py-3">Jam Kerja</th>
                            <th className="px-4 py-3">Grup</th>
                            <th className="px-4 py-3">Warna</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shiftConfigs.map(sc => (
                             <tr key={sc.id} className="border-b hover:bg-slate-50">
                                <td className="px-4 py-3 font-mono font-bold">{sc.code}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{sc.name}</td>
                                <td className="px-4 py-3">{sc.time}</td>
                                <td className="px-4 py-3">{sc.group}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium rounded-full border border-gray-200 ${sc.color}`}>{sc.code}</span></td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEdit(sc)} 
                                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 disabled:bg-slate-400"
                                            disabled={!canEdit}
                                        >
                                            Ubah
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(sc)} 
                                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:bg-slate-400"
                                            disabled={!canEdit}
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && canEdit &&
                <ShiftConfigModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    shift={editingShift}
                />
            }
            {deletingShift && canEdit && (
                <Modal 
                    isOpen={!!deletingShift} 
                    onClose={() => setDeletingShift(null)} 
                    title="Konfirmasi Hapus Shift"
                >
                    <p>Apakah Anda yakin ingin menghapus shift <strong>{deletingShift.name} ({deletingShift.code})</strong>?</p>
                    <p className="text-sm text-red-600 mt-2">Tindakan ini tidak dapat diurungkan.</p>
                    <div className="flex justify-end gap-3 pt-4 mt-4">
                        <button onClick={() => setDeletingShift(null)} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Batal
                        </button>
                        <button onClick={handleConfirmDelete} className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700">
                            Hapus
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}