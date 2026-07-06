// resources/js/Pages/MergedComments.jsx
import React, { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';

const MergedComments = () => {
  const { mergedData, file1, file2, bcaKey, rdsKey, title, description } = usePage().props;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filteredData, setFilteredData] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    filterMergedData();
  }, [searchTerm, filterStatus, mergedData]);

  const filterMergedData = () => {
    if (!mergedData?.merged_data) return;

    const filtered = {};
    Object.entries(mergedData.merged_data).forEach(([key, item]) => {
      let matches = true;

      // Filtre par recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const bcaMatch = item.bca?.toLowerCase().includes(searchLower);
        const rdsMatch = item.rds?.toLowerCase().includes(searchLower);
        const comment1Match = getCommentContent(item.data_from_file1)?.toLowerCase().includes(searchLower);
        const comment2Match = getCommentContent(item.data_from_file2)?.toLowerCase().includes(searchLower);
        
        matches = bcaMatch || rdsMatch || comment1Match || comment2Match;
      }

      // Filtre par statut
      if (matches && filterStatus !== 'all') {
        const status = getStatus(item);
        matches = status === filterStatus;
      }

      if (matches) {
        filtered[key] = item;
      }
    });

    setFilteredData(filtered);
  };

  const getCommentContent = (row) => {
    if (!row) return '';
    return row.comment || row.user_comment || row.remarks || row.notes || row.comments || '';
  };

  const getStatus = (item) => {
    if (item.has_comment) return 'both';
    if (item.data_from_file1 && !item.data_from_file2) return 'only_file1';
    if (!item.data_from_file1 && item.data_from_file2) return 'only_file2';
    return 'none';
  };

  const getStatusLabel = (status) => {
    const labels = {
      both: { text: 'Commentaires trouvés', color: 'bg-green-100 text-green-800' },
      only_file1: { text: 'Uniquement dans fichier 1', color: 'bg-yellow-100 text-yellow-800' },
      only_file2: { text: 'Uniquement dans fichier 2', color: 'bg-orange-100 text-orange-800' },
      none: { text: 'Aucun commentaire', color: 'bg-gray-100 text-gray-600' }
    };
    return labels[status] || labels.none;
  };

  const exportToCSV = () => {
    const headers = ['BCA', 'RDS', 'Commentaire Fichier 1', 'Commentaire Fichier 2', 'Statut'];
    const rows = [];

    Object.values(filteredData).forEach((item) => {
      rows.push([
        item.bca || '',
        item.rds || '',
        getCommentContent(item.data_from_file1),
        getCommentContent(item.data_from_file2),
        getStatusLabel(getStatus(item)).text
      ]);
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `merged_comments_${file1}_${file2}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleRow = (key) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const getStats = () => {
    const data = mergedData?.merged_data || {};
    const values = Object.values(data);
    return {
      total: values.length,
      both: values.filter(v => v.has_comment).length,
      onlyFile1: values.filter(v => v.data_from_file1 && !v.data_from_file2).length,
      onlyFile2: values.filter(v => !v.data_from_file1 && v.data_from_file2).length,
      none: values.filter(v => !v.data_from_file1 && !v.data_from_file2).length
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-gray-600">{description}</p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-semibold">Total des entrées</div>
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-semibold">Correspondances</div>
              <div className="text-3xl font-bold text-green-900">{stats.both}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-semibold">Uniquement fichier 1</div>
              <div className="text-3xl font-bold text-yellow-900">{stats.onlyFile1}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-semibold">Uniquement fichier 2</div>
              <div className="text-3xl font-bold text-orange-900">{stats.onlyFile2}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 font-semibold">Aucun commentaire</div>
              <div className="text-3xl font-bold text-gray-900">{stats.none}</div>
            </div>
          </div>

          {/* Informations fichiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-4 bg-white border-b border-gray-200">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-semibold">Fichier source 1</div>
              <div className="text-lg font-bold text-green-900">{mergedData?.file1_info?.name}</div>
              <div className="text-sm text-green-700">{mergedData?.file1_info?.rows} lignes</div>
              <div className="text-xs text-green-600">
                {mergedData?.file1_info?.date} {mergedData?.file1_info?.time}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-semibold">Fichier source 2</div>
              <div className="text-lg font-bold text-purple-900">{mergedData?.file2_info?.name}</div>
              <div className="text-sm text-purple-700">{mergedData?.file2_info?.rows} lignes</div>
              <div className="text-xs text-purple-600">
                {mergedData?.file2_info?.date} {mergedData?.file2_info?.time}
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par BCA, RDS ou commentaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="both">Avec commentaires</option>
                  <option value="only_file1">Uniquement fichier 1</option>
                  <option value="only_file2">Uniquement fichier 2</option>
                  <option value="none">Sans commentaire</option>
                </select>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Tableau des commentaires */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    BCA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    RDS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Commentaire (Fichier 1)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Commentaire (Fichier 2)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(filteredData).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Aucun résultat trouvé
                    </td>
                  </tr>
                ) : (
                  Object.entries(filteredData).map(([key, item]) => {
                    const status = getStatus(item);
                    const statusLabel = getStatusLabel(status);
                    const isExpanded = expandedRows.has(key);
                    
                    return (
                      <React.Fragment key={key}>
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-mono">{item.bca || '-'}</td>
                          <td className="px-6 py-4 text-sm font-mono">{item.rds || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="max-w-md">
                              {item.data_from_file1 ? (
                                <div className="text-gray-900">
                                  {getCommentContent(item.data_from_file1).substring(0, 100)}
                                  {getCommentContent(item.data_from_file1).length > 100 && '...'}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Aucun commentaire</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="max-w-md">
                              {item.data_from_file2 ? (
                                <div className="text-gray-900">
                                  {getCommentContent(item.data_from_file2).substring(0, 100)}
                                  {getCommentContent(item.data_from_file2).length > 100 && '...'}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Aucun commentaire</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusLabel.color}`}>
                              {statusLabel.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleRow(key)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {isExpanded ? 'Masquer détails' : 'Voir détails'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-2">Détails fichier 1</h4>
                                  <pre className="text-xs text-gray-600 overflow-x-auto">
                                    {JSON.stringify(item.data_from_file1, null, 2)}
                                  </pre>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-2">Détails fichier 2</h4>
                                  <pre className="text-xs text-gray-600 overflow-x-auto">
                                    {JSON.stringify(item.data_from_file2, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {Object.keys(filteredData).length} sur {Object.keys(mergedData?.merged_data || {}).length} entrées
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exporter en CSV
              </button>
              <button
                onClick={() => router.visit('/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergedComments;
