import React from 'react';
import { Link } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';

export default function Index({ rds, info, events }) {
    const formatDateTime = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (begin, end) => {
        if (!begin || !end) return null;
        const now = new Date();
        const start = new Date(begin.split('/').reverse().join('-'));
        const endDate = new Date(end.split('/').reverse().join('-'));
        if (start <= now && endDate >= now)
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#2A7B9B] to-[#1f5f7a] text-white shadow-sm ml-2">En cours</span>;
        if (endDate < now)
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm ml-2">Terminée</span>;
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm ml-2">À venir</span>;
    };

    const getEventIcon = (event) => {
        switch (event.type) {
            case 'vt': return '🔧';
            case 'raccordement': return '🔌';
            case 'commentaire': return '💬';
            case 'attente': return '⏳';
            default: return '📌';
        }
    };

    const getEventColorClass = (event) => {
        switch (event.type) {
            case 'vt': return 'border-l-4 border-l-[#2A7B9B] bg-white/80';
            case 'raccordement': return 'border-l-4 border-l-[#1f5f7a] bg-white/80';
            case 'commentaire': return 'border-l-4 border-l-indigo-400 bg-white/80';
            case 'attente': return 'border-l-4 border-l-amber-500 bg-white/80';
            default: return 'border-l-4 border-l-slate-400 bg-white/80';
        }
    };

    const IconSparkle = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>;

    // Valeurs par défaut
    const safeBcas = info?.bcas ?? [];
    const safeProjets = info?.projets ?? [];
    const safeOperateurs = info?.operateurs ?? [];
    const safeContrats = info?.contrats ?? [];

    return (
        <Main>
            <div className="relative min-h-screen overflow-hidden">
                {/* Effets de fond */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2A7B9B] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2A7B9B] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-full mx-auto">
                        {/* Lien retour */}
                        <div className="mb-6">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-1 text-[#2A7B9B] hover:text-[#1f5f7a] font-medium transition-all group"
                            >
                                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Retour au tableau de bord
                            </Link>
                        </div>

                        {/* Carte d’identité avec header */}
                        <Card title="Informations principales" icon="ℹ️">
                            <div className="space-y-4">
                                <p className="text-slate-600">
                                    RDS : <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{rds}</span>
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                                    <InfoItem label="BCA associés" value={safeBcas.join(', ') || '-'} />
                                    <InfoItem label="Contrats" value={safeContrats.join(', ') || '-'} />
                                    <InfoItem label="Projets" value={safeProjets.join(', ') || '-'} />
                                    <InfoItem label="Opérateurs" value={safeOperateurs.join(', ') || '-'} />
                                    
                                    <InfoItem label="Dernière action" value={formatDateTime(info?.date_derniere_action)} />
                                </div>
                            </div>
                        </Card>

                        {/* Timeline (conservée telle quelle) */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 transition-all hover:shadow-2xl mt-8">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-[#2A7B9B] rounded-full"></span>
                                Historique complet
                            </h2>
                            {events.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-3">
                                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500 font-medium">Aucun événement enregistré pour ce RDS.</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#2A7B9B] via-slate-300 to-transparent"></div>
                                    <div className="space-y-5">
                                        {events.map((event, idx) => (
                                            <div key={event.id} className="relative pl-12 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white shadow-md border-2 border-[#2A7B9B]/30 flex items-center justify-center text-lg z-10">
                                                    {getEventIcon(event)}
                                                </div>
                                                <div className={`rounded-xl p-4 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.01] backdrop-blur-sm ${getEventColorClass(event)} border border-white/40`}>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-slate-800">{event.label}</h3>
                                                            {event.type !== 'commentaire' && event.type !== 'attente' && event.bca && (
                                                                <p className="text-xs text-slate-500 mt-0.5">BCA : {event.bca}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs text-slate-500">{formatDateTime(event.date)}</p>
                                                        </div>
                                                    </div>

                                                    {event.type === 'commentaire' && (
                                                        <div className="mt-3 pt-2 border-t border-slate-100">
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">💬</div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm text-slate-700">
                                                                        <strong className="text-indigo-700">{event.auteur || 'Anonyme'}</strong> : {event.contenu}
                                                                    </p>
                                                                    {event.est_reponse && (
                                                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                            </svg>
                                                                            Réponse à un commentaire précédent
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {event.type === 'attente' && (
                                                        <div className="mt-3 pt-2 border-t border-slate-100">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <span className="text-sm font-medium text-amber-700">⏳ Période :</span>
                                                                <span className="text-sm text-slate-700">{event.begin_client_wait} → {event.client_wait_end}</span>
                                                                {getStatusBadge(event.begin_client_wait, event.client_wait_end)}
                                                            </div>
                                                            {event.comment && (
                                                                <p className="text-sm text-slate-600 italic mt-1 bg-slate-50/80 p-2 rounded-lg">{event.comment}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {event.type !== 'commentaire' && event.type !== 'attente' && (
                                                        <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                                                            {event.action_type === 'planification' && (
                                                                <div className="flex items-center gap-2 text-[#2A7B9B]">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium">Planifiée le {event.planning_date}</span>
                                                                </div>
                                                            )}
                                                            {event.action_type === 'impossibilite' && (
                                                                <div className="flex items-start gap-2 text-rose-700">
                                                                    <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                    </svg>
                                                                    <div>
                                                                        <span className="text-sm font-medium">Impossibilité</span>
                                                                        <p className="text-xs text-slate-600 mt-0.5">{event.fail_reason}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {(event.action_type === 'livraison_crvt' || event.action_type === 'livraison_cr') && (
                                                                <div className="flex items-center gap-2 text-[#2A7B9B]">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium">CR livré</span>
                                                                </div>
                                                            )}
                                                            {event.action_type === 'livraison_doe' && (
                                                                <div className="flex items-center gap-2 text-indigo-700">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium">DOE livré</span>
                                                                </div>
                                                            )}
                                                            {event.action_type === 'livraison_dft' && (
                                                                <div className="flex items-center gap-2 text-amber-700">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium">DFT livré</span>
                                                                </div>
                                                            )}
                                                            {event.comment && (
                                                                <p className="text-sm text-slate-600 italic bg-slate-50/80 p-2 rounded-lg mt-1">{event.comment}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.4s ease-out forwards;
                }
            `}</style>
        </Main>
    );
}

// ================== COMPOSANT CARD (header coloré, corps blanc) ==================
const Card = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all hover:shadow-2xl">
        <div className="px-6 py-4 bg-[#2A7B9B]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                {title}
            </h2>
        </div>
        <div className="p-6 bg-white">
            {children}
        </div>
    </div>
);

// Composant utilitaire
const InfoItem = ({ label, value }) => (
    <div>
        <dt className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</dt>
        <dd className="mt-1 text-slate-700 font-medium break-words">{value}</dd>
    </div>
);
