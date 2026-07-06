import React from 'react';

export default function ActionTimelineRaccordement({ actions }) {
    // ✅ Fonction formatDecimal sécurisée
    const formatDecimal = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        return num.toFixed(3);
    };

    const getActionMeta = (type) => {
        const meta = {
            'planification': { icon: '📅', label: 'Planification du raccordement', color: 'bg-emerald-100 text-emerald-700', borderColor: 'emerald' },
            'impossibilite': { icon: '⚠️', label: 'Impossibilité de raccordement', color: 'bg-rose-100 text-rose-700', borderColor: 'rose' },
            'livraison_cr': { icon: '📋', label: 'Livraison CR Client', color: 'bg-blue-100 text-blue-700', borderColor: 'blue' },
            'livraison_doe': { icon: '📄', label: 'Livraison DOE', color: 'bg-indigo-100 text-indigo-700', borderColor: 'indigo' },
            'livraison_dft': { icon: '🔧', label: 'Livraison DFT', color: 'bg-amber-100 text-amber-700', borderColor: 'amber' },
            'livraison_dft': { icon: '📝', label: 'Modifier la Planification', color: 'bg-green-100 text-amber-700', borderColor: 'amber' },
        };
        return meta[type] || { icon: '📌', label: type, color: 'bg-gray-100 text-gray-700', borderColor: 'gray' };
    };

    const getResultStatusLabel = (status) => {
        const labels = {
            'OK': '✅ Réussi',
            'KO': '❌ Échoué',
            'PARTIAL': '⚠️ Partiel',
        };
        return labels[status] || status;
    };

    const getResultStatusBadge = (status) => {
        const badges = {
            'OK': 'bg-emerald-100 text-emerald-700 ring-emerald-500/20',
            'KO': 'bg-rose-100 text-rose-700 ring-rose-500/20',
            'PARTIAL': 'bg-amber-100 text-amber-700 ring-amber-500/20',
        };
        return badges[status] || 'bg-gray-100 text-gray-700 ring-gray-400/20';
    };

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-white/50 rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">Aucune action enregistrée</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {actions.map((action, index) => {
                    const { icon, label, color, borderColor } = getActionMeta(action.action_type);
                    const isLast = index === actions.length - 1;
                    return (
                        <li key={action.id} className="relative pb-8 group">
                            {!isLast && (
                                <div className="absolute left-5 top-5 -ml-px mt-0.5 h-full w-0.5 bg-gradient-to-b from-slate-200 to-slate-100 group-last:hidden" />
                            )}
                            <div className="relative flex items-start space-x-4">
                                {/* Cercle icône avec ombre et animation */}
                                <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-md ${color} transition-transform group-hover:scale-110 duration-200`}>
                                    <span className="text-lg">{icon}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/50 p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                            <h3 className="text-base font-bold text-slate-800">{label}</h3>
                                            
                                        </div>

                                        {/* Contenu dynamique selon le type d'action */}
                                        <div className="space-y-2 text-sm">
                                            {/* Planification */}
                                            {action.action_type === 'planification' && (
                                                <div className="space-y-1">
                                                    {action.planning_date && (
                                                        <div className="flex items-center gap-2 text-emerald-700">
                                                            <span>📅</span>
                                                            <span className="font-semibold">Planifiée le :</span>
                                                            <span>{action.planning_date}</span>
                                                        </div>
                                                    )}
                                                    {action.planning_comment && (
                                                        <p className="text-slate-600 pl-6">{action.planning_comment}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Impossibilité */}
                                            {action.action_type === 'impossibilite' && (
                                                <div className="space-y-1">
                                                    {action.impossibility_fail_reason && (
                                                        <div className="flex items-center gap-2 text-rose-700">
                                                            <span>⚠️</span>
                                                            <span className="font-semibold">{action.impossibility_fail_reason}</span>
                                                        </div>
                                                    )}
                                                    {action.impossibility_comment && (
                                                        <p className="text-slate-600 pl-6">{action.impossibility_comment}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Livraison CR Client */}
                                            {action.action_type === 'livraison_cr' && (
                                                <div className="space-y-2">
                                                    {action.cr_result_status && (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getResultStatusBadge(action.cr_result_status)}`}>
                                                                {getResultStatusLabel(action.cr_result_status)}
                                                            </span>
                                                            {action.cr_infra_to_be_created && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-500/20">
                                                                    🏗️ Infrastructure à créer
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {action.cr_effective_date && (
                                                        <p className="flex items-center gap-2 text-slate-700">
                                                            <span>📅</span> Date effective : {action.cr_effective_date}
                                                        </p>
                                                    )}
                                                    {action.cr_comment && (
                                                        <p className="rounded-lg bg-slate-50 p-2 text-slate-600">{action.cr_comment}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Livraison DOE */}
                                            {action.action_type === 'livraison_doe' && (
                                                <div className="space-y-2">
                                                    {action.doe_delivery_date && (
                                                        <p className="flex items-center gap-2 text-indigo-700">
                                                            <span>📅</span> Livré le : {action.doe_delivery_date}
                                                        </p>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                                                        {action.doe_gc_length && (
                                                            <div className="flex items-center gap-1">
                                                                <span>📏</span> GC : {formatDecimal(action.doe_gc_length)} m
                                                            </div>
                                                        )}
                                                        {action.doe_ml_length_extension && (
                                                            <div className="flex items-center gap-1">
                                                                <span>📏</span> Extension : {formatDecimal(action.doe_ml_length_extension)} m
                                                            </div>
                                                        )}
                                                        {action.doe_ml_length_private && (
                                                            <div className="flex items-center gap-1">
                                                                <span>📏</span> Domaine privé : {formatDecimal(action.doe_ml_length_private)} m
                                                            </div>
                                                        )}
                                                        {action.doe_ml_length_public && (
                                                            <div className="flex items-center gap-1">
                                                                <span>📏</span> Domaine public : {formatDecimal(action.doe_ml_length_public)} m
                                                            </div>
                                                        )}
                                                    </div>
                                                    {action.doe_comment && (
                                                        <p className="text-slate-600">{action.doe_comment}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Livraison DFT */}
                                            {action.action_type === 'livraison_dft' && (
                                                <div className="space-y-1">
                                                    {action.dft_delivery_date && (
                                                        <p className="flex items-center gap-2 text-amber-700">
                                                            <span>📅</span> Livré le : {action.dft_delivery_date}
                                                        </p>
                                                    )}
                                                    {action.dft_comment && (
                                                        <p className="text-slate-600">{action.dft_comment}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Modification date planife */}
                                            {action.action_type === 'modification_date' && (
                                            <div className="space-y-1">
                                                <p className="text-amber-600 font-medium">
                                                    ✏️ Date modifiée : {action.planning_date}
                                                </p>
                                                {action.planning_comment && (
                                                    <p className="text-gray-600 text-sm">{action.planning_comment}</p>
                                                )}
                                            </div>
                                        )}
                                        </div>

                                        {/* Source du fichier */}
                                        <div className="mt-4 flex items-center gap-1 text-xs text-slate-400 border-t border-slate-100 pt-3">
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span>Fichier : {action.source_file || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
