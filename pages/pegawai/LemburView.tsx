import React, { useState } from 'react';
import { UsulanLembur, UsulanCuti, JadwalKerja, ShiftConfig, UserProfile, Presensi, VendorConfig, UsulanPembetulanPresensi, UsulanIzinSakit } from '../../types';
import { DataLemburTab } from './lembur/DataLemburTab';
import { MonitoringLemburView } from './lembur/MonitoringLemburView';

interface LemburViewProps {
    user: UserProfile;
    onAdd: () => void;
    onEdit: (lembur: UsulanLembur) => void;
    usulanLembur: UsulanLembur[];
    usulanCuti: UsulanCuti[];
    usulanIzinSakit: UsulanIzinSakit[];
    usulanPembetulan: UsulanPembetulanPresensi[];
    jadwal: JadwalKerja[];
    shiftConfigs: ShiftConfig[];
    onDelete: (id: string) => void;
    presensi: Presensi[];
    allPegawai: UserProfile[];
    vendorConfigs: VendorConfig[];
}

export const LemburView: React.FC<LemburViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState('data');

    return (
        <div>
            <header className="bg-red-700 text-white p-4 rounded-t-lg flex items-center">
                <h1 className="text-xl font-bold">Lembur</h1>
            </header>

            <div className="bg-white p-6 rounded-b-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('data')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'data'
                                ? 'border-red-500 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            aria-current={activeTab === 'data' ? 'page' : undefined}
                        >
                            Data Lembur
                        </button>
                        <button
                            onClick={() => setActiveTab('monitoring')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'monitoring'
                                ? 'border-red-500 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                             aria-current={activeTab === 'monitoring' ? 'page' : undefined}
                        >
                            Monitoring Lembur
                        </button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'data' && (
                        <DataLemburTab
                            onAdd={props.onAdd}
                            usulanLembur={props.usulanLembur}
                            onDelete={props.onDelete}
                            onEdit={props.onEdit}
                        />
                    )}
                    {activeTab === 'monitoring' && (
                        <MonitoringLemburView
                            user={props.user}
                            usulanLembur={props.usulanLembur}
                            usulanCuti={props.usulanCuti}
                            usulanIzinSakit={props.usulanIzinSakit}
                            usulanPembetulan={props.usulanPembetulan}
                            jadwal={props.jadwal}
                            shiftConfigs={props.shiftConfigs}
                            presensi={props.presensi}
                            vendorConfigs={props.vendorConfigs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
