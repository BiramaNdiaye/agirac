import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
  DocumentTextIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  SearchIcon,
  ClockIcon,
  FolderIcon,
  TableIcon,
  XIcon,
  EyeIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';

export default function GroupedDataView({ groupedData, stats, error, timestamp }) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrefix, setSelectedPrefix] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  // Préfixes disponibles
  const availablePrefixes = useMemo(() => {
    const prefixes = new Set();
    groupedData.forEach(group => {
      group.prefixes?.forEach(prefix => prefixes.add(prefix));
    });
    return ['all', ...Array.from(prefixes).sort()];
  }, [groupedData]);

  // Filtrer les groupes
  const filteredGroups = useMemo(() => {
    return groupedData.filter(group => {
      const matchesSearch = !searchTerm || 
        group.rds?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.ref_bca?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPrefix = selectedPrefix === 'all' || 
        group.prefixes?.includes(selectedPrefix);
      
      return matchesSearch && matchesPrefix;
    });
  }, [groupedData, searchTerm, selectedPrefix]);

  const toggleGroup = (index) => {
    setExpandedGroups(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    filteredGroups.forEach((_, index) => {
      allExpanded[index] = true;
    });
    setExpandedGroups(allExpanded);
    toast.success('Tous les groupes sont développés');
  };

  const collapseAll = () => {
    setExpandedGroups({});
    toast.success('Tous les groupes sont repliés');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedPrefix('all');
    toast.success('Filtres réinitialisés');
  };

  const viewGroupDetails = (rds, refBca) => {
    router.visit(`/grouped-data/${rds}/${refBca}`);
  };

  // Composant pour afficher un badge de préfixe
  const PrefixBadge = ({ prefix }) => {
    const colors = {
      'OTPLANIFVTDATE': 'bg-blue-100 text-blue-700',
      'COMMENT': 'bg-green-100 text-green-700',
      'PLANIFVTDATE': 'bg-purple-100 text-purple-700',
      'CRVTCLIKO': 'bg-orange-100 text-orange-700',
      'OTPLANIFRACCODATE': 'bg-cyan-100 text-cyan-700',
      'ATTENTECLIENT': 'bg-yellow-100 text-yellow-700',
      'default': 'bg-gray-100 text-gray-700'
    };
    
    const colorClass = colors[prefix] || colors.default;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {prefix}
      </span>
    );
  };

  // Composant pour afficher le tableau des données
  const DataTable = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Aucune donnée disponible
        </div>
      );
    }
    
    const allColumns = [...new Set(data.flatMap(row => Object.keys(row)))];
    const displayColumns = allColumns.filter(col => !['source_file', 'file_name'].includes(col)).slice(0, 8);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                Source
              </th>
              {displayColumns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.slice(0, 20).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm sticky left-0 bg-white">
                  <div className="flex items-center gap-2">
                    <PrefixBadge prefix={row.source_file} />
                    <span className="text-xs text-gray-400 truncate max-w-[150px]">
                      {row.file_name?.substring(0, 30)}
                    </span>
                  </div>
                </td>
                {displayColumns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 text-sm text-gray-700">
                    {row[col] || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => viewGroupDetails(row.admin_rds, row.admin_bca)}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 20 && (
          <div className="text-center py-4 text-sm text-gray-500">
            + {data.length - 20} autres lignes
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <AuthenticatedLayout>
        <Head title="Données Groupées" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur de chargement</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Réessayer
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head title="Données Groupées" />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Données Groupées
                  </span>
                </h1>
                <p className="text-gray-600">
                  {stats?.total_groups || 0} groupes • {stats?.total_records || 0} enregistrements • {stats?.total_files || 0} fichiers
                </p>
                {timestamp && (
                  <p className="text-xs text-gray-400 mt-1">
                    Dernière mise à jour: {new Date(timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition ${
                      viewMode === 'table' 
                        ? 'bg-emerald-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <TableIcon className="w-4 h-4" />
                    Tableau
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition ${
                      viewMode === 'cards' 
                        ? 'bg-emerald-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FolderIcon className="w-4 h-4" />
                    Cartes
                  </button>
                </div>
                
                <button
                  onClick={expandAll}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Tout développer
                </button>
                <button
                  onClick={collapseAll}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Tout replier
                </button>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par RDS ou REF BCA..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="w-48">
                <select
                  value={selectedPrefix}
                  onChange={(e) => setSelectedPrefix(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {availablePrefixes.map(prefix => (
                    <option key={prefix} value={prefix}>
                      {prefix === 'all' ? 'Tous les préfixes' : prefix}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <XIcon className="w-5 h-5" />
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Liste des groupes */}
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun groupe trouvé</p>
              <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  {/* En-tête du groupe */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleGroup(groupIndex)}
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-gray-500">
                        {expandedGroups[groupIndex] ? (
                          <ChevronDownIcon className="w-5 h-5" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5" />
                        )}
                      </button>
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-2 rounded-lg">
                        <FolderIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          RDS: <span className="text-emerald-600">{group.rds || 'Non défini'}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          REF BCA: {group.ref_bca || 'Non défini'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>{group.files?.length || 0} fichier(s)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{group.data?.length || 0} ligne(s)</span>
                      </div>
                      <div className="flex gap-1">
                        {group.prefixes?.slice(0, 3).map((prefix, idx) => (
                          <PrefixBadge key={idx} prefix={prefix} />
                        ))}
                        {(group.prefixes?.length || 0) > 3 && (
                          <span className="text-xs text-gray-400">
                            +{group.prefixes.length - 3}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewGroupDetails(group.rds, group.ref_bca);
                        }}
                        className="text-emerald-600 hover:text-emerald-800 p-1"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Contenu du groupe */}
                  {expandedGroups[groupIndex] && (
                    <div className="border-t border-gray-100">
                      {/* Liste des fichiers */}
                      <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Fichiers associés :</h4>
                        <div className="flex flex-wrap gap-2">
                          {group.files?.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm"
                            >
                              <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 truncate max-w-[200px]">
                                {file.file_name}
                              </span>
                              <PrefixBadge prefix={file.prefix} />
                              <span className="text-xs text-gray-400">{file.row_count} lignes</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Données */}
                      <div className="p-4">
                        {viewMode === 'table' ? (
                          <DataTable data={group.data} />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.data?.slice(0, 12).map((row, idx) => {
                              const importantFields = ['admin_bca', 'admin_rds', 'order_date', 'planning_date', 'result_status'];
                              const displayFields = Object.entries(row).filter(([key]) => !['source_file', 'file_name'].includes(key));
                              
                              return (
                                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                                  <div className="flex items-center justify-between mb-3">
                                    <PrefixBadge prefix={row.source_file} />
                                    <span className="text-xs text-gray-400 truncate max-w-[150px]">
                                      {row.file_name?.substring(0, 20)}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {displayFields.slice(0, 5).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm">
                                        <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                                        <span className="font-medium text-gray-800">{value || '-'}</span>
                                      </div>
                                    ))}
                                    {displayFields.length > 5 && (
                                      <div className="text-xs text-gray-400 text-center pt-2">
                                        +{displayFields.length - 5} autres champs
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {(group.data?.length || 0) > 12 && (
                              <div className="col-span-full text-center py-4 text-sm text-gray-500">
                                + {(group.data?.length || 0) - 12} autres lignes
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
