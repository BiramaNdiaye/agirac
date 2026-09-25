import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import {
    Search,
    ListFilter,
    X,
    CheckCircle2,
    XCircle,
    Eye,
    Inbox,
    FileText,
    ClipboardCheck,
    Cable,
} from 'lucide-react';

export default function Index({ responses, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [contractFilter, setContractFilter] = useState(filters.contract || '');

    const applyFilters = () => {
        router.get('/docko', {
            search: searchTerm,
            status: statusFilter,
            contract: contractFilter,
        }, { preserveState: true });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setContractFilter('');
        router.get('/docko', {}, { preserveState: true });
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        if (status === 'accepte') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Accepté
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
                Refusé
            </span>
        );
    };

    const getCommandeTypeBadge = (commandeType) => {
        if (commandeType === 'vt') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                    <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={2} />
                    VT
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                <Cable className="h-3.5 w-3.5" strokeWidth={2} />
                Racco
            </span>
        );
    };

    const statCards = [
        { label: 'Total', value: stats.total, tint: 'text-slate-700 bg-slate-100', bar: 'bg-slate-400' },
        { label: 'Acceptés', value: stats.acceptes, tint: 'text-emerald-700 bg-emerald-50', bar: 'bg-emerald-400' },
        { label: 'Refusés', value: stats.refuses, tint: 'text-rose-700 bg-rose-50', bar: 'bg-rose-400' },
        { label: 'Non lus', value: stats.non_lus, tint: 'text-amber-700 bg-amber-50', bar: 'bg-amber-400' },
    ];

    return (
        <Main>
            <div className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    {/* En-tête */}
                    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="flex items-center gap-2.5 text-2xl font-semibold text-slate-900">
                                <FileText className="h-6 w-6 text-[#1c5670]" strokeWidth={2} />
                                Retours Covage
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Suivi des réponses aux contrôles techniques
                            </p>
                        </div>
                    </div>

                    {/* Statistiques */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {statCards.map(({ label, value, tint, bar }) => (
                            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className={`mb-3 inline-flex rounded-lg px-2 py-1 text-2xl font-semibold ${tint}`}>
                                    {value}
                                </div>
                                <div className="text-xs text-slate-500">{label}</div>
                                <div className="mt-3 h-1 rounded-full bg-slate-100">
                                    <div className={`h-1 rounded-full ${bar}`} style={{ width: '100%' }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filtres */}
                    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher (RDS, BCA, motif...)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyUp={(e) => e.key === 'Enter' && applyFilters()}
                                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-[#1c5670] focus:outline-none focus:ring-1 focus:ring-[#1c5670]"
                                />
                            </div>
                            <div className="relative">
                                <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-[#1c5670] focus:outline-none focus:ring-1 focus:ring-[#1c5670]"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="accepte">Acceptés</option>
                                    <option value="refuse">Refusés</option>
                                </select>
                            </div>
                            <div className="hidden md:block" />
                            <div className="flex gap-2">
                                <button
                                    onClick={applyFilters}
                                    className="flex-1 rounded-lg bg-[#1c5670] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#164459]"
                                >
                                    Filtrer
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    <X className="h-4 w-4" strokeWidth={2} />
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">RDS / BCA</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Contrat</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Préfixe</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Statut</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Motif</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {responses.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-16">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Inbox className="h-8 w-8" strokeWidth={1.5} />
                                                    <p className="text-sm font-medium text-slate-500">Aucun retour DOCKO</p>
                                                    <p className="text-xs text-slate-400">Les réponses apparaitront ici</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        responses.data.map((response) => (
                                            <tr key={response.id} className="transition-colors hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900">{response.rds}</span>
                                                        <span className="font-mono text-xs text-slate-500">{response.bca}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getCommandeTypeBadge(response.commande_type)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
                                                        {response.admin_contract || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-md border border-[#1c5670]/15 bg-[#1c5670]/5 px-2.5 py-1 font-mono text-xs text-[#1c5670]">
                                                        {response.admin_prefix || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(response.status)}
                                                        {!response.is_read && (
                                                            <span className="relative flex h-2.5 w-2.5">
                                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <p className="truncate text-sm text-slate-600">
                                                            {response.fail_reason || (
                                                                <span className="italic text-slate-400">Aucun motif</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link
                                                        href={route('docko.show', response.id)}
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1c5670] hover:text-[#164459]"
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={2} />
                                                        Voir détails
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {responses.links && responses.data.length > 0 && (
                            <div className="border-t border-slate-200 px-6 py-4">
                                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                    <div className="text-sm text-slate-500">
                                        Affichage de <span className="font-medium text-slate-700">{responses.from || 0}</span> à{' '}
                                        <span className="font-medium text-slate-700">{responses.to || 0}</span> sur{' '}
                                        <span className="font-medium text-slate-700">{responses.total || 0}</span> résultats
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-1">
                                        {responses.links.map((link, i) =>
                                            link.url ? (
                                                <Link
                                                    key={i}
                                                    href={link.url}
                                                    className={`rounded-lg px-3.5 py-1.5 text-sm transition-colors ${
                                                        link.active
                                                            ? 'bg-[#1c5670] text-white'
                                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    key={i}
                                                    className="cursor-not-allowed rounded-lg bg-slate-100 px-3.5 py-1.5 text-sm text-slate-400"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Main>
    );
}
