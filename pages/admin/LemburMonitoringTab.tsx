// This tells TypeScript that these variables are loaded globally from the script tags in index.html
declare const jspdf: any;
declare const html2canvas: any;

import React, { useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { UserProfile, JadwalKerja, Presensi, ShiftConfig, UsulanLembur, UsulanCuti, UsulanStatus, UsulanPembetulanPresensi, VendorConfig, UsulanIzinSakit } from '../../types';
import { SearchIcon, PrintIcon } from '../../components/Icons';

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const PrintableReport = React.forwardRef<HTMLDivElement, {
    reportData: any[],
    employee: UserProfile,
    vendor: VendorConfig | undefined,
}>(({ reportData, employee, vendor }, ref) => {
    
    const totalLembur = reportData.reduce((acc, row) => {
        const jam = parseFloat(row.jamLembur);
        return acc + (isNaN(jam) ? 0 : jam);
    }, 0);

    const polaShift = [...new Set(reportData.map(d => {
        const shift = d.shift?.toUpperCase();
        if (shift && !['LIBUR', 'OFF', 'CUTI', 'SAKIT'].includes(shift)) {
            return shift;
        }
        return null;
    }).filter(Boolean))].join(', ');

    return (
        <div ref={ref} className="bg-white p-8 font-sans text-black" style={{ width: '794px' }}>
            {/* Header */}
            <div className="text-center font-bold mb-4">
                <p className="text-sm">KOPKAR SEMEN TONASA</p>
                <p className="text-sm">MONITORING DAFTAR HADIR & SURAT PERINTAH LEMBUR (SPL)</p>
            </div>

            {/* User Info */}
            <div className="flex justify-between text-xs mb-2">
                <table className="text-xs">
                    <tbody>
                        <tr><td className="pr-2 font-normal">Nama</td><td>: {employee.name}</td></tr>
                        <tr><td className="pr-2 font-normal">No. ID</td><td>: {employee.nik}</td></tr>
                        <tr><td className="pr-2 font-normal">Pola Shift</td><td>: {polaShift}</td></tr>
                    </tbody>
                </table>
                <table className="text-xs">
                    <tbody>
                        <tr><td className="pr-2 font-normal">Seksi</td><td>: {employee.seksi}</td></tr>
                        <tr><td className="pr-2 font-normal">Unit</td><td>: {employee.unitKerja}</td></tr>
                        <tr><td className="pr-2 font-normal">Departemen</td><td>: Production Planning & Control</td></tr>
                    </tbody>
                </table>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black text-xs text-center">
                <thead className="font-bold">
                    <tr>
                        <th rowSpan={2} className="border border-black p-2">No.</th>
                        <th rowSpan={2} className="border border-black p-2">Tgl</th>
                        <th colSpan={2} className="border border-black p-2">Jam Kerja Shift</th>
                        <th rowSpan={2} className="border border-black p-2 break-words">Jam Kerja Aktual</th>
                        <th colSpan={3} className="border border-black p-2">Lembur</th>
                        <th rowSpan={2} className="border border-black p-2 break-words">Realisasi Uraian Pekerjaan</th>
                        <th rowSpan={2} className="border border-black p-2 break-words">Memerintahkan / Menyetujui</th>
                        <th rowSpan={2} className="border border-black p-2 break-words">Keterangan</th>
                    </tr>
                    <tr>
                        <th className="border border-black p-2">Masuk</th>
                        <th className="border border-black p-2">Pulang</th>
                        <th className="border border-black p-2">Mulai</th>
                        <th className="border border-black p-2">Selesai</th>
                        <th className="border border-black p-2">Jam Lembur</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map(row => (
                        <tr key={row.no}>
                            <td className="border border-black p-1">{row.no}</td>
                            <td className="border border-black p-1">{row.tgl}</td>
                            <td className="border border-black p-1">{row.shiftMasuk}</td>
                            <td className="border border-black p-1">{row.shiftPulang}</td>
                            <td className="border border-black p-1">{row.jamAktual}</td>
                            <td className="border border-black p-1">{row.lemburMulai}</td>
                            <td className="border border-black p-1">{row.lemburSelesai}</td>
                            <td className="border border-black p-1">{row.jamLembur}</td>
                            <td className="border border-black p-1 text-left">{row.uraianPekerjaan}</td>
                            <td className="border border-black p-1">{row.menyetujui}</td>
                            <td className="border border-black p-1">{row.keterangan}</td>
                        </tr>
                    ))}
                     <tr>
                        <td colSpan={7} className="border border-black p-1 font-bold text-right">Total Jam Lembur</td>
                        <td className="border border-black p-1 font-bold">{totalLembur > 0 ? `${totalLembur} jam` : ''}</td>
                        <td colSpan={3} className="border border-black p-1"></td>
                    </tr>
                </tbody>
            </table>

            {/* Footer */}
            <table className="w-full mt-8 text-xs">
                <tbody>
                    <tr>
                        <td className="w-1/2 text-left align-top">
                            <p>Vendor</p>
                            <p className="font-bold">{vendor?.namaVendor || 'KOPERASI SEMEN TONASA'}</p>
                            <p className="mt-12 font-bold underline">{vendor?.namaAdmin || 'MUH. KASIM'}</p>
                        </td>
                        <td className="w-1/2 text-center align-top">
                            <p>Mengetahui,</p>
                            <p className="font-bold">SECTION OF {employee.seksi}</p>
                            <p className="mt-12 font-bold underline">{employee.manager?.name || 'M. RIZAL M.'}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
});


interface LemburMonitoringTabProps {
    employeesForDropdown: UserProfile[];
    allUsulanLembur: UsulanLembur[];
    allUsulanCuti: UsulanCuti[];
    allUsulanIzinSakit: UsulanIzinSakit[];
    allUsulanPembetulan: UsulanPembetulanPresensi[];
    allSchedules: JadwalKerja[];
    allShiftConfigs: ShiftConfig[];
    allPresensi: Presensi[];
    allEmployees: UserProfile[];
    allVendorConfigs: VendorConfig[];
}

export const LemburMonitoringTab: React.FC<LemburMonitoringTabProps> = ({
    employeesForDropdown,
    allUsulanLembur,
    allUsulanCuti,
    allUsulanIzinSakit,
    allUsulanPembetulan,
    allSchedules,
    allShiftConfigs,
    allPresensi,
    allEmployees,
    allVendorConfigs
}) => {
    const [selectedNik, setSelectedNik] = useState(employeesForDropdown[0]?.nik || '');
    const [selectedMonth, setSelectedMonth] = useState(10); // November
    const [selectedYear, setSelectedYear] = useState(2025);
    const [isDownloading, setIsDownloading] = useState(false);
    // FIX: Define 'reportRef' using useRef to fix "Cannot find name 'reportRef'" error.
    const reportRef = useRef<HTMLDivElement>(null);

    const shiftMap = useMemo(() => new Map(allShiftConfigs.map(sc => [sc.code, sc])), [allShiftConfigs]);

    const { reportData, selectedEmployee } = useMemo(() => {
        if (!selectedNik) return { reportData: [], selectedEmployee: null };

        const employee = allEmployees.find(e => e.nik === selectedNik);
        if (!employee) return { reportData: [], selectedEmployee: null };

        const jadwal = allSchedules.filter(j => j.nik === selectedNik);
        const presensi = allPresensi.filter(p => p.nik === selectedNik);
        const lembur = allUsulanLembur.filter(l => l.nik === selectedNik);
        const cuti = allUsulanCuti.filter(c => c.nik === selectedNik);
        const izinSakit = allUsulanIzinSakit.filter(i => i.nik === selectedNik);
        const pembetulan = allUsulanPembetulan.filter(p => p.nik === selectedNik);

        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const data = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(selectedYear, selectedMonth, i);
            const dateStringDDMMYYYY = `${String(i).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`;
            const dateStringYYYYMMDD = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            const schedule = jadwal.find(j => j.tanggal === dateStringDDMMYYYY);
            let presensiRecord = presensi.find(p => p.tanggal === dateStringDDMMYYYY);
            const lemburRecord = lembur.find(l => l.tanggalLembur === dateStringYYYYMMDD && l.status === UsulanStatus.Disetujui);
            const cutiRecord = cuti.find(c => c.status === UsulanStatus.Disetujui && date >= new Date(c.periode.startDate + 'T00:00:00') && date <= new Date(c.periode.endDate + 'T00:00:00'));
            const izinSakitRecord = izinSakit.find(c => c.status === UsulanStatus.Disetujui && date >= new Date(c.periode.startDate + 'T00:00:00') && date <= new Date(c.periode.endDate + 'T00:00:00'));
            
            const approvedCorrections = pembetulan.filter(p => p.tanggalPembetulan === dateStringYYYYMMDD && p.status === UsulanStatus.Disetujui);
            if (approvedCorrections.length > 0) {
                let finalPresensi = presensiRecord ? { ...presensiRecord } : { id: `corrected-${employee.nik}-${dateStringDDMMYYYY}`, nik: employee.nik, nama: employee.name, tanggal: dateStringDDMMYYYY, shift: schedule?.shift || 'OFF' };
                const inCorrection = approvedCorrections.find(c => c.clockType === 'in');
                if (inCorrection) finalPresensi.clockInTimestamp = { toDate: () => new Date(`${inCorrection.tanggalPembetulan}T${inCorrection.jamPembetulan}`) };
                const outCorrection = approvedCorrections.find(c => c.clockType === 'out');
                if (outCorrection) finalPresensi.clockOutTimestamp = { toDate: () => new Date(`${outCorrection.tanggalPembetulan}T${outCorrection.jamPembetulan}`) };
                presensiRecord = finalPresensi;
            }

            const shiftInfo = schedule ? shiftMap.get(schedule.shift) : null;
            const [regulerMasuk, regulerPulang] = (schedule?.shift === 'OFF' || cutiRecord || izinSakitRecord) ? ['OFF', 'OFF'] : (shiftInfo?.time.split('-') || ['', '']);

            const formatTime = (ts: any) => ts ? new Date(ts.toDate()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g,':') : '';
            const jamAktual = cutiRecord ? 'Cuti' : (izinSakitRecord ? 'Izin/Sakit' : (presensiRecord ? `${formatTime(presensiRecord.clockInTimestamp)} - ${formatTime(presensiRecord.clockOutTimestamp)}`.replace(/^ - $/, '') : ''));

            let keterangan = cutiRecord ? cutiRecord.jenisAjuan : (izinSakitRecord ? 'Izin/Sakit' : '');
            if (lemburRecord) {
                if (keterangan) {
                    keterangan += '; Lembur';
                } else {
                    keterangan = 'Lembur';
                }
            }

            let jamLemburDisplay = '';
            if (lemburRecord) {
                if (schedule?.shift === 'OFF' && lemburRecord.jamAwal && lemburRecord.jamAkhir) {
                    const start = new Date(`1970-01-01T${lemburRecord.jamAwal}`);
                    const end = new Date(`1970-01-01T${lemburRecord.jamAkhir}`);
                    if (end < start) {
                        end.setDate(end.getDate() + 1);
                    }
                    const diffMs = end.getTime() - start.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    jamLemburDisplay = `${diffHours.toFixed(2).replace(/\.00$/, '')} jam`;
                } else {
                    jamLemburDisplay = lemburRecord.jamLembur != null ? `${lemburRecord.jamLembur} jam` : '';
                }
            }

            data.push({
                no: i,
                tgl: `${String(i).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}`,
                shiftMasuk: regulerMasuk,
                shiftPulang: regulerPulang,
                jamAktual: jamAktual,
                lemburMulai: lemburRecord?.jamAwal || '',
                lemburSelesai: lemburRecord?.jamAkhir || '',
                jamLembur: jamLemburDisplay,
                uraianPekerjaan: lemburRecord?.keteranganLembur || (cutiRecord || izinSakitRecord ? 'pangkep' : ''),
                menyetujui: lemburRecord || cutiRecord || izinSakitRecord ? (employee.manager?.name || 'SUPER ADMIN') : '',
                keterangan: keterangan,
                shift: schedule?.shift || (cutiRecord ? 'CUTI' : (izinSakitRecord ? 'SAKIT' : 'OFF')),
            });
        }
        return { reportData: data, selectedEmployee: employee };
    }, [selectedNik, selectedMonth, selectedYear, allEmployees, allSchedules, allPresensi, allUsulanLembur, allUsulanCuti, allUsulanIzinSakit, shiftMap, allUsulanPembetulan]);

    const handleDownload = async () => {
        if (!reportRef.current || !selectedEmployee) return;
        setIsDownloading(true);
        try {
            const { jsPDF } = jspdf;
            const reportContentElement = reportRef.current;
            if (!reportContentElement) throw new Error("Report element not found");

            const canvas = await html2canvas(reportContentElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: reportContentElement.scrollWidth,
                height: reportContentElement.scrollHeight,
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const headerHeight = 15;

            // Add header text
            pdf.setFontSize(16);
            pdf.text('Laporan Presensi', pdfWidth / 2, margin, { align: 'center' });
            pdf.setFontSize(10);
            pdf.text(`${selectedEmployee.name} (${selectedEmployee.nik})`, margin, margin + 10);
            pdf.text(`Periode: ${monthNames[selectedMonth]} ${selectedYear}`, pdfWidth - margin, margin + 10, { align: 'right' });

            // Calculate available content area
            const availableWidth = pdfWidth - (margin * 2);
            const availableHeight = pdfHeight - (margin * 2) - headerHeight;

            const imgProps = pdf.getImageProperties(imgData);
            const imgAspectRatio = imgProps.width / imgProps.height;
            const pageAspectRatio = availableWidth / availableHeight;

            let finalImgWidth, finalImgHeight;

            if (imgAspectRatio > pageAspectRatio) {
                finalImgWidth = availableWidth;
                finalImgHeight = finalImgWidth / imgAspectRatio;
            } else {
                finalImgHeight = availableHeight;
                finalImgWidth = finalImgHeight * imgAspectRatio;
            }

            const x = (pdfWidth - finalImgWidth) / 2;
            const y = margin + headerHeight;

            pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);
            pdf.save(`Monitoring_Lembur_${selectedEmployee.nik}_${selectedYear}-${selectedMonth + 1}.pdf`);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div className="bg-white rounded-lg shadow-md">
             <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 items-center">
                <select value={selectedNik} onChange={e => setSelectedNik(e.target.value)} className="form-select rounded-md border-gray-300 shadow-sm">
                    {employeesForDropdown.map(e => <option key={e.nik} value={e.nik}>{e.name} ({e.nik})</option>)}
                </select>
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="form-select rounded-md border-gray-300 shadow-sm">
                    {monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="form-select rounded-md border-gray-300 shadow-sm">
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                 <button className="bg-gray-700 text-white p-2 rounded-md hover:bg-gray-800"><SearchIcon className="w-5 h-5"/></button>
                 <button onClick={handleDownload} disabled={isDownloading || !selectedEmployee} className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2">
                    <PrintIcon className="w-5 h-5"/>
                    <span>{isDownloading ? 'Mencetak...' : 'Download'}</span>
                 </button>
             </div>
             <div className="overflow-x-auto p-4" ref={reportRef}>
                 <table className="min-w-full text-xs border-collapse border border-gray-300">
                     <thead className="bg-gray-100 text-center font-bold">
                         <tr>
                            <th rowSpan={2} className="border border-gray-300 p-1">No.</th>
                            <th colSpan={2} className="border border-gray-300 p-1">Jam Kerja Shift</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">Jam Kerja Aktual</th>
                            <th colSpan={3} className="border border-gray-300 p-1">Lembur</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">Realisasi Uraian Pekerjaan</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">Memerintahkan / Menyetujui</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">Keterangan</th>
                        </tr>
                        <tr>
                            <th className="border border-gray-300 p-1">Masuk</th>
                            <th className="border border-gray-300 p-1">Pulang</th>
                            <th className="border border-gray-300 p-1">Mulai</th>
                            <th className="border border-gray-300 p-1">Selesai</th>
                            <th className="border border-gray-300 p-1">Jam Lembur</th>
                        </tr>
                     </thead>
                     <tbody className="text-center">
                         {reportData.map(row => (
                             <tr key={row.no} className="even:bg-gray-50">
                                <td className="border border-gray-300 p-1">{row.no}</td>
                                <td className="border border-gray-300 p-1">{row.shiftMasuk}</td>
                                <td className="border border-gray-300 p-1">{row.shiftPulang}</td>
                                <td className="border border-gray-300 p-1">{row.jamAktual}</td>
                                <td className="border border-gray-300 p-1">{row.lemburMulai}</td>
                                <td className="border border-gray-300 p-1">{row.lemburSelesai}</td>
                                <td className="border border-gray-300 p-1">{row.jamLembur}</td>
                                <td className="border border-gray-300 p-1">{row.uraianPekerjaan}</td>
                                <td className="border border-gray-300 p-1">{row.menyetujui}</td>
                                <td className="border border-gray-300 p-1">{row.keterangan}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    );
};