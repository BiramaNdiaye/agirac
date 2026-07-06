import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import ActionTimeline from '@/Components/ActionTimeline';
import CommentSection from '@/Components/CommentSection';
import DepotActionVTComplet from '@/Components/DepotActionVTComplet';
import SendCommentForm from '@/Components/SendCommentForm';
import Main from '@/Layouts/GuestLayout';

export default function Show({ visite, auth, actions, actionsStats, currentStatus, commentaires,attente, commentairesStats, crvtRejected = false,
        crvtRejectReason = null }) {
    const [activeTab, setActiveTab] = useState('details');
    const [modalOpen, setModalOpen] = useState(false);
    const [initialAction, setInitialAction] = useState(null);

    const order = {
        admin_rds: visite.admin_rds,
        admin_bca: visite.admin_bca,
        admin_prefix: visite.admin_prefix,
        admin_contract: visite.admin_contract,
    };
const isWaitingExpired = attente &&
        attente.client_wait_end &&
        new Date(attente.client_wait_end) < new Date() &&
        !attente.replanned;
    const formatDate = (date) => date || '-';

    const getStatusBadgeClass = (color) => ({
        gray: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/20',
        blue: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20',
        green: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20',
        red: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20',
        purple: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20',
        orange: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20',
    }[color] || 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/20');

    const hasPlanification = actions.some(a => a.action_type === 'planification');
    const hasImpossibilite = actions.some(a => a.action_type === 'impossibilite');
    const hasCrvt = actions.some(a => a.action_type === 'livraison_crvt');

    const openModal = (action) => {
        setInitialAction(action);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setInitialAction(null);
    };

    const handleSuccess = () => router.reload();

    const Icon = ({ path, className = "w-5 h-5" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
        </svg>
    );

    return (
        <Main user={auth.user}>
            <div className="relative min-h-screen overflow-hidden ">
                {isWaitingExpired && (
                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    ⚠️ La période d'attente client est terminée (fin le {new Date(attente.client_wait_end).toLocaleDateString('fr-FR')}). 
                                    Veuillez relancer la planification.
                                </p>
                                <button
                                    onClick={() => openModal('planification')}
                                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                    Planifier à nouveau
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Effets de fond */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 py-8">
                    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                        
                        {/* Lien retour avec la nouvelle couleur */}
                        <Link
                            href="/visites-techniques"
                            className="inline-flex items-center text-sm text-[#2A7B9B] hover:text-[#1f5f7a] mb-5 transition-all group"
                        >
                            <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Retour à la liste
                        </Link>

                        {/* HEADER PRINCIPAL : Carte entièrement colorée */}
                        <div className="mb-8">
                            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden">
                                {/* En-tête bleu */}
                                <div className="px-6 py-4 bg-[#2A7B9B] flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-white" />
                                        <h2 className="text-lg font-semibold text-white">Visite technique</h2>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-md ring-1 ring-white/20 ${getStatusBadgeClass(currentStatus.color)}`}>
                                        
                                        <span>{currentStatus.label}</span>
                                    </div>
                                </div>
                                {/* Corps blanc */}
                                <div className="p-6 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                        <InfoItem label="RDS" value={visite.admin_rds} />
                                        <InfoItem label="BCA" value={visite.admin_bca} />
                                        <InfoItem label="Contrat" value={visite.admin_contract} />
                                        <InfoItem label="Réference Route" value={visite.ref_rop} />
                                        <InfoItem label="Date commande" value={formatDate(visite.order_date)} />
                                        {visite.project_name && <InfoItem label="Projet" value={visite.project_name} />}
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <InfoItem 
                                                label="Site A" 
                                                value={`${visite.address_site_a_name || ''} ${visite.address_site_a_street || ''} ${visite.address_site_a_postal || ''} ${visite.address_site_a_town || ''}`.trim() || '-'} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {crvtRejected && crvtRejectReason && (
    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
        <div className="flex items-start">
            <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">CRVT refusé par Covage</h3>
                <p className="text-sm text-red-700 mt-1">Motif : {crvtRejectReason}</p>
                <div className="mt-3">
                    <button
                        onClick={() => openModal('livraison_crvt')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                    >
                        Modifier et renvoyer le CRVT
                    </button>
                </div>
            </div>
        </div>
    </div>
)}
                        {/* Carte ACTIONS (header coloré, body blanc) - avant les onglets */}
                        <div className="mb-8">
                            <Card title="Actions" icon="">
                                <div className="flex flex-row gap-3 overflow-x-auto pb-2">
                                    {!hasPlanification && !hasImpossibilite && (
                                        <ActionButton onClick={() => openModal('planification')} icon="" color="green" label="Planifier la VT" />
                                    )}
                                    {!hasImpossibilite && !hasPlanification && (
                                        <ActionButton onClick={() => openModal('impossibilite')} icon="" color="red" label="Signaler une impossibilité" />
                                    )}
                                    {hasPlanification && !hasCrvt && (
                                        <ActionButton onClick={() => openModal('livraison_crvt')} icon="" color="purple" label="Livrer CRVT" />
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Tabs modernes avec la couleur personnalisée */}
                        <div className="border-b border-slate-200 mb-8">
                            <nav className="-mb-px flex space-x-8">
                                {[
                                    { id: 'details', label: 'Informations', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                                    { id: 'actions', label: `Historique (${actionsStats.total})`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                                    { id: 'comments', label: 'Commentaires', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
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
                                        <Icon path={tab.icon} className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                        {tab.id === 'comments' && commentairesStats.non_lus > 0 && (
                                            <span className="bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1 animate-pulse">
                                                {commentairesStats.non_lus}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Contenu des onglets (pleine largeur) */}
                        <div className="space-y-6">
                            {activeTab === 'details' && (
                                <div className="space-y-6">
                                    <Card title="Informations générales" icon="">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InfoItem label="Contrat" value={visite.admin_contract} />
                                            <InfoItem label="Opérateur" value={visite.operator_name} />
                                            <InfoItem label="Technologie" value={visite.techno} />
                                            <InfoItem label="Date commande" value={formatDate(visite.order_date)} />
                                        </div>
                                    </Card>

                                    <Card title="Adresse site A" icon="">
                                        <div className="space-y-2">
                                            <InfoItem label="Nom" value={visite.address_site_a_name} />
                                            <InfoItem label="Rue" value={visite.address_site_a_street} />
                                            <InfoItem label="Code postal" value={visite.address_site_a_postal} />
                                            <InfoItem label="Ville" value={visite.address_site_a_town} />
                                        </div>
                                    </Card>

                                    <Card title="Contacts" icon="">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <h3 className="text-sm font-medium text-slate-500">Contact site</h3>
                                                <p className="font-medium mt-1 text-slate-800">{visite.contact_on_site_firstname} {visite.contact_on_site_lastname}</p>
                                                {visite.contact_on_site_phone && <p className="text-sm text-slate-600">{visite.contact_on_site_phone}</p>}
                                                {visite.contact_on_site_mail && <p className="text-sm text-slate-600 break-all">{visite.contact_on_site_mail}</p>}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-slate-500">Contact Covage</h3>
                                                <p className="font-medium mt-1 text-slate-800">{visite.covage_contact_name || '-'}</p>
                                            </div>
                                        </div>
                                    </Card>

                                    {(visite.client_directive_access || visite.client_directive_intervention || visite.client_directive_planning) && (
                                        <Card title="Directives client" icon="">
                                            <div className="space-y-4">
                                                {visite.client_directive_access && <Directive label="Accès" value={visite.client_directive_access} />}
                                                {visite.client_directive_intervention && <Directive label="Intervention" value={visite.client_directive_intervention} />}
                                                {visite.client_directive_planning && <Directive label="Planification" value={visite.client_directive_planning} />}
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {activeTab === 'actions' && (
                                <Card title={`Historique des actions (${actionsStats.total})`} icon="">
                                    {actions.length === 0 ? (
                                        <p className="text-slate-500 text-center py-12">Aucune action enregistrée</p>
                                    ) : (
                                        <ActionTimeline actions={actions} />
                                    )}
                                </Card>
                            )}

                            {activeTab === 'comments' && (
                                <Card title="Commentaires" icon="">
                                    <CommentSection
                                        commentaires={commentaires}
                                        commandeId={visite.id}
                                        commandeType="visite_technique"
                                        stats={commentairesStats}
                                    />
                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                        <h3 className="text-lg font-medium text-slate-800 mb-4">Ajouter un commentaire</h3>
                                        <SendCommentForm
                                            commande={visite}
                                            commandeType="visite_technique"
                                            onSuccess={() => router.reload()}
                                        />
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal - inchangée */}
                {modalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen p-4 text-center">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal} />
                            <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full mx-auto transform transition-all border border-white/40">
                                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                                    <h3 className="text-xl font-bold text-slate-800">
                                        {initialAction === 'planification' && 'Planifier la visite technique'}
                                        {initialAction === 'impossibilite' && 'Signaler une impossibilité'}
                                        {initialAction === 'livraison_crvt' && 'Livrer le CRVT'}
                                    </h3>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-500 transition-colors">
                                        <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <DepotActionVTComplet
                                        order={order}
                                        initialAction={initialAction}
                                        onSuccess={() => router.reload()}
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

// ================== COMPOSANTS INTERNES STYLISÉS ==================

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
        <dd className="mt-1 text-slate-800 font-medium">{value || '-'}</dd>
    </div>
);

// Version blanche pour la carte principale entièrement colorée
const InfoItemWhite = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-white/80">{label}</dt>
        <dd className="mt-1 text-white font-medium">{value || '-'}</dd>
    </div>
);

const Directive = ({ label, value }) => (
    <div>
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        <p className="mt-1 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{value}</p>
    </div>
);

const ActionButton = ({ onClick, icon, color, label }) => {
    const colors = {
        green: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/30',
        red: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/30',
        purple: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30',
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
