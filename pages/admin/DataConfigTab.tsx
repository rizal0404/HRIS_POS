import React, { useState, useEffect } from 'react';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../../components/Icons';
import Modal from '../../components/Modal';

type ConfigItem = Record<string, any> & { id: string; };

interface DataConfigTabProps<T extends ConfigItem> {
    title: string;
    itemTitle: string;
    items: T[];
    fields: { name: string; label: string; type?: string; }[];
    onDataChange: () => void;
    api: {
        add: (item: Omit<T, 'id'>) => Promise<T>;
        update: (item: T) => Promise<T>;
        delete: (id: string) => Promise<void>;
    };
}

export const DataConfigTab = <T extends ConfigItem>({ title, itemTitle, items, fields, onDataChange, api }: DataConfigTabProps<T>) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [deletingItem, setDeletingItem] = useState<T | null>(null);

    const handleAdd = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };
    const handleEdit = (item: T) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };
    const handleDelete = (item: T) => {
        setDeletingItem(item);
    };
    const handleConfirmDelete = async () => {
        if (deletingItem) {
            await api.delete(deletingItem.id);
            setDeletingItem(null);
            onDataChange();
        }
    };
    const handleSave = () => {
        setIsModalOpen(false);
        onDataChange();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Tambah {itemTitle}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            {fields.map(field => (
                                <th key={field.name} className="px-4 py-3">{field.label}</th>
                            ))}
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="border-b hover:bg-slate-50">
                                {fields.map(field => (
                                    <td key={field.name} className="px-4 py-3 font-medium text-slate-900">{item[field.name]}</td>
                                ))}
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800" title="Ubah"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800" title="Hapus"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <ConfigItemModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    item={editingItem}
                    itemTitle={itemTitle}
                    fields={fields}
                    api={api}
                />
            )}
            {deletingItem && (
                <Modal
                    isOpen={!!deletingItem}
                    onClose={() => setDeletingItem(null)}
                    title={`Konfirmasi Hapus ${itemTitle}`}
                >
                    <p>Apakah Anda yakin ingin menghapus <strong>{deletingItem[fields[0]?.name] || ''}</strong>?</p>
                    <div className="flex justify-end gap-3 pt-4 mt-4">
                        <button onClick={() => setDeletingItem(null)} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
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
};

const ConfigItemModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSave: () => void,
    item: ConfigItem | null,
    itemTitle: string,
    fields: { name: string; label: string; type?: string; }[];
    api: {
        add: (item: any) => Promise<any>;
        update: (item: any) => Promise<any>;
    }
}> = ({ isOpen, onClose, onSave, item, itemTitle, fields, api }) => {
    
    const [formData, setFormData] = useState<Record<string, any>>(() => {
        const initialData: Record<string, any> = {};
        fields.forEach(field => {
            initialData[field.name] = item?.[field.name] || '';
        });
        return initialData;
    });

    useEffect(() => {
        const initialData: Record<string, any> = {};
        fields.forEach(field => {
            initialData[field.name] = item?.[field.name] || '';
        });
        setFormData(initialData);
    }, [item, fields]);


    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (item) {
                await api.update({ ...item, ...formData });
            } else {
                await api.add(formData);
            }
            onSave();
        } catch (error) {
            console.error(`Failed to save ${itemTitle}`, error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? `Ubah ${itemTitle}` : `Tambah ${itemTitle} Baru`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(field => (
                     <div key={field.name}>
                        <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">{field.label}</label>
                        <input
                            type={field.type || 'text'}
                            id={field.name}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md"
                        />
                    </div>
                ))}
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
};