import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, UserRole, Shift, Seksi, UnitKerja } from '../../types';
import { apiService } from '../../services/apiService';
import Modal from '../../components/Modal';
import { EditIcon, TrashIcon, DownloadIcon, UploadIcon, PlusCircleIcon, FingerprintIcon } from '../../components/Icons';

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props}) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-700">{label}</label>
        <input {...props} id={props.name} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md disabled:bg-slate-100"/>
    </div>
);

const UserProfileFormModal: React.FC<{
    isOpen: boolean, 
    onClose: () => void, 
    onSuccess: () => void, 
    profile: UserProfile | null,
    allEmployees: UserProfile[],
    allSeksi: Seksi[],
    allUnitKerja: UnitKerja[],
}> = ({ isOpen, onClose, onSuccess, profile, allEmployees, allSeksi, allUnitKerja }) => {
    
    const initialFormData: Omit<UserProfile, 'id'> = {
        nik: '', name: '', posisi: '', shiftKerja: Shift.DayShift, seksi: '', unitKerja: '',
        alamat: '', noHp: '', email: '', totalCutiTahunan: 12, role: UserRole.Pegawai, managerId: '',
    };

    const [formData, setFormData] = useState<Omit<UserProfile, 'id'>>(initialFormData);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [newUserId, setNewUserId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (profile) { // Editing mode
                setStep(2);
                setFormData({
                    nik: profile.nik || '',
                    name: profile.name || '',
                    posisi: profile.posisi || '',
                    shiftKerja: profile.shiftKerja || Shift.DayShift,
                    seksi: profile.seksi || '',
                    unitKerja: profile.unitKerja || '',
                    alamat: profile.alamat || '',
                    noHp: profile.noHp || '',
                    email: profile.email || '',
                    totalCutiTahunan: profile.totalCutiTahunan || 12,
                    role: profile.role || UserRole.Pegawai,
                    managerId: profile.managerId || '',
                });
            } else { // Adding mode
                setStep(1);
                setFormData({
                    ...initialFormData,
                    seksi: allSeksi[0]?.name || '',
                    unitKerja: allUnitKerja[0]?.name || '',
                });
                setPassword('');
                setConfirmPassword('');
                setNewUserId(null);
            }
        }
    }, [isOpen, profile, allSeksi, allUnitKerja]);
    
    const managerOptions = useMemo(() => {
        return allEmployees.filter(e => e.role === UserRole.Manager || e.role === UserRole.SuperAdmin);
    }, [allEmployees]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'totalCutiTahunan' ? Number(value) : value }));
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Kata sandi tidak cocok.');
            return;
        }
        if (password.length < 6) {
            setError('Kata sandi harus terdiri dari minimal 6 karakter.');
            return;
        }
        setIsSubmitting(true);
        try {
            const user = await apiService.createAuthUser(formData.email, password);
            setNewUserId(user.id);
            setStep(2);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat akun.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const dataToSubmit = { ...formData };
            if (dataToSubmit.role === UserRole.Manager || dataToSubmit.role === UserRole.SuperAdmin) {
                dataToSubmit.managerId = '';
            }

            if (profile) { // Editing existing profile
                await apiService.updateUserProfile({ ...dataToSubmit, id: profile.id });
            } else if (newUserId) { // Submitting new profile details
                await apiService.insertUserProfile(newUserId, dataToSubmit);
            } else {
                throw new Error("Sesi pembuatan pengguna tidak valid. Silakan coba lagi.");
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to save employee data:", error);
            setError(error instanceof Error ? error.message : 'Gagal menyimpan data: Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={profile ? "Ubah Data Pengguna" : (step === 1 ? "Tambah Akun Login (1/2)" : "Lengkapi Profil (2/2)")}
        >
            <form onSubmit={step === 1 && !profile ? handleAuthSubmit : handleFinalSubmit} className="space-y-3">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                
                {step === 1 && !profile && (
                    <div className="space-y-3">
                        <InputField label="Email (untuk Login)" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        <InputField label="Password Awal" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"/>
                        <InputField label="Konfirmasi Password Awal" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"/>
                    </div>
                )}
                
                {step === 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField label="Email (untuk Login)" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={true}/>
                        <div/> {/* Spacer */}
                        <InputField label="NIK" name="nik" value={formData.nik} onChange={handleChange} required />
                        <InputField label="Nama Lengkap" name="name" value={formData.name} onChange={handleChange} required />
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-slate-700">Role</label>
                            <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md">
                                <option value={UserRole.Pegawai}>Pegawai</option>
                                <option value={UserRole.Manager}>Manager</option>
                                <option value={UserRole.Admin}>Admin</option>
                                <option value={UserRole.SuperAdmin}>SuperAdmin</option>
                            </select>
                        </div>
                        {(formData.role === UserRole.Pegawai || formData.role === UserRole.Admin) && (
                             <div>
                                <label htmlFor="managerId" className="block text-sm font-medium text-slate-700">Manager</label>
                                <select id="managerId" name="managerId" value={formData.managerId} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md">
                                    <option value="">Tidak Ada</option>
                                    {managerOptions.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <InputField label="Posisi" name="posisi" value={formData.posisi} onChange={handleChange} required/>
                        <div>
                            <label htmlFor="seksi" className="block text-sm font-medium text-slate-700">Seksi</label>
                            <select id="seksi" name="seksi" value={formData.seksi} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md">
                                <option value="">Pilih Seksi</option>
                                {allSeksi.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <InputField label="No. HP" name="noHp" value={formData.noHp} onChange={handleChange} required/>
                        <div>
                            <label htmlFor="unitKerja" className="block text-sm font-medium text-slate-700">Unit Kerja</label>
                            <select id="unitKerja" name="unitKerja" value={formData.unitKerja} onChange={handleChange} required className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md">
                               <option value="">Pilih Unit Kerja</option>
                               {allUnitKerja.map(u => (
                                    <option key={u.id} value={u.name}>{u.name}</option>
                               ))}
                            </select>
                        </div>
                        <InputField label="Alamat" name="alamat" value={formData.alamat} onChange={handleChange} required/>
                        <InputField label="Total Cuti Tahunan" name="totalCutiTahunan" type="number" value={formData.totalCutiTahunan} onChange={handleChange} required/>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                    {step === 1 && !profile ? (
                         <button type="submit" disabled={isSubmitting} className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">{isSubmitting ? "Membuat..." : "Lanjut"}</button>
                    ) : (
                         <button type="submit" disabled={isSubmitting} className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
                    )}
                </div>
            </form>
        </Modal>
    )
};

const UploadUsersModal: React.FC<{ isOpen: boolean, onClose: () => void, onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Silakan pilih file CSV untuk diunggah.");
            return;
        }
        setIsUploading(true);
        setError('');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csvText = event.target?.result as string;
                const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                const requiredHeaders = ['nik', 'name', 'email', 'role'];
                if(!requiredHeaders.every(h => headers.includes(h))) {
                    throw new Error(`CSV harus memiliki kolom: ${requiredHeaders.join(', ')}`);
                }

                const data: Omit<UserProfile, 'id'>[] = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                    const entry = headers.reduce((obj, header, index) => {
                        (obj as any)[header] = values[index] || '';
                        return obj;
                    }, {} as any);

                    return {
                        ...entry,
                        totalCutiTahunan: Number(entry.totalCutiTahunan) || 12,
                    }
                });

                await apiService.batchUpsertUserProfiles(data);
                onSuccess();

            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Gagal memproses file.");
            } finally {
                setIsUploading(false);
            }
        };

        reader.onerror = () => {
             setError("Gagal membaca file.");
             setIsUploading(false);
        }

        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload Data Pegawai (CSV)">
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-slate-600">Pilih file CSV untuk mengimpor atau memperbarui data pegawai secara massal. Pastikan file Anda memiliki kolom header yang sesuai. **Email** akan digunakan sebagai kunci unik.</p>
                </div>
                <div 
                    className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                >
                    <div className="text-center">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                                <span>Pilih file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} ref={fileInputRef}/>
                            </label>
                            <p className="pl-1">atau tarik dan lepas</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">CSV hingga 10MB</p>
                    </div>
                </div>
                 {file && <p className="text-sm text-slate-700 font-medium">File terpilih: {file.name}</p>}
                 {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                    <button onClick={handleUpload} disabled={isUploading || !file} className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">{isUploading ? 'Mengunggah...' : 'Unggah & Proses'}</button>
                </div>
            </div>
        </Modal>
    );
};

export const EmployeesTab: React.FC<{
    employees: UserProfile[], 
    allEmployees: UserProfile[],
    allSeksi: Seksi[], 
    allUnitKerja: UnitKerja[], 
    onDataChange: () => void,
    mode: 'manajemen' | 'pegawai'
}> = ({employees, allEmployees, allSeksi, allUnitKerja, onDataChange, mode}) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
    const [deletingProfile, setDeletingProfile] = useState<UserProfile | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resettingProfile, setResettingProfile] = useState<UserProfile | null>(null);

    const title = mode === 'manajemen' ? 'Data Manajemen' : 'Data Pegawai';
    const addUserButtonText = mode === 'manajemen' ? 'Tambah Manajemen' : 'Tambah Pegawai';

    const handleAddClick = () => {
        setEditingProfile(null);
        setIsFormModalOpen(true);
    };

    const handleEditClick = (profile: UserProfile) => {
        setEditingProfile(profile);
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (profile: UserProfile) => {
        setDeletingProfile(profile);
        setIsDeleteModalOpen(true);
    };

    const handleResetClick = (profile: UserProfile) => {
        setResettingProfile(profile);
        setIsResetModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deletingProfile) {
            await apiService.deleteUserProfile(deletingProfile.id);
            setIsDeleteModalOpen(false);
            setDeletingProfile(null);
            onDataChange();
        }
    };
    
    const handleConfirmReset = async () => {
        if (resettingProfile) {
            try {
                await apiService.resetFingerprintForUser(resettingProfile.id);
            } catch (error) {
                console.error('Failed to reset fingerprint:', error);
                // Optionally show an error message to the user
            } finally {
                setIsResetModalOpen(false);
                setResettingProfile(null);
            }
        }
    };

    const handleSaveSuccess = () => {
        setIsFormModalOpen(false);
        setEditingProfile(null);
        onDataChange();
    };

    const handleDownloadCSV = () => {
        const headers: (keyof UserProfile)[] = ['id', 'email', 'name', 'role', 'nik', 'posisi', 'seksi', 'unitKerja', 'shiftKerja', 'noHp', 'alamat', 'totalCutiTahunan'];
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + employees.map(e => headers.map(header => `"${e[header]}"`).join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `data_${mode}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 text-sm rounded-md hover:bg-green-700 transition">
                        <DownloadIcon className="w-4 h-4"/>
                        <span>Download Data</span>
                    </button>
                    {mode === 'pegawai' && (
                     <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 text-sm rounded-md hover:bg-orange-600 transition">
                        <UploadIcon className="w-4 h-4"/>
                        <span>Upload Data</span>
                    </button>
                    )}
                    <button onClick={handleAddClick} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition">
                        <PlusCircleIcon className="w-4 h-4"/>
                        <span>{addUserButtonText}</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-4 py-3">NIK</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Posisi</th>
                            <th className="px-4 py-3">Manager</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(e => (
                            <tr key={e.nik} className="border-b hover:bg-slate-50">
                                <td className="px-4 py-3">{e.nik}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{e.name}</td>
                                <td className="px-4 py-3">{e.posisi}</td>
                                <td className="px-4 py-3">{e.manager?.name || '-'}</td>
                                <td className="px-4 py-3">{e.role}</td>
                                <td className="px-4 py-3">{e.email}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(e)} className="text-blue-600 hover:text-blue-800" title="Ubah"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteClick(e)} className="text-red-600 hover:text-red-800" title="Hapus"><TrashIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleResetClick(e)} className="text-gray-600 hover:text-gray-800" title="Reset Perangkat"><FingerprintIcon className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {isFormModalOpen && (
                <UserProfileFormModal 
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    onSuccess={handleSaveSuccess}
                    profile={editingProfile}
                    allEmployees={allEmployees}
                    allSeksi={allSeksi}
                    allUnitKerja={allUnitKerja}
                />
            )}
            
            {isDeleteModalOpen && deletingProfile && (
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Konfirmasi Hapus">
                    <p>Apakah Anda yakin ingin menghapus data profil untuk <strong>{deletingProfile.name}</strong> (NIK: {deletingProfile.nik})?</p>
                    <div className="flex justify-end gap-3 pt-4 mt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                        <button onClick={handleConfirmDelete} className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700">Hapus</button>
                    </div>
                </Modal>
            )}

            {isUploadModalOpen && (
                <UploadUsersModal 
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={() => {
                        setIsUploadModalOpen(false);
                        onDataChange();
                    }}
                />
            )}

            {isResetModalOpen && resettingProfile && (
                <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Konfirmasi Reset Perangkat">
                    <p>Apakah Anda yakin ingin mereset perangkat terdaftar untuk <strong>{resettingProfile.name}</strong>? Tindakan ini akan mengizinkan pegawai untuk mendaftarkan perangkat baru saat mereka melakukan absensi berikutnya.</p>
                    <div className="flex justify-end gap-3 pt-4 mt-4">
                        <button onClick={() => setIsResetModalOpen(false)} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                        <button onClick={handleConfirmReset} className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">Reset</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};
