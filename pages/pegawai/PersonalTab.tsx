import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { apiService } from '../../services/apiService';

// Reusable component for displaying profile fields
const ProfileField: React.FC<{ label: string; value: string; name: string; isEditing: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; readOnly?: boolean; }> = ({ label, value, name, isEditing, onChange, readOnly = false }) => {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-500">{label}</label>
            {isEditing && !readOnly ? (
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md"
                />
            ) : (
                <p className="mt-1 text-sm text-slate-900 font-semibold bg-slate-100 p-2 rounded-md min-h-[38px]">
                    {value || '-'}
                </p>
            )}
        </div>
    );
};

// Main component for the Personal tab
export const PersonalTab: React.FC<{ user: UserProfile, onDataChange: () => void }> = ({ user, onDataChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        noHp: user.noHp || '',
        alamat: user.alamat || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Reset form data if user prop changes or editing is cancelled
    useEffect(() => {
        setFormData({
            noHp: user.noHp || '',
            alamat: user.alamat || '',
        });
    }, [user, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setAlert(null);

        try {
            const updatedProfile: UserProfile = {
                ...user,
                noHp: formData.noHp,
                alamat: formData.alamat,
            };
            await apiService.updateUserProfile(updatedProfile);
            setAlert({ message: 'Profil berhasil diperbarui.', type: 'success' });
            setIsEditing(false);
            onDataChange(); // Refresh data in the parent component
        } catch (error) {
            console.error("Failed to update profile:", error);
            setAlert({ message: 'Gagal memperbarui profil.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Auto-dismiss alert
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => setAlert(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">Profil Personal</h2>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-300"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="bg-slate-800 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-slate-900"
                            >
                                Ubah Data
                            </button>
                        )}
                    </div>
                </div>

                {alert && (
                    <div className={`mb-4 p-3 rounded-md text-sm ${alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {alert.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Read-only fields */}
                    <ProfileField label="NIK" name="nik" value={user.nik} isEditing={false} onChange={() => {}} readOnly />
                    <ProfileField label="Nama Lengkap" name="name" value={user.name} isEditing={false} onChange={() => {}} readOnly />
                    <ProfileField label="Email" name="email" value={user.email} isEditing={false} onChange={() => {}} readOnly />
                    <ProfileField label="Posisi" name="posisi" value={user.posisi} isEditing={false} onChange={() => {}} readOnly />
                    <ProfileField label="Seksi" name="seksi" value={user.seksi} isEditing={false} onChange={() => {}} readOnly />
                    <ProfileField label="Unit Kerja" name="unitKerja" value={user.unitKerja} isEditing={false} onChange={() => {}} readOnly />
                    <ProfileField label="Manager" name="manager" value={user.manager?.name || '-'} isEditing={false} onChange={() => {}} readOnly />
                    <ProfileField label="Sisa Cuti Tahunan" name="sisaCuti" value={`${user.totalCutiTahunan} hari`} isEditing={false} onChange={() => {}} readOnly />
                    
                    {/* Editable fields */}
                    <ProfileField label="Nomor HP" name="noHp" value={formData.noHp} isEditing={isEditing} onChange={handleChange} />
                    <ProfileField label="Alamat" name="alamat" value={formData.alamat} isEditing={isEditing} onChange={handleChange} />
                </div>
            </form>
        </div>
    );
};
