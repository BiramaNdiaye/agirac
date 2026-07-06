import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function CovageFtto({ title, stats, breadcrumbs }) {
    return (
        <AuthenticatedLayout header={title} title={title}>
            <Head title={title} />
            
            {/* Similaire à CovageFtthPro avec des ajustements spécifiques */}
            {/* Structure similaire mais avec des données spécifiques au module FTTO */}
            
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Module COVAGE / FTTO</h2>
                <p className="text-gray-600 mb-6">Gestion des raccordements FTTO (Fiber To The Office).</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Fonctionnalités principales</h3>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                            <li>Suivi des commandes FTTO</li>
                            <li>Gestion des raccordements d'entreprises</li>
                            <li>Planification des interventions</li>
                            <li>Suivi de la qualité de service</li>
                        </ul>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Statistiques rapides</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Commandes actives</p>
                                <p className="text-lg font-semibold text-green-600">{stats.enCours} / {stats.totalCommandes}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Taux de retard</p>
                                <p className="text-lg font-semibold text-red-600">{((stats.enRetard / stats.totalCommandes) * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
