import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';

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

    // Statut basé uniquement sur replanned et la date de fin
   const getStatusBadge = (attente) => {
    if (attente.replanned) {
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">✅ Relancé</span>;
    }
    if (!attente.client_wait_end) {
        // Indéterminé → lien vers commentaires
        return (
            <div className="flex gap-2 items-center">
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">❓ Indéterminé</span>
                {attente.commande_link && (
                    <Link
                        href={attente.commande_link}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded"
                    >
                        Relancer
                    </Link>
                )}
            </div>
        );
    }
    const now = new Date();
    const endDate = new Date(attente.client_wait_end);
    if (endDate < now) {
        return (
            <div className="flex gap-2 items-center">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">⚠️ À relancer</span>
                {attente.commande_link && (
                    <Link
                        href={attente.commande_link}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded"
                    >
                        Relancer
                    </Link>
                )}
            </div>
        );
    }
    return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">⏳ En attente</span>;
};

    const items = attentes?.data ?? [];
    const links = attentes?.links ?? [];

    return (
        <Main>
            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Attentes client</h1>

                    {/* Cartes statistiques */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                            <div className="text-2xl font-bold text-gray-800">{stats.total ?? 0}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{stats.to_relaunch ?? 0}</div>
                            <div className="text-xs text-gray-500">À relancer</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.replanned ?? 0}</div>
                            <div className="text-xs text-gray-500">Relancées</div>
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Rechercher (RDS, BCA, projet, opérateur...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyUp={(e) => e.key === 'Enter' && applyFilters()}
                                className="px-3 py-2 border rounded-md"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="to_relaunch">À relancer</option>
                                <option value="replanned">Relancées</option>
                            </select>
                            <div className="flex gap-2">
                                <button onClick={applyFilters} className="bg-blue-600 text-white px-4 py-2 rounded-md">Filtrer</button>
                                <button onClick={resetFilters} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md">Réinitialiser</button>
                            </div>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RDS</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BCA</th>
                                        
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début attente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin attente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                Aucune période d'attente client trouvée
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((attente) => (
                                            <tr key={attente.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {attente.admin_rds}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {attente.admin_bca}
                                                </td>
                                                
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(attente.begin_client_wait)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(attente.client_wait_end)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(attente)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link href={route('attente-client.show', attente.id)} className="text-blue-600 hover:text-blue-900">
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
                            <div className="px-6 py-4 border-t">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Affichage de {attentes.from || 0} à {attentes.to || 0} sur {attentes.total || 0}
                                    </div>
                                    <div className="flex gap-1">
                                        {links.map((link, i) => (
                                            <Link
                                                key={i}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 rounded ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
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
