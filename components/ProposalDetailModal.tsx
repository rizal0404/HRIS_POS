import React from 'react';
import Modal from './Modal';
import { Usulan, UsulanCuti, UsulanLembur, UsulanSubstitusi, UsulanJenis, UsulanStatus, UserProfile, UsulanPembetulanPresensi } from '../types';
import { CalendarIcon, ClockIcon, UserIcon, FileTextIcon, ArrowLeftRightIcon } from './Icons';

// Helper to format dates
const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    // Handles both YYYY-MM-DD and DD/MM/YYYY HH:mm:ss
    const date = new Date(dateStr.includes(' ') ? dateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1') : dateStr + 'T00:00:00');
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTimestamp = (timestampStr: string) => {
    if (!timestampStr) return 'N/A';
     const parts = timestampStr.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) return timestampStr;
    const [, day, month, year, hour, minute] = parts;
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}`);
    return date.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Detail item component
const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 w-6 h-6 text-slate-500">{icon}</div>
        <div className="ml-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
        </div>
    </div>
);

// Get status badge styles
const getStatusBadge = (status: UsulanStatus) => {
    switch (status) {
        case UsulanStatus.Disetujui: return 'bg-green-100 text-green-800';
        case UsulanStatus.Ditolak: return 'bg-red-100 text-red-800';
        case UsulanStatus.Revisi: return 'bg-orange-100 text-orange-800';
        case UsulanStatus.Diajukan:
        default: return 'bg-yellow-100 text-yellow-800';
    }
};

interface ProposalDetailModalProps {
    proposal: Usulan | null;
    employees: UserProfile[];
    onClose: () => void;
    onApprove: (proposal: Usulan) => void;
    onReject: (proposal: Usulan) => void;
}

export const ProposalDetailModal: React.FC<ProposalDetailModalProps> = ({ proposal, employees, onClose, onApprove, onReject }) => {
    if (!proposal) return null;

    const renderProposalSpecificDetails = () => {
        switch (proposal.jenisAjuan) {
            case UsulanJenis.CutiTahunan:
            case UsulanJenis.IzinSakit:
                const pCuti = proposal as UsulanCuti;
                const penggantiName = pCuti.penggantiNik?.map(nik => employees.find(e => e.nik === nik)?.name || nik).join(', ') || '-';
                return (
                    <>
                        <DetailItem icon={<CalendarIcon />} label="Periode Cuti" value={`${formatDate(pCuti.periode.startDate)} s/d ${formatDate(pCuti.periode.endDate)}`} />
                        <DetailItem icon={<UserIcon />} label="Pengganti" value={penggantiName} />
                        <DetailItem icon={<FileTextIcon />} label="Keterangan" value={pCuti.keterangan} />
                        {pCuti.linkBerkas && (
                             <DetailItem icon={<FileTextIcon />} label="Berkas" value={<a href={pCuti.linkBerkas} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat Berkas</a>} />
                        )}
                    </>
                );
            case UsulanJenis.Lembur:
                const pLembur = proposal as UsulanLembur;
                return (
                     <>
                        <DetailItem icon={<CalendarIcon />} label="Tanggal Lembur" value={formatDate(pLembur.tanggalLembur)} />
                        <DetailItem icon={<ClockIcon />} label="Shift" value={pLembur.shift} />
                        <DetailItem icon={<ClockIcon />} label="Jam Lembur" value={`${pLembur.jamAwal} - ${pLembur.jamAkhir} (${pLembur.jamLembur} Jam)`} />
                        <DetailItem icon={<FileTextIcon />} label="Keterangan" value={pLembur.keteranganLembur} />
                    </>
                );
            case UsulanJenis.Substitusi:
                const pSub = proposal as UsulanSubstitusi;
                return (
                    <>
                        <DetailItem icon={<CalendarIcon />} label="Tanggal Substitusi" value={formatDate(pSub.tanggalSubstitusi)} />
                        <DetailItem icon={<ArrowLeftRightIcon />} label="Perubahan Shift" value={`${pSub.shiftAwal} → ${pSub.shiftBaru}`} />
                        <DetailItem icon={<FileTextIcon />} label="Keterangan" value={pSub.keterangan} />
                    </>
                );
             case UsulanJenis.PembetulanPresensi:
                const pPembetulan = proposal as UsulanPembetulanPresensi;
                return (
                    <>
                        <DetailItem icon={<CalendarIcon />} label="Tanggal Pembetulan" value={formatDate(pPembetulan.tanggalPembetulan)} />
                        <DetailItem icon={<ClockIcon />} label="Jam Pembetulan" value={`${pPembetulan.jamPembetulan} (untuk Clock ${pPembetulan.clockType.toUpperCase()})`} />
                        <DetailItem icon={<FileTextIcon />} label="Alasan" value={pPembetulan.alasan} />
                        {pPembetulan.linkBukti && (
                             <DetailItem icon={<FileTextIcon />} label="Bukti" value={<a href={pPembetulan.linkBukti} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat Bukti</a>} />
                        )}
                    </>
                );
            default:
                return null;
        }
    }

    return (
        <Modal isOpen={!!proposal} onClose={onClose} title="Detail Ajuan">
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-bold text-lg text-slate-800">{proposal.nama}</h3>
                    <p className="text-sm text-slate-500">NIK: {proposal.nik} | Seksi: {proposal.seksi}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <DetailItem icon={<FileTextIcon />} label="Jenis Ajuan" value={proposal.jenisAjuan} />
                    <DetailItem icon={<CalendarIcon />} label="Tanggal Diajukan" value={formatTimestamp(proposal.timestamp)} />
                    <DetailItem 
                        icon={<ClockIcon />} 
                        label="Status" 
                        value={<span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(proposal.status)}`}>{proposal.status}</span>}
                    />
                    {proposal.catatanAdmin && (
                        <div className="sm:col-span-2">
                             <DetailItem icon={<FileTextIcon />} label="Catatan Admin" value={<span className="text-orange-700">{proposal.catatanAdmin}</span>} />
                        </div>
                    )}
                </div>
                
                <hr className="my-4"/>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderProposalSpecificDetails()}
                </div>

                {proposal.status === UsulanStatus.Diajukan && (
                    <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                        <button
                            type="button"
                            onClick={() => onReject(proposal)}
                            className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700"
                        >
                            Tolak / Minta Revisi
                        </button>
                        <button
                            type="button"
                            onClick={() => onApprove(proposal)}
                            className="bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700"
                        >
                            Setujui
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}