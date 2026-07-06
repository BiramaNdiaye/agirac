// resources/js/Pages/Backlog/VTPlanifiees.jsx

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
  DownloadIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';

export default function VTPlanifiees({ data, title, description, totalRows, totalFiles }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    admin_bca: '',
    admin_rds: '',
    address_site_a_town: '',
    planning_date: ''
  });

  const columnsToDisplay = [
    'admin_bca',
    'admin_rds',
    'address_site_a_town',
    'address_site_a_street',
    'planning_date',
    'contact_on_site_firstname'
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      // Si c'est une date au format YYYY-MM-DD
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      // Si c'est une date au format YYYYMMDD
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

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.length === 4 && /^\d{4}$/.test(timeStr)) {
      return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
    }
    return timeStr;
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
      if (filters.planning_date && row.planning_date !== filters.planning_date) return false;

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
      planning_date: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
    toast.success('Filtres réinitialisés');
  };

  const handleViewDetails = (row) => {
    const prefix = 'PLANIFVTDATE';
    const bca = row.admin_bca;
    const rds = row.admin_rds;
    
    if (bca && rds && prefix) {
      router.visit(`/orders/${encodeURIComponent(bca)}/${encodeURIComponent(rds)}/${encodeURIComponent(prefix)}`);
    } else {
      toast.error('Données insuffisantes pour afficher les détails');
    }
  };

  const handleEditPlanning = (row) => {
    const prefix = 'EDITPLANIFDATE';
    const bca = row.admin_bca;
    const rds = row.admin_rds;
    
    if (bca && rds && prefix) {
      router.visit(`/orders/${encodeURIComponent(bca)}/${encodeURIComponent(rds)}/${encodeURIComponent(prefix)}`);
    } else {
      toast.error('Données insuffisantes pour modifier la date');
    }
  };

  const getStatusBadge = (planningDate) => {
    if (!planningDate) return null;
    
    const today = new Date();
    const planDate = new Date(planningDate);
    const diffDays = Math.ceil((planDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Dépassée</span>;
    } else if (diffDays === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Aujourd'hui</span>;
    } else if (diffDays <= 3) {
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">Proche</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Planifiée</span>;
    }
  };

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
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">{totalRows} ligne(s) planifiée(s)</span>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FilterIcon className="w-5 h-5" />
            <span>Filtres</span>
            {Object.values(filters).some(v => v) && (
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label className="block text-sm text-gray-600 mb-1">Date planifiée</label>
                <input
                  type="date"
                  value={filters.planning_date}
                  onChange={(e) => setFilters({...filters, planning_date: e.target.value})}
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
            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune VT planifiée trouvée</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 text-teal-500 hover:text-teal-600"
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
                        {column === 'planning_date' ? 'Date planifiée' : 
                         column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
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
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.admin_bca || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {row.admin_rds || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {row.address_site_a_town || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {row.address_site_a_street || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDate(row.planning_date)}</span>
                          {row.planning_time && (
                            <span className="text-xs text-gray-500">{formatTime(row.planning_time)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(row.planning_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-mono text-xs">{row._fileName?.split('_').slice(3, 5).join('_') || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditPlanning(row)}
                            className="text-amber-600 hover:text-amber-700"
                            title="Modifier la date"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleViewDetails(row)}
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Voir les détails"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
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
