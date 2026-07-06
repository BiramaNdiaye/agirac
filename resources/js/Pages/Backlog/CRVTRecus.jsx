// resources/js/Pages/Backlog/CRVTRecus.jsx

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  DocumentTextIcon,
  ArrowRightIcon,
  FilterIcon,
  XIcon,
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentReportIcon,
  DownloadIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';

export default function CRVTRecus({ data, title, description, totalRows, totalFiles }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({
    admin_bca: '',
    admin_rds: '',
    address_site_a_town: '',
    result_status: '',
    effective_date: ''
  });

  const columnsToDisplay = [
    'admin_bca',
    'admin_rds',
    'address_site_a_town',
    'result_status',
    'effective_date'
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${day}/${month}/${year}`;
      }
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pas de blocage':
        return 'bg-green-100 text-green-800';
      case 'Blocage privé':
        return 'bg-yellow-100 text-yellow-800';
      case 'Blocage publique':
        return 'bg-orange-100 text-orange-800';
      case 'Blocage privé et public':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pas de blocage':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'Blocage privé':
      case 'Blocage publique':
      case 'Blocage privé et public':
        return <ExclamationCircleIcon className="w-4 h-4" />;
      default:
        return <DocumentReportIcon className="w-4 h-4" />;
    }
  };

  const getFilteredRows = () => {
    const allRows = data.flatMap(file => 
      file.sample_rows.map(row => ({
        ...row,
        _fileName: file.file_name,
        _source: file.source,
        _fileInfo: file.file_info
      }))
    );

    return allRows.filter(row => {
      // Recherche générale
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchSearch = Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchLower)
        );
        if (!matchSearch) return false;
      }

      // Filtres spécifiques
      if (filters.admin_bca && !row.admin_bca?.toLowerCase().includes(filters.admin_bca.toLowerCase())) return false;
      if (filters.admin_rds && !row.admin_rds?.toLowerCase().includes(filters.admin_rds.toLowerCase())) return false;
      if (filters.address_site_a_town && !row.address_site_a_town?.toLowerCase().includes(filters.address_site_a_town.toLowerCase())) return false;
      if (filters.result_status && row.result_status !== filters.result_status) return false;
      if (filters.effective_date && row.effective_date !== filters.effective_date) return false;

      return true;
    });
  };

  const filteredRows = getFilteredRows();
  const totalFilteredRows = filteredRows.length;
  const totalPages = Math.ceil(totalFilteredRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);

  const handleResetFilters = () => {
    setFilters({
      admin_bca: '',
      admin_rds: '',
      address_site_a_town: '',
      result_status: '',
      effective_date: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
    toast.success('Filtres réinitialisés');
  };

  const handleViewDetails = (row) => {
    const prefix = 'CRVTCLIKO';
    const bca = row.admin_bca;
    const rds = row.admin_rds;
    
    if (bca && rds && prefix) {
      router.visit(`/orders/${encodeURIComponent(bca)}/${encodeURIComponent(rds)}/${encodeURIComponent(prefix)}`);
    } else {
      toast.error('Données insuffisantes pour afficher les détails');
    }
  };

  const handleToggleExpand = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const statusOptions = [
    'Pas de blocage',
    'Blocage privé',
    'Blocage publique',
    'Blocage privé et public'
  ];

  return (
    <AuthenticatedLayout>
      <Head title={title} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500 mt-1">{description}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">{totalFiles} fichier(s)</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
              <DocumentReportIcon className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">{totalRows} CRVT reçus</span>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par BCA, RDS, site..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FilterIcon className="w-5 h-5" />
            <span>Filtres</span>
            {Object.values(filters).some(v => v) && (
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">Filtres avancés</h3>
              <button onClick={handleResetFilters} className="text-sm text-gray-500 hover:text-red-500">
                Réinitialiser
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Référence BCA</label>
                <input
                  type="text"
                  value={filters.admin_bca}
                  onChange={(e) => setFilters({...filters, admin_bca: e.target.value})}
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">RDS</label>
                <input
                  type="text"
                  value={filters.admin_rds}
                  onChange={(e) => setFilters({...filters, admin_rds: e.target.value})}
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ville</label>
                <input
                  type="text"
                  value={filters.address_site_a_town}
                  onChange={(e) => setFilters({...filters, address_site_a_town: e.target.value})}
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Résultat</label>
                <select
                  value={filters.result_status}
                  onChange={(e) => setFilters({...filters, result_status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">Tous</option>
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date effective</label>
                <input
                  type="date"
                  value={filters.effective_date}
                  onChange={(e) => setFilters({...filters, effective_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Statistiques des résultats */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            <strong>{totalFilteredRows}</strong> résultat(s) trouvé(s)
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Afficher :</label>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tableau des résultats */}
        {paginatedRows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DocumentReportIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun CRVT reçu trouvé</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 text-purple-500 hover:text-purple-600"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columnsToDisplay.map((column) => (
                      <th
                        key={column}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column === 'result_status' ? 'Résultat' :
                         column === 'effective_date' ? 'Date effective' :
                         column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commentaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fichier
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRows.map((row, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.admin_bca || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row.admin_rds || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row.address_site_a_town || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.result_status)}`}>
                            {getStatusIcon(row.result_status)}
                            {row.result_status || 'Non spécifié'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(row.effective_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {row.comment || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="font-mono text-xs">{row._fileName?.split('_').slice(3, 5).join('_') || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleExpand(idx)}
                              className="text-gray-500 hover:text-gray-700"
                              title={expandedRow === idx ? "Masquer les détails" : "Voir les détails"}
                            >
                              <svg className={`w-5 h-5 transition-transform ${expandedRow === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleViewDetails(row)}
                              className="text-purple-600 hover:text-purple-700"
                              title="Voir les détails complets"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Ligne expandable avec détails supplémentaires */}
                      {expandedRow === idx && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Adresse complète</label>
                                <p className="text-sm text-gray-700">
                                  {row.address_site_a_street || '-'}<br />
                                  {row.address_site_a_postal} {row.address_site_a_town}
                                </p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date de soumission</label>
                                <p className="text-sm text-gray-700">{formatDate(row.submission_date) || '-'}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Infrastructure à créer</label>
                                <p className="text-sm text-gray-700">{row.infra_to_be_created || '-'}</p>
                              </div>
                              {row.vt_comment && (
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Commentaire VT</label>
                                  <p className="text-sm text-gray-700">{row.vt_comment}</p>
                                </div>
                              )}
                              {row.vt_fail_comment && (
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Commentaire d'échec</label>
                                  <p className="text-sm text-red-600">{row.vt_fail_comment}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded disabled:opacity-50"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {startIndex + 1} - {Math.min(startIndex + rowsPerPage, totalFilteredRows)} sur {totalFilteredRows}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
