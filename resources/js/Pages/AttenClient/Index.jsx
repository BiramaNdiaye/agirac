import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import {
    Search,
    X,
    ListFilter,
    Users,
    PlayCircle,
    CalendarClock,
    CheckCircle2,
    RefreshCw,
    Eye,
    Inbox,
} from 'lucide-react';

// Palette figée par statut : évite les classes Tailwind générées dynamiquement
// (bg-${color}-100 n'est jamais détecté par le JIT scanner)
const STATUS_STYLES = {
    green: { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    yellow: { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
    red: { badge: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
    blue: { badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
};

export default function Index({ attentes, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const applyFilters = () => {
        router.get('/attente-client', { search: searchTerm, status: statusFilter }, { preserveState: true });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        router.get('/attente-client', {}, { preserveState: true });
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    // Statut temporel (uniquement si client_wait_end existe)
    const getTemporalStatus = (begin, end) => {
        if (!end) return null; // pas de statut temporel si pas de date de fin
        const now = new Date();
        const start = new Date(begin);
        const endDate = new Date(end);
        if (start <= now && endDate >= now) return { label: 'En cours', color: 'green' };
        if (endDate < now) return { label: 'Terminé', color: 'red' };
        return { label: 'À venir', color: 'yellow' };
    };

    const StatusBadge = ({ color, children }) => {
        const styles = STATUS_STYLES[color] ?? STATUS_STYLES.blue;
        return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                {children}
            </span>
        );
    };

    const getCombinedBadge = (attente) => {
        // Si client_wait_end est null → considéré comme relancée
        if (!attente.client_wait_end) {
            return (
                <StatusBadge color="blue">
                    <RefreshCw className="h-3 w-3" strokeWidth={2} />
                    Relancée
                </StatusBadge>
            );
        }
        const temporal = getTemporalStatus(attente.begin_client_wait, attente.client_wait_end);
        if (attente.replanned) {
            return (
                <div className="flex flex-col items-start gap-1">
                    <StatusBadge color={temporal.color}>{temporal.label}</StatusBadge>
                    <StatusBadge color="blue">
                        <RefreshCw className="h-3 w-3" strokeWidth={2} />
                        Relancée
                    </StatusBadge>
                </div>
            );
        }
        return <StatusBadge color={temporal.color}>{temporal.label}</StatusBadge>;
    };

    const items = attentes?.data ?? [];
    const links = attentes?.links ?? [];

    const statCards = [
        { label: 'Total', value: stats.total ?? 0, Icon: Users, tint: 'text-slate-700 bg-slate-100' },
        { label: 'En cours', value: stats.active ?? 0, Icon: PlayCircle, tint: 'text-emerald-700 bg-emerald-50' },
        { label: 'À venir', value: stats.future ?? 0, Icon: CalendarClock, tint: 'text-amber-700 bg-amber-50' },
        { label: 'Terminées', value: stats.expired ?? 0, Icon: CheckCircle2, tint: 'text-rose-700 bg-rose-50' },
        { label: 'Relancées', value: stats.replanned ?? 0, Icon: RefreshCw, tint: 'text-sky-700 bg-sky-50' },
    ];

    return (
        <Main>
            <div className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-slate-900">Attentes client</h1>
                    </div>

                    {/* Cartes statistiques */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {statCards.map(({ label, value, Icon, tint }) => (
                            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
                                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                                </div>
                                <div className="text-2xl font-semibold text-slate-900">{value}</div>
                                <div className="text-xs text-slate-500">{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filtres */}
                    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher (RDS, BCA, projet, opérateur...)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyUp={(e) => e.key === 'Enter' && applyFilters()}
                                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#1c5670] focus:outline-none focus:ring-1 focus:ring-[#1c5670]"
                                />
                            </div>
                            <div className="relative">
                                <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#1c5670] focus:outline-none focus:ring-1 focus:ring-[#1c5670]"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="active">En cours</option>
                                    <option value="future">À venir</option>
                                    <option value="expired">Terminées</option>
                                    <option value="replanned">Relancées</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={applyFilters}
                                    className="rounded-lg bg-[#1c5670] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#164459]"
                                >
                                    Filtrer
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
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
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">RDS</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">BCA</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Début attente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Fin attente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Statut</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Inbox className="h-8 w-8" strokeWidth={1.5} />
                                                    <span className="text-sm">Aucune période d'attente client trouvée</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((attente) => (
                                            <tr key={attente.id} className="transition-colors hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                                    {attente.admin_rds}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {attente.admin_bca}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {formatDate(attente.begin_client_wait)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {formatDate(attente.client_wait_end)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {getCombinedBadge(attente)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                    <Link
                                                        href={route('attente-client.show', attente.id)}
                                                        className="inline-flex items-center gap-1.5 text-[#1c5670] hover:text-[#164459]"
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
                        {links.length > 0 && (
                            <div className="border-t border-slate-200 px-6 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-sm text-slate-500">
                                        Affichage de {attentes.from || 0} à {attentes.to || 0} sur {attentes.total || 0}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {links.map((link, i) => (
                                            <Link
                                                key={i}
                                                href={link.url || '#'}
                                                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                                    link.active
                                                        ? 'bg-[#1c5670] text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
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
