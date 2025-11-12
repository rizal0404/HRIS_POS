import React, { useMemo } from 'react';
import { Usulan, UserProfile, UsulanStatus, UsulanJenis, UsulanLembur, UsulanCuti } from '../../types';

const DashboardCard: React.FC<{title: string, value: string | number, subtext?: string}> = ({ title, value, subtext }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-slate-500 truncate">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
);

export const DashboardTab: React.FC<{ proposals: Usulan[], employees: UserProfile[] }> = ({ proposals, employees }) => {
    
    const dashboardData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const lastMonthDate = new Date(now);
        lastMonthDate.setMonth(currentMonth - 1);
        const lastMonthYear = lastMonthDate.getFullYear();
        const lastMonth = lastMonthDate.getMonth();

        const pendingLeave = proposals.filter(p => p.status === UsulanStatus.Diajukan && p.jenisAjuan === UsulanJenis.CutiTahunan).length;
        const pendingOvertime = proposals.filter(p => p.status === UsulanStatus.Diajukan && p.jenisAjuan === UsulanJenis.Lembur).length;

        let overtimeThisMonth = 0;
        let overtimeLastMonth = 0;
        const overtimeByEmployee: { [nik: string]: { name: string, totalHours: number } } = {};
        
        proposals
            // Fix: Added type guard to ensure `p` is UsulanLembur.
            .filter((p): p is UsulanLembur => p.status === UsulanStatus.Disetujui && p.jenisAjuan === UsulanJenis.Lembur)
            .forEach(p => {
                const [day, monthStr, yearStr] = p.timestamp.split(' ')[0].split('/');
                const proposalMonth = parseInt(monthStr, 10) - 1;
                const proposalYear = parseInt(yearStr, 10);
                
                if (proposalYear === currentYear && proposalMonth === currentMonth) {
                    // Fix: Correctly access `jamLembur` after ensuring the proposal is of type `UsulanLembur`. Used 'p' instead of 'proposal'.
                    overtimeThisMonth += p.jamLembur;
                }
                if (proposalYear === lastMonthYear && proposalMonth === lastMonth) {
                    // Fix: Correctly access `jamLembur` after ensuring the proposal is of type `UsulanLembur`. Used 'p' instead of 'proposal'.
                    overtimeLastMonth += p.jamLembur;
                }

                if (!overtimeByEmployee[p.nik]) {
                    overtimeByEmployee[p.nik] = { name: p.nama, totalHours: 0 };
                }
                // Fix: Correctly access `jamLembur` after ensuring the proposal is of type `UsulanLembur`. Used 'p' instead of 'proposal'.
                overtimeByEmployee[p.nik].totalHours += p.jamLembur;
            });

        const topOvertimeEmployees = Object.values(overtimeByEmployee)
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, 5);

        const usedLeaveByNik: { [nik: string]: number } = {};
        proposals
            // Fix: Correctly access `periode` by ensuring the proposal is of type `UsulanCuti`. Used 'p' instead of 'proposal'.
            .filter((p): p is UsulanCuti => p.status === UsulanStatus.Disetujui && p.jenisAjuan === UsulanJenis.CutiTahunan)
            .forEach(p => {
                // Fix: Corrected logic to calculate date difference from the `periode` object. Used 'p' instead of 'proposal'.
                const { startDate, endDate } = p.periode;
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        if (!usedLeaveByNik[p.nik]) usedLeaveByNik[p.nik] = 0;
                        usedLeaveByNik[p.nik] += diffDays;
                    }
                }
            });

        const topLeaveBalanceEmployees = employees
            .map(emp => ({
                ...emp,
                remainingLeave: emp.totalCutiTahunan - (usedLeaveByNik[emp.nik] || 0)
            }))
            .sort((a, b) => b.remainingLeave - a.remainingLeave)
            .slice(0, 5);


        return {
            pendingLeave,
            pendingOvertime,
            overtimeThisMonth,
            overtimeLastMonth,
            topOvertimeEmployees,
            topLeaveBalanceEmployees
        };

    }, [proposals, employees]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardCard title="Ajuan Cuti Baru" value={dashboardData.pendingLeave} />
                <DashboardCard title="Ajuan Lembur Baru" value={dashboardData.pendingOvertime} />
                <DashboardCard title="Total Lembur Bulan Ini" value={`${dashboardData.overtimeThisMonth} Jam`} />
                <DashboardCard title="Total Lembur Bulan Lalu" value={`${dashboardData.overtimeLastMonth} Jam`} />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Top 5 Jam Lembur Karyawan</h3>
                    <ul className="space-y-3">
                        {dashboardData.topOvertimeEmployees.map((emp, index) => (
                             <li key={emp.name} className="flex justify-between items-center text-sm">
                                <span className="text-slate-700">{index + 1}. {emp.name}</span>
                                <span className="font-semibold text-slate-900 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{emp.totalHours} Jam</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Top 5 Karyawan Sisa Cuti Terbanyak</h3>
                     <ul className="space-y-3">
                        {dashboardData.topLeaveBalanceEmployees.map((emp, index) => (
                             <li key={emp.nik} className="flex justify-between items-center text-sm">
                                <span className="text-slate-700">{index + 1}. {emp.name}</span>
                                <span className="font-semibold text-slate-900 bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{emp.remainingLeave} Hari</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
