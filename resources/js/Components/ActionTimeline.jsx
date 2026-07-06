import React from 'react';

const ActionTimeline = ({ actions }) => {
    const getStatusBadge = (resultStatus) => {
        const badges = {
            'Blocage privé': 'bg-rose-100 text-rose-700 ring-rose-500/20',
            'Blocage public': 'bg-rose-100 text-rose-700 ring-rose-500/20',
            'Blocage privé et public': 'bg-amber-100 text-amber-700 ring-amber-500/20',
            'Pas de blocage': 'bg-emerald-100 text-emerald-700 ring-emerald-500/20',
        };
        return badges[resultStatus] || 'bg-slate-100 text-slate-700 ring-slate-400/20';
    };

    const getStatusLabel = (resultStatus) => {
        const labels = {
            'Blocage privé': '❌ Échoué',
            'Blocage public': '❌ Échoué',
            'Blocage privé et public': '❌ Échoué',
            'Pas de blocage': '✅ Réussi',
        };
        return labels[resultStatus] || resultStatus;
    };

    // Map action type to icon and color (for the timeline circle)
    const getActionMeta = (action) => {
        const types = {
            demande: { icon: '📝', color: 'bg-slate-100 text-slate-600' },
            planification: { icon: '📅', color: 'bg-emerald-100 text-emerald-600' },
            impossibilite: { icon: '⚠️', color: 'bg-rose-100 text-rose-600' },
            crvt_recu: { icon: '📋', color: 'bg-cyan-100 text-cyan-600' },
            livraison_crvt: { icon: '✅', color: 'bg-indigo-100 text-indigo-600' },
            modification_date: { icon: '📝', color: 'bg-green-100 text-indigo-600' },
            
        };
        return types[action.action_type] || { icon: '📌', color: 'bg-gray-100 text-gray-600' };
    };

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {actions.map((action, index) => {
                    const { icon, color } = getActionMeta(action);
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
                                            <h3 className="text-base font-bold text-slate-800">{action.label}</h3>
                                            {action.action_type === 'livraison_crvt' && action.crvt_result_status && (
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusBadge(action.crvt_result_status)}`}>
                                                    {getStatusLabel(action.crvt_result_status)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Contenu dynamique selon le type d'action */}
                                        <div className="space-y-2 text-sm">
                                            {/* Demande VT */}
                                            {action.action_type === 'demande' && action.demande_comment && (
                                                <div className="rounded-xl bg-slate-50 p-3 italic text-slate-600 border-l-4 border-slate-300">
                                                    "{action.demande_comment}"
                                                </div>
                                            )}

                                            {/* Planification VT */}
                                            {action.action_type === 'planification' && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-emerald-700">
                                                        <span className="text-base">📅</span>
                                                        <span className="font-semibold">Planifiée le :</span>
                                                        <span>{action.planning_date}</span>
                                                    </div>
                                                    {action.planning_comment && (
                                                        <p className="text-slate-600 pl-6">{action.planning_comment}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Impossibilité VT */}
                                            {action.action_type === 'impossibilite' && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-rose-700">
                                                        <span className="text-base">⚠️</span>
                                                        <span className="font-semibold">Impossibilité</span>
                                                    </div>
                                                    {action.impossibility_fail_reason && (
                                                        <p className="text-rose-600 pl-6">Raison : {action.impossibility_fail_reason}</p>
                                                    )}
                                                    {action.impossibility_comment && (
                                                        <p className="text-slate-600 pl-6">{action.impossibility_comment}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* CRVT reçu de Covage */}
                                            {action.action_type === 'crvt_recu' && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-cyan-700">
                                                        <span className="text-base">📋</span>
                                                        <span className="font-semibold">Réponse de Covage sur le CRVT</span>
                                                    </div>
                                                  
                                                    {action.crvt_recu_fail_reason && (
                                                        <p className="pl-6 text-rose-600">Raison : {action.crvt_recu_fail_reason}</p>
                                                    )}
                                                   
                                                </div>
                                            )}

                                            {/* Livraison CRVT (notre réponse) */}
                                            {action.action_type === 'livraison_crvt' && (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        {action.crvt_infra_to_be_created && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-500/20">
                                                                🏗️ Infrastructure à créer
                                                            </span>
                                                        )}
                                                    </div>
                                                    {action.crvt_effective_date && (
                                                        <p className="flex items-center gap-2 text-slate-700">
                                                            <span>📅</span> Date effective : {action.crvt_effective_date}
                                                        </p>
                                                    )}
                                                    {action.crvt_submission_date && (
                                                        <p className="flex items-center gap-2 text-slate-700">
                                                            <span>📤</span> Date de soumission : {action.crvt_submission_date}
                                                        </p>
                                                    )}
                                                    {action.crvt_comment && (
                                                        <p className="rounded-lg bg-slate-50 p-2 text-slate-600">{action.crvt_comment}</p>
                                                    )}
                                                    {action.crvt_doc && (
                                                        <div className="mt-2 rounded-lg bg-indigo-50 p-2 text-indigo-700">
                                                            <p className="text-sm font-medium">📎 Documents :</p>
                                                            <p className="text-sm break-all">
                                                                {Array.isArray(action.crvt_doc) ? action.crvt_doc.join(', ') : action.crvt_doc}
                                                            </p>
                                                            {action.result_status && (
                                                                <p className="mt-1 text-sm text-rose-600">Motif échec : {action.result_status}</p>
                                                            )}
                                                        </div>
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
                                            <span>Fichier : {action.source_file}</span>
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
};

export default ActionTimeline;
