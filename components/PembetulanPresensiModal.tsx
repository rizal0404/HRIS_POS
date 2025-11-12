import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Presensi, JadwalKerja, UserProfile, ShiftConfig, UsulanJenis, UsulanStatus } from '../types';
import { apiService } from '../services/apiService';

interface PembetulanPresensiModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    presensiData: {
        employee: UserProfile;
        presensi: Presensi | undefined;
        schedule: JadwalKerja | undefined;
        shiftInfo: ShiftConfig | undefined;
    };
    clockType: 'in' | 'out';
    loggedInUser: UserProfile;
}

const formatTimeForInput = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

const formatDateForInput = (dateStr: string) => { // DD/MM/YYYY to YYYY-MM-DD
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
};

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => {
    const [copied, setCopied] = useState(false);
    
    const isSetupError = message.includes('CREATE TABLE') || message.includes('SETUP INSTRUCTIONS');

    if (!isSetupError) {
        return <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 font-semibold">{message}</div>;
    }

    const sqlCodeMatch = message.match(/CREATE TABLE[\s\S]*/);
    const sqlCode = sqlCodeMatch ? sqlCodeMatch[0] : null;
    const introText = sqlCode ? message.substring(0, message.indexOf('CREATE TABLE')) : message;
    const title = introText.split('\n')[0];
    const body = introText.split('\n').slice(1).join('\n');


    const handleCopy = () => {
        if (sqlCode) {
            navigator.clipboard.writeText(sqlCode).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
            <h3 className="font-bold">{title || 'Setup Required'}</h3>
            <pre className="whitespace-pre-wrap mt-2 text-sm">{body}</pre>
            {sqlCode && (
                <div className="relative bg-red-100 p-2 rounded mt-2">
                    <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">{sqlCode}</pre>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="absolute top-2 right-2 bg-slate-600 text-white text-xs px-2 py-1 rounded hover:bg-slate-700"
                    >
                        {copied ? 'Copied!' : 'Copy SQL'}
                    </button>
                </div>
            )}
        </div>
    );
};


export const PembetulanPresensiModal: React.FC<PembetulanPresensiModalProps> = ({ isOpen, onClose, onSuccess, presensiData, clockType, loggedInUser }) => {
    const { employee, presensi, schedule } = presensiData;

    const originalDate = presensi?.tanggal || schedule?.tanggal || '';
    const originalTime = clockType === 'in'
        ? (presensi?.clockInTimestamp ? formatTimeForInput(presensi.clockInTimestamp) : '--:--')
        : (presensi?.clockOutTimestamp ? formatTimeForInput(presensi.clockOutTimestamp) : '--:--');

    const [pembetulanTanggal, setPembetulanTanggal] = useState(formatDateForInput(originalDate));
    const [pembetulanJam, setPembetulanJam] = useState('');
    const [alasan, setAlasan] = useState('');
    const [buktiFile, setBuktiFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (isOpen) {
            setPembetulanTanggal(formatDateForInput(originalDate));
            setPembetulanJam('');
            setAlasan('');
            setBuktiFile(null);
            setSubmissionError('');
        }
    }, [isOpen, originalDate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionError('');

        try {
            let linkBukti;
            if (buktiFile) {
                const fileName = `${employee.nik}-pembetulan-${Date.now()}-${buktiFile.name}`;
                linkBukti = await apiService.uploadProofFile(buktiFile, fileName);
            }

            await apiService.addPembetulanPresensi({
                nik: employee.nik,
                nama: employee.name,
                seksi: employee.seksi,
                rolePengaju: loggedInUser.role,
                managerId: employee.managerId,
                status: UsulanStatus.Diajukan,
                jenisAjuan: UsulanJenis.PembetulanPresensi,
                presensiId: presensi?.id,
                tanggalPembetulan: pembetulanTanggal,
                jamPembetulan: pembetulanJam,
                clockType: clockType,
                alasan: alasan,
                linkBukti,
            });
            
            onSuccess();
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Gagal mengajukan pembetulan.";
            setSubmissionError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pembetulan Presensi">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Info section */}
                <div>
                    <h3 className="text-base font-semibold text-slate-800">Hari, Tanggal</h3>
                    <p className="text-slate-600">{new Date(formatDateForInput(originalDate)+'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Original Presensi */}
                    <div className="space-y-4 rounded-lg bg-slate-50 p-4 border">
                        <h3 className="font-semibold text-slate-800">Presensi</h3>
                        <div>
                            <label className="text-sm text-slate-500">Clock Type</label>
                            <input type="text" readOnly value={clockType === 'in' ? 'Clock In' : 'Clock Out'} className="mt-1 w-full bg-slate-100 rounded-md border-slate-300 shadow-sm" />
                        </div>
                        <div>
                            <label className="text-sm text-slate-500">Periode Presensi</label>
                            <input type="text" readOnly value={originalDate} className="mt-1 w-full bg-slate-100 rounded-md border-slate-300 shadow-sm" />
                        </div>
                        <div>
                            <label className="text-sm text-slate-500">Jam (WIB)</label>
                            <input type="text" readOnly value={originalTime} className="mt-1 w-full bg-slate-100 rounded-md border-slate-300 shadow-sm" />
                        </div>
                        <div>
                            <label className="text-sm text-slate-500">Lokasi Kerja</label>
                            <input type="text" readOnly value={presensi?.clockInWorkLocationType || '-'} className="mt-1 w-full bg-slate-100 rounded-md border-slate-300 shadow-sm" />
                        </div>
                         <div>
                            <label className="text-sm text-slate-500">Tempat Kerja</label>
                            <input type="text" readOnly value={presensi?.clockInWorkplace || '-'} className="mt-1 w-full bg-slate-100 rounded-md border-slate-300 shadow-sm" />
                        </div>
                    </div>

                    {/* Pembetulan Form */}
                    <div className="space-y-4">
                         <h3 className="font-semibold text-slate-800">Pembetulan</h3>
                         <div>
                            <label className="text-sm text-slate-500">Clock Type</label>
                            {/* Fix: Removed the invalid 'readOnly' attribute from the <select> element. 'disabled' is sufficient. */}
                            <select value={clockType} className="mt-1 w-full bg-slate-100 rounded-md border-slate-300 shadow-sm" disabled>
                                <option value="in">Clock In</option>
                                <option value="out">Clock Out</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="pembetulan-tanggal" className="text-sm text-slate-500">Periode Presensi</label>
                            <input type="date" id="pembetulan-tanggal" value={pembetulanTanggal} onChange={e => setPembetulanTanggal(e.target.value)} required className="mt-1 w-full rounded-md border-slate-300 shadow-sm" />
                        </div>
                         <div>
                            <label htmlFor="pembetulan-jam" className="text-sm text-slate-500">Jam (WIB)</label>
                            <input type="time" id="pembetulan-jam" value={pembetulanJam} onChange={e => setPembetulanJam(e.target.value)} required className="mt-1 w-full rounded-md border-slate-300 shadow-sm" />
                        </div>
                         <div>
                            <label htmlFor="alasan" className="text-sm text-slate-500">Alasan/Keterangan Pembetulan</label>
                            <textarea id="alasan" rows={3} value={alasan} onChange={e => setAlasan(e.target.value)} required className="mt-1 w-full rounded-md border-slate-300 shadow-sm"></textarea>
                        </div>
                        <div>
                             <label className="text-sm text-slate-500">Bukti Alasan</label>
                             <div
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:border-slate-400"
                             >
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <p className="text-xs text-slate-500">{buktiFile ? buktiFile.name : 'Klik untuk unggah (PNG, JPG, PDF)'}</p>
                                </div>
                             </div>
                             <input type="file" ref={fileInputRef} onChange={e => setBuktiFile(e.target.files ? e.target.files[0] : null)} className="hidden" accept="image/png, image/jpeg, application/pdf" />
                        </div>
                    </div>
                </div>

                {submissionError && <ErrorDisplay message={submissionError} />}
                
                {/* Action buttons */}
                <div className="flex justify-center gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-6 border border-slate-300 rounded-md shadow-sm font-medium text-slate-700 hover:bg-slate-50">
                        Kembali
                    </button>
                    <button type="submit" disabled={isSubmitting} className="bg-black py-2 px-6 border border-transparent rounded-md shadow-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-400">
                        {isSubmitting ? 'Mengajukan...' : 'Ajukan Pembetulan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};