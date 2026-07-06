import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import ActionTimelineRaccordement from '@/Components/ActionTimelineRaccordement';
import CommentSection from '@/Components/CommentSection';
import DepotActionRaccordementComplet from '@/Components/DepotActionRaccordementComplet';
import SendCommentForm from '@/Components/SendCommentForm';
import Main from '@/Layouts/GuestLayout';
import { usePage } from '@inertiajs/react';

export default function Show({ raccordement, auth, actions, actionsStats, currentStatus, commentaires,attente, commentairesStats }) {
    const [activeTab, setActiveTab] = useState('details');
    const [modalOpen, setModalOpen] = useState(false);
    const [initialAction, setInitialAction] = useState(null);
const { url } = usePage();
const urlParams = new URLSearchParams(url.split('?')[1]);
const initialTab = urlParams.get('tab') === 'comments' ? 'comments' : 'details';

    const formatDate = (date) => date || '-';
    const { auth: pageAuth } = usePage().props;
    const isTechnicien = pageAuth?.user?.roles?.includes('technicien');

    const getStatusBadgeClass = (color) => {
        const classes = {
            gray: 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-md',
            green: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md',
            red: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md',
            blue: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md',
            purple: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md',
            orange: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md',
        };
        return classes[color] || 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-md';
    };

 const isWaitingExpired = attente && 
        attente.client_wait_end && 
        new Date(attente.client_wait_end) < new Date() && 
        !attente.replanned;

    const hasPlanification = actions?.some(a => a.action_type === 'planification') || false;
    const hasImpossibilite = actions?.some(a => a.action_type === 'impossibilite') || false;
    const hasCr = actions?.some(a => a.action_type === 'livraison_cr') || false;
    const hasDoe = actions?.some(a => a.action_type === 'livraison_doe') || false;
    const hasDft = actions?.some(a => a.action_type === 'livraison_dft') || false;
    const hasRoute = actions?.some(a => a.action_type === 'route_optique') || false;

    const openModal = (action) => {
        setInitialAction(action);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setInitialAction(null);
    };

    const handleSuccess = () => router.reload();

    const order = {
        admin_rds: raccordement?.admin_rds,
        admin_bca: raccordement?.admin_bca,
        admin_prefix: raccordement?.admin_prefix,
        admin_contract: raccordement?.admin_contract,
    };

    const Icon = ({ path, className = "w-5 h-5" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
        </svg>
    );

    return (
        <Main user={auth.user}>
            <div className="relative min-h-screen overflow-hidden">
                {/* Effets de fond animés */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-full mx-auto">
                        {/* Lien retour */}
                        <Link
                            href="/raccordements"
                            className="inline-flex items-center gap-1 text-[#2A7B9B] hover:text-[#1f5f7a] font-medium transition-all group mb-5"
                        >
                            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Retour à la liste
                        </Link>

                        {/* HEADER PRINCIPAL : Carte entièrement colorée (inchangée) */}
                        <div className="mb-8">
                            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden">
                                {/* En-tête bleu */}
                                <div className="px-6 py-4 bg-[#2A7B9B] flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-white" />
                                        <h2 className="text-lg font-semibold text-white">Raccordement</h2>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-md ring-1 ring-white/20 ${getStatusBadgeClass(currentStatus?.color || 'gray')}`}>
                                       
                                        <span>{currentStatus?.label || 'En attente'}</span>
                                    </div>
                                </div>
                                {/* Corps blanc */}
                                <div className="p-6 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                        <InfoItem label="RDS" value={raccordement?.admin_rds} />
                                        <InfoItem label="BCA" value={raccordement?.admin_bca} />
                                        <InfoItem label="Contrat" value={raccordement?.admin_contract} />
                                        <InfoItem label="Opérateur" value={raccordement?.operator_name} />
                                        <InfoItem label="Date commande" value={formatDate(raccordement?.order_date)} />
                                        {raccordement?.project_name && <InfoItem label="Projet" value={raccordement?.project_name} />}
                                        <InfoItem label="Réseau" value={raccordement?.network} />
                                        <InfoItem label="Offre" value={raccordement?.offer} />
                                        <InfoItem label="Bande passante" value={raccordement?.bandwith} />
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <InfoItem 
                                                label="Site A" 
                                                value={`${raccordement?.address_site_a_name || ''} ${raccordement?.address_site_a_street || ''} ${raccordement?.address_site_a_postal || ''} ${raccordement?.address_site_a_town || ''}`.trim() || '-'} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {isWaitingExpired && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
                <p className="text-yellow-700">
                    ⚠️ La période d’attente client est terminée ({attente.client_wait_end}). 
                    Veuillez relancer la planification.
                </p>
                <button 
                    onClick={() => openModal('planification')}
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
                >
                    Planifier à nouveau
                </button>
            </div>
        )}

                        {/* Carte ACTIONS (header coloré, body blanc) */}
                        <div className="mb-8">
                            <Card title="Actions" icon="">
                                {isTechnicien ? (
                                    <p className="text-gray-500 text-sm">Vous n’avez pas les droits pour effectuer des actions.</p>
                                ) : (
                                    <div className="flex flex-row gap-3 overflow-x-auto pb-2">
                                        {!hasPlanification && !hasImpossibilite && (
                                            <ActionButton onClick={() => openModal('planification')} icon="" color="green" label="Planifier le raccordement" />
                                        )}
                                        {!hasImpossibilite && !hasPlanification && (
                                            <ActionButton onClick={() => openModal('impossibilite')} icon="" color="red" label="Signaler une impossibilité" />
                                        )}
                                        {hasPlanification && !hasCr && (
                                            <ActionButton onClick={() => openModal('livraison_cr')} icon="" color="emerald" label="Livrer CR Client" />
                                        )}
                                        {hasPlanification && !hasDoe && (
                                            <ActionButton onClick={() => openModal('livraison_doe')} icon="" color="teal" label="Livrer DOE" />
                                        )}
                                        {hasPlanification && !hasDft && (
                                            <ActionButton onClick={() => openModal('livraison_dft')} icon="" color="slate" label="Livrer DFT" />
                                        )}
                                          {hasPlanification && !hasRoute && (
                                                <ActionButton onClick={() => openModal('route_optique')} icon="" color="gold" label="Route Optique" />
                                            )}
                                        {hasPlanification && (
                                            <ActionButton onClick={() => openModal('modification_date')} icon="" color="amber" label="Modifier la date" />
                                        )}
                                     
                                    </div>
                                )}
                            </Card>
                        </div>
                                        {attente && attente.client_wait_end && new Date(attente.client_wait_end) < new Date() && !attente.replanned && (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <p className="text-yellow-700">
            ⚠️ La période d’attente client est terminée (fin le {new Date(attente.client_wait_end).toLocaleDateString('fr-FR')}). 
            Veuillez relancer la planification.
        </p>
        <button
            onClick={() => openModal('planification')}
            className="mt-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold px-4 py-2"
        >
            Planifier à nouveau
        </button>
    </div>
)}

                        {/* Tabs */}
                        <div className="border-b border-slate-200 mb-8">
                            <nav className="-mb-px flex space-x-8">
                                {[
                                    { id: 'details', label: 'Informations', icon: '' },
                                    { id: 'actions', label: `Historique (${actionsStats?.total || 0})`, icon: '' },
                                    { id: 'comments', label: 'Commentaires', icon: '', badge: commentairesStats?.non_lus > 0 ? commentairesStats.non_lus : null }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            group inline-flex items-center gap-2 py-2.5 px-1 border-b-2 font-medium text-sm transition-all duration-200
                                            ${activeTab === tab.id
                                                ? 'border-[#2A7B9B] text-[#2A7B9B]'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <span className="text-base">{tab.icon}</span>
                                        <span>{tab.label}</span>
                                        {tab.badge && (
                                            <span className="ml-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs rounded-full px-1.5 py-0.5 animate-pulse">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                                 
                        {/* Grille principale (contenu des onglets) */}
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-6">
                                {activeTab === 'details' && (
                                    <>
                                        <Card title="Informations générales" icon="">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                <InfoItem label="Contrat" value={raccordement?.admin_contract} />
                                                <InfoItem label="Opérateur" value={raccordement?.operator_name} />
                                                <InfoItem label="Technologie" value={raccordement?.techno} />
                                                <InfoItem label="Bande passante" value={raccordement?.bandwith} />
                                                <InfoItem label="Réseau" value={raccordement?.network} />
                                                <InfoItem label="Offre" value={raccordement?.offer} />
                                                <InfoItem label="Date commande" value={formatDate(raccordement?.order_date)} />
                                            </div>
                                        </Card>

                                        <Card title="Adresse site A" icon="">
                                            <div className="space-y-3">
                                                <InfoItem label="Nom" value={raccordement?.address_site_a_name} />
                                                <InfoItem label="Rue" value={raccordement?.address_site_a_street} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InfoItem label="Code postal" value={raccordement?.address_site_a_postal} />
                                                    <InfoItem label="Ville" value={raccordement?.address_site_a_town} />
                                                </div>
                                                <InfoItem label="Code INSEE" value={raccordement?.insee_code} />
                                            </div>
                                        </Card>

                                        <Card title="Références techniques" icon="">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                <InfoItem label="Nom NRO" value={raccordement?.nro_name} />
                                                <InfoItem label="Port NRO" value={raccordement?.nro_port} />
                                                <InfoItem label="BPE Piquage" value={raccordement?.bpe_piquage} />
                                                <InfoItem label="Code bâtiment" value={raccordement?.building_code} />
                                                <InfoItem label="N° Équipement" value={raccordement?.equipement_number} />
                                                <InfoItem label="N° MER" value={raccordement?.mer_number} />
                                            </div>
                                        </Card>
                                    </>
                                )}

                                {activeTab === 'actions' && (
                                    <Card title={`Historique des actions (${actionsStats?.total || 0})`} icon="">
                                        {!actions || actions.length === 0 ? (
                                            <p className="text-slate-500 text-center py-12">Aucune action enregistrée</p>
                                        ) : (
                                            <ActionTimelineRaccordement actions={actions} />
                                        )}
                                    </Card>
                                )}

                                {activeTab === 'comments' && (
                                    <Card title="Commentaires" icon="">
                                        <CommentSection
                                            commentaires={commentaires || []}
                                            commandeId={raccordement?.id}
                                            commandeType="raccordement"
                                            stats={commentairesStats || { total: 0, non_lus: 0 }}
                                        />
                                        <div className="mt-6 pt-6 border-t border-slate-200">
                                            <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                                                 Ajouter un commentaire
                                            </h3>
                                            <SendCommentForm
                                                commande={raccordement}
                                                commandeType="raccordement"
                                                onSuccess={handleSuccess}
                                            />
                                        </div>
                                    </Card>
                                )}

                               
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {modalOpen && (
    <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal} />
            <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 max-w-5xl w-full mx-auto transform transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800">
                        {initialAction === 'planification' && 'Planifier le raccordement'}
                        {initialAction === 'impossibilite' && 'Signaler une impossibilité'}
                        {initialAction === 'livraison_cr' && 'Livrer CR Client'}
                        {initialAction === 'modification_date' && 'Modifier la date de planification'}
                        {initialAction === 'livraison_doe' && 'Livrer DOE'}
                        {initialAction === 'livraison_dft' && 'Livrer DFT'}
                        {initialAction === 'route_optique' && 'Route Optique'}
                    </h3>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-500 transition-colors text-2xl leading-none">
                        &times;
                    </button>
                </div>
                <div className="p-6">
                    <DepotActionRaccordementComplet
                        order={order}
                        initialAction={initialAction}
                        onSuccess={() => router.reload()}
                        existingActions={actions}
                        onSuccess={handleSuccess}
                        onClose={closeModal}
                    />
                </div>
            </div>
        </div>
    </div>
)}
            </div>

            <style jsx>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient 3s linear infinite;
                }
            `}</style>
        </Main>
    );
}

// ========== COMPOSANTS INTERNES STYLISÉS ==========
// Carte avec header coloré et body blanc
const Card = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden">
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

// InfoItem standard (pour corps blanc)
const InfoItem = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-slate-800 font-medium break-words">{value || '-'}</dd>
    </div>
);

// Version blanche pour la carte principale entièrement colorée
const InfoItemWhite = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-white/80">{label}</dt>
        <dd className="mt-1 text-white font-medium break-words">{value || '-'}</dd>
    </div>
);

const ActionButton = ({ onClick, icon, color, label }) => {
    const colors = {
        green: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/30',
        red: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/30',
        emerald: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30',
        teal: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-500/30',
        slate: 'bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 shadow-lg shadow-slate-500/30',
        amber: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/30',
        gold: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 shadow-lg shadow-yellow-500/30',
    };
    const colorClass = colors[color] || colors.green;
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 ${colorClass} text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A7B9B] flex items-center justify-center gap-2 whitespace-nowrap`}
        >
            <span className="text-lg">{icon}</span>
            {label}
        </button>
    );
};
