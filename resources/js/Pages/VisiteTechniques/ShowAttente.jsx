import React from 'react';
import { Link } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';

export default function Show({ attente }) {
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '-';

    const IconSparkle = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>;

    // Déterminer le statut de la période d'attente
    const getStatusInfo = () => {
        const now = new Date();
        const start = new Date(attente.begin_client_wait);
        const end = new Date(attente.client_wait_end);
        if (start <= now && end >= now) return { label: 'En cours', color: 'from-emerald-500 to-green-600', icon: '🟢' };
        if (end < now) return { label: 'Terminée', color: 'from-rose-500 to-red-600', icon: '🔚' };
        return { label: 'À venir', color: 'from-amber-500 to-orange-600', icon: '⏳' };
    };

    const status = getStatusInfo();

    return (
        <Main>
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50/40">
                {/* Effets de fond - z-index bas */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
                </div>

                {/* Contenu principal - z-index élevé */}
                <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Lien de retour */}
                        <div className="mb-6">
                            <Link
                                href={route('attente-client.index')}
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium transition-all group"
                            >
                                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Retour à la liste
                            </Link>
                        </div>

                        {/* Carte principale glassmorphique */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                            {/* En-tête avec titre et statut */}
                            <div className="px-6 py-5 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-200">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md">
                                            <IconSparkle className="text-emerald-600" />
                                        </div>
                                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">
                                            Période d'attente client
                                        </h1>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-md bg-gradient-to-r ${status.color} text-white`}>
                                        <span>{status.icon}</span>
                                        <span>{status.label}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Corps de la carte avec les informations */}
                            <div className="p-6">
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoItem label="RDS" value={attente.admin_rds} />
                                    <InfoItem label="BCA" value={attente.admin_bca} />
                                    <InfoItem label="Contrat" value={attente.admin_contract || '-'} />
                                    <InfoItem label="Projet" value={attente.project_name || '-'} />
                                    <InfoItem label="Opérateur" value={attente.operator_name || '-'} />
                                    <InfoItem label="Début attente" value={formatDate(attente.begin_client_wait)} />
                                    <InfoItem label="Fin attente" value={formatDate(attente.client_wait_end)} />
                                    <InfoItem label="Importé le" value={formatDate(attente.imported_at)} />
                                    <div className="md:col-span-2">
                                        <InfoItem label="Commentaire" value={attente.comment || '-'} isLong />
                                    </div>
                                    <div className="md:col-span-2">
                                        <InfoItem label="Fichier source" value={attente.source_file || '-'} isLong />
                                    </div>
                                </dl>
                            </div>

                            {/* Pied de carte avec métadonnées */}
                            <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                                <span>ID: {attente.id}</span>
                                <span>Créé le: {formatDate(attente.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Main>
    );
}

// Composant pour chaque ligne d'information
const InfoItem = ({ label, value, isLong = false }) => (
    <div className={isLong ? 'space-y-1' : ''}>
        <dt className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</dt>
        <dd className={`text-slate-800 font-medium ${isLong ? 'bg-slate-50 p-3 rounded-xl border border-slate-200' : 'mt-1'}`}>
            {value}
        </dd>
    </div>
);
