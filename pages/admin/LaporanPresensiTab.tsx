// This tells TypeScript that these variables are loaded globally from the script tags in index.html
declare const jspdf: any;
declare const html2canvas: any;

import React, { useState, useMemo, useRef } from 'react';
import { UserProfile, JadwalKerja, Presensi, ShiftConfig, UsulanLembur, UsulanCuti, UsulanStatus, VendorConfig, UsulanPembetulanPresensi } from '../../types';
import { SearchIcon, PrintIcon } from '../../components/Icons';

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

interface LaporanPresensiTabProps {
    employees: UserProfile[];
    allSchedules: JadwalKerja[];
    allPresensi: Presensi[];
    allLembur: UsulanLembur[];
    allCuti: UsulanCuti[];
    allShiftConfigs: ShiftConfig[];
    allVendorConfigs: VendorConfig[];
    allPembetulan: UsulanPembetulanPresensi[];
}

export const LaporanPresensiTab: React.FC<LaporanPresensiTabProps> = ({ employees, allSchedules, allPresensi, allLembur, allCuti, allShiftConfigs, allPembetulan }) => {
    const [selectedNik, setSelectedNik] = useState(employees[0]?.nik || '');
    const [selectedMonth, setSelectedMonth] = useState(10); // November
    const [selectedYear, setSelectedYear] = useState(2025);
    const reportRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const shiftMap = useMemo(() => new Map(allShiftConfigs.map(sc => [sc.code, sc])), [allShiftConfigs]);

    const { reportData, selectedEmployee } = useMemo(() => {
        if (!selectedNik) return { reportData: [], selectedEmployee: null };

        const employee = employees.find(e => e.nik === selectedNik);
        if (!employee) return { reportData: [], selectedEmployee: null };

        const jadwal = allSchedules.filter(j => j.nik === selectedNik);
        const presensi = allPresensi.filter(p => p.nik === selectedNik);
        const lembur = allLembur.filter(l => l.nik === selectedNik);
        const cuti = allCuti.filter(c => c.nik === selectedNik);
        const pembetulan = allPembetulan.filter(p => p.nik === selectedNik);

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
            
            const approvedCorrections = pembetulan.filter(p => p.tanggalPembetulan === dateStringYYYYMMDD && p.status === UsulanStatus.Disetujui);
            if (approvedCorrections.length > 0) {
                let finalPresensi = presensiRecord ? { ...presensiRecord } : { id: `corrected-${employee.nik}-${dateStringDDMMYYYY}`, nik: employee.nik, nama: employee.name, tanggal: dateStringDDMMYYYY, shift: schedule?.shift || 'OFF' };
                const inCorrection = approvedCorrections.find(c => c.clockType === 'in');
                if (inCorrection) {
                    finalPresensi.clockInTimestamp = { toDate: () => new Date(`${inCorrection.tanggalPembetulan}T${inCorrection.jamPembetulan}`) };
                }
                const outCorrection = approvedCorrections.find(c => c.clockType === 'out');
                if (outCorrection) {
                    finalPresensi.clockOutTimestamp = { toDate: () => new Date(`${outCorrection.tanggalPembetulan}T${outCorrection.jamPembetulan}`) };
                }
                presensiRecord = finalPresensi;
            }

            const shiftInfo = schedule ? shiftMap.get(schedule.shift) : null;
            const [regulerMasuk, regulerPulang] = shiftInfo?.time.split('-') || ['', ''];

            const formatTime = (ts: any) => ts ? new Date(ts.toDate()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

            let keterangan = cutiRecord ? cutiRecord.jenisAjuan : (schedule?.shift === 'OFF' ? 'Libur' : '');
            if (lemburRecord) {
                if (keterangan && keterangan !== 'Libur') {
                    keterangan = `${keterangan}; Lembur`;
                } else {
                    keterangan = 'Lembur';
                }
            }

            data.push({
                no: i,
                nik: employee.nik,
                tanggal: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                shift: schedule?.shift || (cutiRecord ? 'CUTI' : 'Libur'),
                regulerMasuk,
                regulerPulang,
                realisasiMasuk: formatTime(presensiRecord?.clockInTimestamp),
                realisasiPulang: formatTime(presensiRecord?.clockOutTimestamp),
                ft: 0, tt: 0, dt: 0,
                ot: lemburRecord?.jamLembur || 0,
                otNormal: 0, otFlat: 0,
                otStart: lemburRecord?.jamAwal || '',
                otEnd: lemburRecord?.jamAkhir || '',
                kom: 0,
                hariLiburNasional: '',
                keterangan: keterangan,
            });
        }
        return { reportData: data, selectedEmployee: employee };
    }, [selectedNik, selectedMonth, selectedYear, employees, allSchedules, allPresensi, allLembur, allCuti, shiftMap, allPembetulan]);

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
                windowWidth: reportContentElement.scrollWidth,
                windowHeight: reportContentElement.scrollHeight,
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
            pdf.save(`Laporan_Presensi_${selectedEmployee.nik}_${selectedYear}-${selectedMonth + 1}.pdf`);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
             <header className="bg-red-700 text-white p-4 rounded-t-lg flex justify-between items-center">
                 <h1 className="text-xl font-bold">Laporan Presensi</h1>
             </header>
             <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 items-center">
                <select value={selectedNik} onChange={e => setSelectedNik(e.target.value)} className="form-select rounded-md border-gray-300 shadow-sm">
                    {employees.map(e => <option key={e.nik} value={e.nik}>{e.name} ({e.nik})</option>)}
                </select>
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="form-select rounded-md border-gray-300 shadow-sm">
                    {monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="form-select rounded-md border-gray-300 shadow-sm">
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                 <button className="bg-gray-700 text-white p-2 rounded-md hover:bg-gray-800"><SearchIcon className="w-5 h-5"/></button>
                 <button onClick={handleDownload} disabled={isDownloading} className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2">
                    <PrintIcon className="w-5 h-5"/>
                    <span>{isDownloading ? '...' : ''}</span>
                 </button>
             </div>
             <div className="overflow-x-auto p-4" ref={reportRef}>
                 <table className="min-w-full text-xs border-collapse border border-gray-300">
                     <thead className="bg-gray-100 text-center font-bold">
                         <tr>
                            <th rowSpan={2} className="border border-gray-300 p-1">No</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">No Karyawan</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">Tanggal</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">Shift</th>
                            <th colSpan={2} className="border border-gray-300 p-1">Reguler</th>
                            <th colSpan={2} className="border border-gray-300 p-1">Realisasi</th>
                            <th colSpan={9} className="border border-gray-300 p-1">Lembur</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">Hari Libur Nasional</th>
                            <th rowSpan={2} className="border border-gray-300 p-1">Keterangan</th>
                        </tr>
                        <tr>
                            <th className="border border-gray-300 p-1">Masuk</th>
                            <th className="border border-gray-300 p-1">Pulang</th>
                            <th className="border border-gray-300 p-1">Masuk</th>
                            <th className="border border-gray-300 p-1">Pulang</th>
                            <th className="border border-gray-300 p-1">FT</th>
                            <th className="border border-gray-300 p-1">TT</th>
                            <th className="border border-gray-300 p-1">DT</th>
                            <th className="border border-gray-300 p-1">OT</th>
                            <th className="border border-gray-300 p-1">OTNormal</th>
                            <th className="border border-gray-300 p-1">OTFlat</th>
                            <th className="border border-gray-300 p-1">OT Start</th>
                            <th className="border border-gray-300 p-1">OT End</th>
                            <th className="border border-gray-300 p-1">KOM</th>
                        </tr>
                     </thead>
                     <tbody className="text-center">
                         {reportData.map(row => (
                             <tr key={row.no} className="even:bg-gray-50">
                                 {Object.values(row).map((val, index) => <td key={index} className="border border-gray-300 p-1 whitespace-nowrap">{val as React.ReactNode}</td>)}
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    );
};