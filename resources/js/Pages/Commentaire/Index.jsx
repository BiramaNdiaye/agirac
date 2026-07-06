import React, { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import NotificationBell from '@/Components/NotificationBell';

export default function Index({ discussions, stats, filters }) {
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [animatedStats, setAnimatedStats] = useState({
        total: 0, lus: 0, non_lus: 0, vt: 0, raccordement: 0,
    });

    useEffect(() => {
        const duration = 800;
        const steps = 20;
        const stepTime = duration / steps;
        const increments = {
            total: stats.total / steps,
            lus: stats.lus / steps,
            non_lus: stats.non_lus / steps,
            vt: stats.vt / steps,
            raccordement: stats.raccordement / steps,
        };
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setAnimatedStats({
                total: Math.min(Math.floor(increments.total * currentStep), stats.total),
                lus: Math.min(Math.floor(increments.lus * currentStep), stats.lus),
                non_lus: Math.min(Math.floor(increments.non_lus * currentStep), stats.non_lus),
                vt: Math.min(Math.floor(increments.vt * currentStep), stats.vt),
                raccordement: Math.min(Math.floor(increments.raccordement * currentStep), stats.raccordement),
            });
            if (currentStep >= steps) clearInterval(interval);
        }, stepTime);
        return () => clearInterval(interval);
    }, [stats]);

    const applyFilters = () => {
        router.get('/commentaires', { type: typeFilter, status: statusFilter, search: searchTerm }, { preserveState: true });
    };

    const resetFilters = () => {
        setTypeFilter('');
        setStatusFilter('');
        setSearchTerm('');
        router.get('/commentaires', {}, { preserveState: true });
    };

    const formatDateRelative = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffH = Math.floor(diffMs / 3600000);
        const diffD = Math.floor(diffMs / 86400000);
        if (diffMin < 1) return "À l'instant";
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        if (diffH < 24) return `Il y a ${diffH}h`;
        if (diffD === 1) return 'Hier';
        if (diffD < 7) return `Il y a ${diffD} jours`;
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const getTypeLabel = (type) =>
        type === 'visite_technique' ? 'Visite technique' : 'Raccordement';

    const getTypeStyle = (type) =>
        type === 'visite_technique'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-purple-50 text-purple-700 border border-purple-200';

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Dernier message d'une discussion (le plus récent)
    const lastMessage = (discussion) =>
        [...discussion.messages].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];

    const statItems = [
        { key: 'total',        label: 'Total',         bar: 'bg-gray-400' },
        { key: 'lus',          label: 'Lus',           bar: 'bg-green-500' },
        { key: 'non_lus',      label: 'Non lus',       bar: 'bg-amber-500' },
        { key: 'vt',           label: 'VT',            bar: 'bg-blue-500' },
        { key: 'raccordement', label: 'Raccordements', bar: 'bg-purple-500' },
    ];

    return (
        <Main>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">

                    {/* En-tête */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Commentaires</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {discussions.length} discussion{discussions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <button
                                onClick={() => router.post(route('commentaires.mark-all-read'))}
                                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Tout marquer comme lu
                            </button>
                        </div>
                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {statItems.map((s) => (
                            <div key={s.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
                                <span className="text-2xl font-bold text-gray-900">{animatedStats[s.key]}</span>
                                <span className="text-xs text-gray-500">{s.label}</span>
                                <div className="h-0.5 rounded-full bg-gray-100 mt-1">
                                    <div
                                        className={`h-0.5 rounded-full ${s.bar} transition-all duration-700`}
                                        style={{ width: stats.total > 0 ? `${(stats[s.key] / stats.total) * 100}%` : '0%' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filtres */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Recherche</label>
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="RDS, BCA, contenu..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyUp={(e) => e.key === 'Enter' && applyFilters()}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-700"
                                >
                                    <option value="">Tous les types</option>
                                    <option value="visite_technique">Visites techniques</option>
                                    <option value="raccordement">Raccordements</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Statut</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-700"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="lu">Lus</option>
                                    <option value="non_lu">Non lus</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={applyFilters}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm"
                                >
                                    Filtrer
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Liste des discussions */}
                    <div className="flex flex-col gap-3">
                        {discussions.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-medium">Aucune discussion trouvée</p>
                                    <p className="text-gray-400 text-sm">Essayez de modifier vos filtres</p>
                                </div>
                            </div>
                        ) : (
                            discussions.map((discussion) => {
                                const last = lastMessage(discussion);
                                const firstMsg = discussion.messages[0];
                                // Aperçu des avatars des participants
                                const participants = [...new Map(
                                    discussion.messages.map((m) => [m.auteur, m])
                                ).values()].slice(0, 3);

                                return (
                                    <Link
                                        key={`${discussion.rds}-${discussion.bca}`}
                                        href={route('commentaires.show', firstMsg.id)}
                                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 p-5 flex gap-4 items-start"
                                    >
                                        {/* Avatars participants */}
                                        <div className="flex-shrink-0 flex -space-x-2 mt-0.5">
                                            {participants.map((p, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white ${
                                                        p.auteur === 'Application'
                                                            ? 'bg-gray-100 text-gray-600'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}
                                                >
                                                    {getInitials(p.auteur)}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Contenu principal */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-gray-900 text-sm">
                                                        {discussion.rds}
                                                    </span>
                                                    <span className="text-gray-300 text-xs">·</span>
                                                    <span className="font-medium text-gray-600 text-sm">
                                                        {discussion.bca}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeStyle(firstMsg.commande_type)}`}>
                                                        {getTypeLabel(firstMsg.commande_type)}
                                                    </span>
                                                    {discussion.non_lus > 0 && (
                                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                                                            {discussion.non_lus}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                    {formatDateRelative(discussion.dernier_at)}
                                                </span>
                                            </div>

                                            {/* Dernier message */}
                                            <p className="text-sm text-gray-500 truncate leading-relaxed">
                                                <span className="text-gray-700 font-medium">{last?.auteur} : </span>
                                                {last?.contenu}
                                            </p>

                                            {/* Pied : nb messages */}
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    {discussion.messages.length} message{discussion.messages.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Flèche */}
                                        <div className="flex-shrink-0 self-center">
                                            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>

                </div>
            </div>
        </Main>
    );
}
