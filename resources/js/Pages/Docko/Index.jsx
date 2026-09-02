import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';

export default function Index({ responses, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [contractFilter, setContractFilter] = useState(filters.contract || '');

    const applyFilters = () => {
        router.get('/docko', { 
            search: searchTerm, 
            status: statusFilter, 
            contract: contractFilter 
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
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        if (status === 'accepte') {
            return (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✅ Accepté
                </span>
            );
        }
        return (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                ❌ Refusé
            </span>
        );
    };

    return (
        <Main>
            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* En-tête */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                
                                Retours Covage
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Suivi des réponses aux contrôles techniques
                            </p>
                        </div>
                        
                    </div>

                    {/* Statistiques - Version améliorée */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-5 text-center border border-gray-100 hover:shadow-md transition duration-200">
                            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                            <div className="text-sm text-gray-500 mt-1">Total</div>
                            <div className="w-full h-1 bg-gray-200 rounded-full mt-3">
                                <div className="w-full h-1 bg-gray-400 rounded-full"></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 text-center border border-gray-100 hover:shadow-md transition duration-200">
                            <div className="text-3xl font-bold text-emerald-600">{stats.acceptes}</div>
                            <div className="text-sm text-gray-500 mt-1">Acceptés</div>
                            <div className="w-full h-1 bg-gray-200 rounded-full mt-3">
                                <div className="w-full h-1 bg-emerald-400 rounded-full"></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 text-center border border-gray-100 hover:shadow-md transition duration-200">
                            <div className="text-3xl font-bold text-rose-600">{stats.refuses}</div>
                            <div className="text-sm text-gray-500 mt-1">Refusés</div>
                            <div className="w-full h-1 bg-gray-200 rounded-full mt-3">
                                <div className="w-full h-1 bg-rose-400 rounded-full"></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 text-center border border-gray-100 hover:shadow-md transition duration-200">
                            <div className="text-3xl font-bold text-amber-600">{stats.non_lus}</div>
                            <div className="text-sm text-gray-500 mt-1">Non lus</div>
                            <div className="w-full h-1 bg-gray-200 rounded-full mt-3">
                                <div className="w-full h-1 bg-amber-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Filtres - Version améliorée */}
                    <div className="bg-white rounded-xl shadow-sm p-5 mb-8 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder=" Rechercher (RDS, BCA, motif...)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyUp={(e) => e.key === 'Enter' && applyFilters()}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 bg-white"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="accepte"> Acceptés</option>
                                <option value="refuse"> Refusés</option>
                            </select>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={applyFilters} 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition duration-200 shadow-sm hover:shadow-md"
                                >
                                    Filtrer
                                </button>
                                <button 
                                    onClick={resetFilters} 
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-200"
                                >
                                     Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tableau - Version améliorée */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            RDS / BCA
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Contrat
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Préfixe
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Motif
                                        </th>
                                        
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {responses.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-6xl mb-4"></span>
                                                    <p className="text-gray-500 font-medium">Aucun retour DOCKO</p>
                                                    <p className="text-sm text-gray-400 mt-1">Les réponses apparaitront ici</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        responses.data.map((response) => (
                                            <tr key={response.id} className="hover:bg-gray-50 transition duration-150">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900">{response.rds}</span>
                                                        <span className="text-xs text-gray-500 font-mono">{response.bca}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md font-mono text-xs">
                                                        {response.admin_contract || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700 bg-indigo-50 px-2.5 py-1 rounded-md font-mono text-xs text-indigo-700 border border-indigo-100">
                                                        {response.admin_prefix || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(response.status)}
                                                        {!response.is_read && (
                                                            <span className="relative flex h-2.5 w-2.5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-gray-600 truncate">
                                                            {response.fail_reason || (
                                                                <span className="text-gray-400 italic">Aucun motif</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-4">
                                                    <Link 
                                                        href={route('docko.show', response.id)} 
                                                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm hover:underline transition duration-200"
                                                    >
                                                        Voir détails →
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - Version améliorée */}
                        {responses.links && responses.data.length > 0 && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-gray-600">
                                        Affichage de <span className="font-semibold">{responses.from || 0}</span> à{' '}
                                        <span className="font-semibold">{responses.to || 0}</span> sur{' '}
                                        <span className="font-semibold">{responses.total || 0}</span> résultats
                                    </div>
                                    <div className="flex gap-1 flex-wrap justify-center">
                                        {responses.links.map((link, i) => (
                                            link.url ? (
                                                <Link
                                                    key={i}
                                                    href={link.url}
                                                    className={`px-3.5 py-1.5 rounded-lg text-sm transition duration-200 ${
                                                        link.active 
                                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    key={i}
                                                    className="px-3.5 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )
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
