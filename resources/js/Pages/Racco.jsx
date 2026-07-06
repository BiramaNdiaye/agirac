import React, { useState, useEffect, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import NotificationBell from '@/Components/NotificationBell';
import Main from '@/Layouts/GuestLayout';

// Icônes SVG existantes
const IconTrendingUp = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const IconCalendar = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconFileText = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconClipboard = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const IconAlert = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconEye = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const IconSparkle = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>;
const IconClock = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconExternalLink = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

// Nouvelles icônes pour la recherche
const IconSearch = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconX = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

export default function Index({ auth, raccordements, counts, currentFilter, search: initialSearch = '' }) {
    const [animatedCounts, setAnimatedCounts] = useState(counts);
    const [search, setSearch] = useState(initialSearch);

    // Animation des compteurs
    useEffect(() => {
        const duration = 800;
        const steps = 20;
        const stepTime = duration / steps;
        const increments = {
            all: counts.all / steps,
            planned: counts.planned / steps,
            delivered_cr: counts.delivered_cr / steps,
            delivered_doe: counts.delivered_doe / steps,
            delivered_dft: counts.delivered_dft / steps,
            impossible: counts.impossible / steps
        };
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setAnimatedCounts({
                all: Math.min(Math.floor(increments.all * currentStep), counts.all),
                planned: Math.min(Math.floor(increments.planned * currentStep), counts.planned),
                delivered_cr: Math.min(Math.floor(increments.delivered_cr * currentStep), counts.delivered_cr),
                delivered_doe: Math.min(Math.floor(increments.delivered_doe * currentStep), counts.delivered_doe),
                delivered_dft: Math.min(Math.floor(increments.delivered_dft * currentStep), counts.delivered_dft),
                impossible: Math.min(Math.floor(increments.impossible * currentStep), counts.impossible)
            });
            if (currentStep >= steps) clearInterval(interval);
        }, stepTime);
        return () => clearInterval(interval);
    }, [counts]);

    // Debounce de la recherche
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get('/raccordements', 
                { filter: currentFilter, search },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [search, currentFilter]);

    // Fonction de priorité : 0 = En attente (le plus haut), puis ordre défini
    const getStatusPriority = (lastActionType) => {
        if (!lastActionType) return 0;
        switch (lastActionType) {
            case 'planification': return 1;
            case 'livraison_cr': return 2;
            case 'livraison_doe': return 3;
            case 'livraison_dft': return 4;
            case 'impossibilite': return 5;
            case 'modification_date': return 6;
            default: return 0;
        }
    };

    // Tri des raccordements
    const sortedRaccordements = useMemo(() => {
        return [...raccordements].sort((a, b) => {
            const priorityA = getStatusPriority(a.last_action_type);
            const priorityB = getStatusPriority(b.last_action_type);
            if (priorityA !== priorityB) return priorityA - priorityB;
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }, [raccordements]);

    const getStatusConfig = (lastActionType) => {
        const config = {
            'planification': {
                label: 'Planifié',
                color: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20',
                icon: <IconCalendar />
            },
            'livraison_cr': {
                label: 'CR livré',
                color: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20',
                icon: <IconFileText />
            },
            'livraison_doe': {
                label: 'DOE livré',
                color: 'bg-gradient-to-r from-emerald-700 to-green-700 text-white shadow-lg shadow-emerald-700/20',
                icon: <IconClipboard />
            },
            'livraison_dft': {
                label: 'DFT livré',
                color: 'bg-gradient-to-r from-emerald-800 to-green-800 text-white shadow-lg shadow-emerald-800/20',
                icon: <IconClipboard />
            },
            'impossibilite': {
                label: 'Impossible',
                color: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20',
                icon: <IconAlert />
            },
            'modification_date': {
                label: 'Planif Modifier',
                color: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-rose-500/20',
                icon: <IconAlert />
            },
        };
        if (config[lastActionType]) return config[lastActionType];
        return {
            label: 'En attente',
            color: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20',
            icon: <IconClock />
        };
    };

    const changeFilter = (filter) => {
        router.get('/raccordements', { filter, search }, { preserveState: true });
    };

    const clearSearch = () => setSearch('');

    const tabs = [
        { key: 'all', label: 'Tous', count: counts.all, icon: <IconTrendingUp />, color: 'from-slate-600 to-gray-700' },
        { key: 'planned', label: 'Planifiés', count: counts.planned, icon: <IconCalendar />, color: 'from-emerald-500 to-green-600' },
        { key: 'delivered_cr', label: 'CR livré', count: counts.delivered_cr, icon: <IconFileText />, color: 'from-emerald-600 to-teal-600' },
        { key: 'delivered_doe', label: 'DOE livré', count: counts.delivered_doe, icon: <IconClipboard />, color: 'from-emerald-700 to-green-700' },
        { key: 'delivered_dft', label: 'DFT livré', count: counts.delivered_dft, icon: <IconClipboard />, color: 'from-emerald-800 to-green-800' },
        { key: 'impossible', label: 'Impossibilités', count: counts.impossible, icon: <IconAlert />, color: 'from-rose-500 to-red-600' },
       
    ];

    return (
        <Main user={auth.user}>
            <div className="relative min-h-screen overflow-hidden">
                {/* Effets de fond */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 py-8">
                    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                        
                        {/* En-tête */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-12">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    
                                    <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-[#2A7B9B] to-[#1f5f7a] bg-clip-text text-transparent">
                                        Raccordements
                                    </h1>
                                </div>
                                
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative z-30 backdrop-blur-md bg-white/60 rounded-full p-2 shadow-xl border border-white/40 hover:bg-white/80 transition-all">
                                    <NotificationBell />
                                </div>
                            </div>
                        </div>

                        {/* Barre de recherche */}
                        <div className="mb-8 max-w-md mx-auto">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <IconSearch className="h-5 w-5 text-slate-400 group-focus-within:text-[#2A7B9B] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Rechercher par RDS, BCA ou contrat..."
                                    className="block w-full pl-10 pr-10 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2A7B9B] focus:border-transparent transition-all shadow-sm hover:shadow-md"
                                />
                                {search && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <IconX className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-center">
                                Recherche par numéro RDS, BCA ou contrat client
                            </p>
                        </div>

                        {/* Cartes statistiques */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
                            {tabs.map((tab) => (
                                <div key={tab.key} 
                                     className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105 hover:rotate-1"
                                     onClick={() => changeFilter(tab.key)}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/40 shadow-xl overflow-hidden">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tab.color} shadow-lg`}>
                                                {tab.icon}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm font-medium mb-1">{tab.label}</p>
                                        <p className="text-2xl font-black text-slate-800 tracking-tight">
                                            {animatedCounts[tab.key]}
                                        </p>
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Onglets */}
                        <div className="flex flex-wrap gap-4 mb-8 justify-center">
                        {tabs.map((tab) => (
                            <button
                            key={tab.key}
                            onClick={() => changeFilter(tab.key)}
                            className={`
                                relative px-6 py-3 rounded-2xl font-bold transition-all duration-300
                                backdrop-blur-sm
                                ${
                                currentFilter === tab.key
                                    ? 'text-white shadow-2xl scale-[1.02] ring-2 ring-white/30'
                                    : 'text-slate-700 shadow-md hover:shadow-xl hover:scale-[1.01]'
                                }
                            `}
                            >
                            {/* Fond avec dégradé (actif ou au survol) */}
                            <span
                                className={`
                                absolute inset-0 rounded-2xl bg-gradient-to-r ${tab.color}
                                transition-all duration-300
                                ${currentFilter === tab.key ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                `}
                            ></span>

                            {/* Effet de verre (glassmorphisme) pour la profondeur */}
                            <span
                                className={`
                                absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm
                                transition-all duration-300
                                ${currentFilter === tab.key ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
                                `}
                            ></span>

                            {/* Ombre interne pour l'aspect "carte" */}
                            <span
                                className={`
                                absolute inset-0 rounded-2xl shadow-inner
                                transition-opacity duration-300
                                ${currentFilter === tab.key ? 'opacity-30' : 'opacity-0 group-hover:opacity-20'}
                                `}
                            ></span>

                            {/* Contenu */}
                            <span className="relative flex items-center gap-2 z-10">
                                {tab.label}
                                <span
                                className={`
                                    text-xs font-mono px-2 py-0.5 rounded-full transition-all
                                    ${
                                    currentFilter === tab.key
                                        ? 'bg-white/30 text-white shadow-sm'
                                        : 'bg-white/50 text-slate-700 group-hover:bg-white/70'
                                    }
                                `}
                                >
                                {tab.count}
                                </span>
                            </span>
                            </button>
                        ))}
                        </div>

                        {/* Tableau */}
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <div className="inline-block min-w-full align-middle">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-gradient-to-r from-slate-50 to-white">
                                            <tr>
                                                {['RDS / BCA', 'REF Client', 'Projet / Ref ROP', 'One shot', 'Etat', 'Statut', 'Actions'].map((header, i) => (
                                                    <th key={i} className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sortedRaccordements.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="p-4 bg-slate-100 rounded-full backdrop-blur-sm animate-pulse">
                                                                <IconAlert className="w-12 h-12 text-slate-400" />
                                                            </div>
                                                            <p className="text-slate-500 text-lg font-medium">Aucun raccordement trouvé</p>
                                                            
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                sortedRaccordements.map((racco, idx) => {
                                                    const { label, color, icon } = getStatusConfig(racco.last_action_type);
                                                    const isPending = getStatusPriority(racco.last_action_type) === 0;
                                                    return (
                                                        <tr key={racco.id} 
                                                            className={`group hover:bg-slate-50/80 transition-all duration-300 ${isPending ? 'border-l-4 border-l-amber-400' : ''}`}
                                                            style={{ animationDelay: `${idx * 30}ms` }}>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-bold text-slate-800">{racco.admin_rds || '-'}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">{racco.admin_bca || '-'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                                {racco.admin_contract || '-'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-slate-700">{racco.project_name || '-'}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">{racco.rop_ref || '-'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap" >
                                                                <div className="text-sm text-slate-700 font-medium">
                                                                        {racco.one_shot_info === null || racco.one_shot_info === undefined ? (
                                                                            <span className="text-slate-400">-</span>
                                                                        ) : racco.one_shot_info ? (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                            ✅ Oui
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                            ❌ Non
                                                                            </span>
                                                                        )}
                                                                        </div>
                                                                
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                        {racco.is_annule ? (
                                                            <div>
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                    ❌ Annulé
                                                                </span>
                                                                {racco.annulation_date && (
                                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                                        le {racco.annulation_date}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-sm">-</span>
                                                        )}
                                                              </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${color}`}>
                                                                       
                                                                        {label}
                                                                    </span>
                                                                    {racco.actions_count > 1 && (
                                                                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                            {racco.actions_count}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <div className="flex items-center gap-3">
                                                                    <Link
                                                                        href={`/raccordements/${racco.id}`}
                                                                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-bold transition-all duration-300 hover:gap-3 group/btn"
                                                                    >
                                                                        <IconEye />
                                                                        <span>Détails</span>
                                                                        <IconExternalLink className="opacity-0 group-hover/btn:opacity-100 transition-all -ml-2 group-hover/btn:ml-0" />
                                                                    </Link>
                                                                    <Link 
                                                                        href={route('suivi.show', racco.admin_rds)} 
                                                                        className="text-indigo-600 hover:text-indigo-900 text-xs font-medium transition-all hover:underline"
                                                                    >
                                                                        Suivi
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-slate-600 text-sm">Total : <span className="font-bold text-slate-800">{sortedRaccordements.length}</span> raccordement(s) affiché(s)</span>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-300"></div>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-700"></div>
                                </div>
                            </div>
                        </div>

                       
                    </div>
                </div>
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
                @keyframes fadeSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                tbody tr {
                    animation: fadeSlideUp 0.3s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </Main>
    );
}
