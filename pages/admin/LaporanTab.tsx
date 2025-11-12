import React, { useState, useMemo } from 'react';
import { Usulan, UsulanJenis, UsulanCuti, UsulanLembur, UsulanSubstitusi } from '../../types';
import { DownloadIcon } from '../../components/Icons';

// Helper to format a date object to YYYY-MM-DD
const toYYYYMMDD = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const LaporanSection: React.FC<{
    title: string;
    proposals: Usulan[];
    onDownload: (proposals: Usulan[], startDate?: string, endDate?: string) => void;
}> = ({ title, proposals, onDownload }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const handleDownloadClick = () => {
        onDownload(proposals, startDate, endDate);
    }

    return (
        <div className="bg-slate-50 p-6 rounded-lg border">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto">
                    <label htmlFor={`start-${title}`} className="text-sm font-medium text-slate-600">Dari Tanggal</label>
                    <input type="date" id={`start-${title}`} value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div className="w-full sm:w-auto">
                    <label htmlFor={`end-${title}`} className="text-sm font-medium text-slate-600">Sampai Tanggal</label>
                    <input type="date" id={`end-${title}`} value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div className="w-full sm:w-auto sm:self-end">
                    <button onClick={handleDownloadClick} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-green-700 transition">
                        <DownloadIcon className="w-4 h-4" />
                        Download CSV
                    </button>
                </div>
            </div>
        </div>
    );
};


export const LaporanTab: React.FC<{ proposals: Usulan[] }> = ({ proposals }) => {
    
    const { cuti, lembur, substitusi } = useMemo(() => {
        return {
            cuti: proposals.filter(p => p.jenisAjuan === UsulanJenis.CutiTahunan || p.jenisAjuan === UsulanJenis.IzinSakit),
            lembur: proposals.filter(p => p.jenisAjuan === UsulanJenis.Lembur),
            substitusi: proposals.filter(p => p.jenisAjuan === UsulanJenis.Substitusi),
        };
    }, [proposals]);

    const downloadCSV = (data: any[], headers: {key: string, label: string}[], filename: string, startDate?: string, endDate?: string) => {
        
        const filteredData = data.filter(item => {
            let itemDateStr = '';
            if ('periode' in item) itemDateStr = item.periode.startDate;
            else if ('tanggalLembur' in item) itemDateStr = item.tanggalLembur;
            else if ('tanggalSubstitusi' in item) itemDateStr = item.tanggalSubstitusi;

            if (!itemDateStr) return true; // Include if date is not available
            
            const itemDate = new Date(itemDateStr + 'T00:00:00');
            if (startDate && itemDate < new Date(startDate + 'T00:00:00')) return false;
            if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
            
            return true;
        });

        if (filteredData.length === 0) {
            alert("Tidak ada data untuk diunduh pada rentang tanggal yang dipilih.");
            return;
        }

        const csvRows = [
            headers.map(h => h.label).join(','),
            ...filteredData.map(row => 
                headers.map(header => {
                    let cell = row[header.key];
                    if (header.key.includes('.')) {
                        const keys = header.key.split('.');
                        cell = keys.reduce((obj, k) => (obj && obj[k] !== 'undefined') ? obj[k] : '', row);
                    }
                    
                    const value = cell === null || cell === undefined ? '' : String(cell);
                    return `"${value.replace(/"/g, '""')}"`; // Handle quotes
                }).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${toYYYYMMDD(new Date())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadCuti = (data: Usulan[], startDate?: string, endDate?: string) => {
        const headers = [
            { key: 'nik', label: 'NIK' },
            { key: 'nama', label: 'Nama' },
            { key: 'status', label: 'Status' },
            { key: 'jenisAjuan', label: 'Jenis Ajuan' },
            { key: 'periode.startDate', label: 'Tanggal Mulai' },
            { key: 'periode.endDate', label: 'Tanggal Selesai' },
            { key: 'keterangan', label: 'Keterangan' },
            { key: 'timestamp', label: 'Tanggal Pengajuan' },
        ];
        downloadCSV(data, headers, 'laporan_cuti', startDate, endDate);
    };

    const handleDownloadLembur = (data: Usulan[], startDate?: string, endDate?: string) => {
        const headers = [
            { key: 'nik', label: 'NIK' },
            { key: 'nama', label: 'Nama' },
            { key: 'status', label: 'Status' },
            { key: 'tanggalLembur', label: 'Tanggal Lembur' },
            { key: 'jamAwal', label: 'Jam Mulai' },
            { key: 'jamAkhir', label: 'Jam Selesai' },
            { key: 'jamLembur', label: 'Total Jam' },
            { key: 'keteranganLembur', label: 'Keterangan' },
            { key: 'timestamp', label: 'Tanggal Pengajuan' },
        ];
        downloadCSV(data, headers, 'laporan_lembur', startDate, endDate);
    };

    const handleDownloadSubstitusi = (data: Usulan[], startDate?: string, endDate?: string) => {
        const headers = [
            { key: 'nik', label: 'NIK' },
            { key: 'nama', label: 'Nama' },
            { key: 'status', label: 'Status' },
            { key: 'tanggalSubstitusi', label: 'Tanggal' },
            { key: 'shiftAwal', label: 'Shift Awal' },
            { key: 'shiftBaru', label: 'Shift Baru' },
            { key: 'keterangan', label: 'Keterangan' },
            { key: 'timestamp', label: 'Tanggal Pengajuan' },
        ];
        downloadCSV(data, headers, 'laporan_substitusi', startDate, endDate);
    };


    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Download Laporan</h2>
            <LaporanSection title="Laporan Cuti & Izin/Sakit" proposals={cuti} onDownload={handleDownloadCuti} />
            <LaporanSection title="Laporan Lembur" proposals={lembur} onDownload={handleDownloadLembur} />
            <LaporanSection title="Laporan Substitusi" proposals={substitusi} onDownload={handleDownloadSubstitusi} />
        </div>
    );
};