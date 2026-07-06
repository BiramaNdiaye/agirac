// resources/js/Pages/ZipViewer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import Tabs from '@/Components/Tabs';
import {
  DocumentTextIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LightningBoltIcon,
  DocumentReportIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FilterIcon,
  XIcon,
  RefreshIcon,
  DownloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  CheckCircleIcon,
  CloudIcon,
  CalendarIcon
} from '@heroicons/react/outline';
import { Link } from '@inertiajs/react';
import toast from 'react-hot-toast';

export default function ZipViewer() {
  const [csvGroups, setCsvGroups] = useState({
    'Raccordement': [],
    'Visite Technique': [],
    'Retour CRVT': [],
    'VT Planifiée': [],
    'Racco Planifié': [], // Nouvel onglet pour PLANIFRACCODATE
    'COMMENT': [],
    'ATTENTECLIENT': [],
    'Error': [],
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [connectionError, setConnectionError] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [noFilesFound, setNoFilesFound] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const previousRowsRef = useRef([]);
  const previousCountsRef = useRef({});
  const searchInputRef = useRef(null);

  const [filters, setFilters] = useState({
    address_site_a_postal: '',
    admin_rds: '',
    address_site_a_town: '',
    address_site_a_x: '',
    address_site_a_y: '',
    admin_bca: '',
  });

  // Colonnes à afficher
  const columnsToDisplay = [
    'address_site_a_postal',
    'admin_rds',
    'address_site_a_town',
    'address_site_a_x',
    'address_site_a_y',
    'admin_bca',
  ];

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return null;
    return dateStr;
  };

  const displayDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return '-';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  const handleReset = () => {
    setFilters({
      address_site_a_postal: '',
      admin_rds: '',
      address_site_a_town: '',
      address_site_a_x: '',
      address_site_a_y: '',
      admin_bca: '',
    });
    setCurrentPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    toast.success('Filtres réinitialisés');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    toast.success('Filtres appliqués avec succès');
  };

  useEffect(() => {
    const fetchCsvData = () => {
      setLoading(true);
      setConnectionError(false);
      setConnectionSuccess(false);
      setNoFilesFound(false);

      fetch('/api/vt/csv-data')
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              return res.json().then(data => {
                setConnectionSuccess(true);
                setNoFilesFound(true);
                throw new Error('NO_FILES_FOUND');
              });
            }
            throw new Error('Erreur réseau');
          }
          return res.json();
        })
        .then(json => {
          if (json.success) {
            setConnectionSuccess(true);
            
            if (!json.data || json.data.length === 0) {
              setNoFilesFound(true);
              setCsvGroups({
                'Raccordement': [],
                'Visite Technique': [],
                'Retour CRVT': [],
                'VT Planifiée': [],
                'Racco Planifié': [],
                'COMMENT': [],
                'ATTENTECLIENT': [],
              });
              return;
            }

            setNoFilesFound(false);
            
            const grouped = {
              'Raccordement': [],
              'Visite Technique': [],
              'Retour CRVT': [],
              'VT Planifiée': [],
              'Racco Planifié': [],
              'COMMENT': [],
              'ATTENTECLIENT': [],
            };

            const allRows = [];
            const newRowsByCategory = {
              'Raccordement': [],
              'Visite Technique': [],
              'Retour CRVT': [],
              'VT Planifiée': [],
              'Racco Planifié': [],
              'COMMENT': [],
              'ATTENTECLIENT': [],
            };

            json.data.forEach(zip => {
              zip.csv_files.forEach(csv => {
                const prefix = csv.file_name.split('_')[0];
                const source = csv.source || (prefix === 'PLANIFVTDATE' || prefix === 'PLANIFRACCODATE' ? 'ARCHIVE' : 'SFTP');
                
                const rowsWithId = csv.sample_rows.map((row, index) => ({
                  ...row,
                  _rowId: `${csv.file_name}_${index}`,
                  _isNew: false,
                  _fileName: csv.file_name,
                  _category: prefix,
                  _planning_date: row.planning_date || null,
                  _file_info: csv.file_info,
                  _source: source
                }));
                
                allRows.push(...rowsWithId);

                // Raccordement (planification initiale)
                if (prefix === 'OTPLANIFRACCODATE') {
                  grouped['Raccordement'].push({...csv, sample_rows: rowsWithId});
                  newRowsByCategory['Raccordement'].push(...rowsWithId);
                } 
                // Raccordement Planifié (confirmé)
                else if (prefix === 'PLANIFRACCODATE') {
                  grouped['Racco Planifié'].push({...csv, sample_rows: rowsWithId});
                  newRowsByCategory['Racco Planifié'].push(...rowsWithId);
                }
                // Visite Technique (planification)
                else if (prefix === 'OTPLANIFVTDATE') {
                  grouped['Visite Technique'].push({...csv, sample_rows: rowsWithId});
                  newRowsByCategory['Visite Technique'].push(...rowsWithId);
                }
                // VT Planifiée (confirmée)
                else if (prefix === 'PLANIFVTDATE') {
                  grouped['VT Planifiée'].push({...csv, sample_rows: rowsWithId});
                  newRowsByCategory['VT Planifiée'].push(...rowsWithId);
                }
                // Retour CRVT
                else if (prefix === 'CRVTCLIKO') {
                  grouped['Retour CRVT'].push({...csv, sample_rows: rowsWithId});
                  newRowsByCategory['Retour CRVT'].push(...rowsWithId);
                }
                // Commentaires
                else if (prefix === 'COMMENT') {
                  grouped['COMMENT'].push({...csv, sample_rows: rowsWithId});
                  newRowsByCategory['COMMENT'].push(...rowsWithId);
                }
                // Attente Client
                else if (prefix === 'ATTENTECLIENT') {
                  grouped['ATTENTECLIENT'].push({...csv, sample_rows: rowsWithId});
                  newRowsByCategory['ATTENTECLIENT'].push(...rowsWithId);
                }
                // Erreurs
                else {
                  grouped['Error'] = grouped['Error'] || [];
                  grouped['Error'].push({...csv, sample_rows: rowsWithId});
                }
              });
            });

            const previousRowIds = previousRowsRef.current.map(r => r._rowId);
            const currentRowIds = allRows.map(r => r._rowId);
            
            const newRowIds = currentRowIds.filter(id => !previousRowIds.includes(id));
            
            // Compter les nouveaux fichiers par catégorie (uniquement ceux du SFTP, pas les archives)
            const newCountsByCategory = {};
            Object.keys(newRowsByCategory).forEach(category => {
              const newInCategory = newRowsByCategory[category].filter(row => {
                return newRowIds.includes(row._rowId) && row._source !== 'ARCHIVE';
              });
              newCountsByCategory[category] = newInCategory.length;
            });
            
            Object.keys(grouped).forEach(key => {
              grouped[key].forEach(file => {
                file.sample_rows.forEach(row => {
                  if (newRowIds.includes(row._rowId)) {
                    row._isNew = true;
                  }
                });
              });
            });

            previousRowsRef.current = allRows;
            previousCountsRef.current = newCountsByCategory;

            // Trier par date décroissante
            Object.keys(grouped).forEach(key => {
              grouped[key].sort((a, b) => b.file_name.localeCompare(a.file_name));
            });

            setCsvGroups(grouped);
            
            // Afficher les alertes uniquement pour les nouveaux fichiers de Covage (source SFTP)
            const totalNewFromCovage = Object.values(newCountsByCategory).reduce((a, b) => a + b, 0);
            
            if (totalNewFromCovage > 0) {
              // Construire le message avec les détails par catégorie
              const categoryMessages = [];
              if (newCountsByCategory['Visite Technique'] > 0) {
                categoryMessages.push(`${newCountsByCategory['Visite Technique']} VT à planifier`);
              }
              if (newCountsByCategory['VT Planifiée'] > 0) {
                categoryMessages.push(`${newCountsByCategory['VT Planifiée']} VT planifiées`);
              }
              if (newCountsByCategory['Retour CRVT'] > 0) {
                categoryMessages.push(`${newCountsByCategory['Retour CRVT']} retours CRVT`);
              }
              if (newCountsByCategory['Raccordement'] > 0) {
                categoryMessages.push(`${newCountsByCategory['Raccordement']} raccordements à planifier`);
              }
              if (newCountsByCategory['Racco Planifié'] > 0) {
                categoryMessages.push(`${newCountsByCategory['Racco Planifié']} raccordements planifiés`);
              }
              if (newCountsByCategory['COMMENT'] > 0) {
                categoryMessages.push(`${newCountsByCategory['COMMENT']} commentaires`);
              }
              if (newCountsByCategory['ATTENTECLIENT'] > 0) {
                categoryMessages.push(`${newCountsByCategory['ATTENTECLIENT']} attentes client`);
              }
              
              toast.success(
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="mr-2">📦</span>
                    <span><strong>{totalNewFromCovage}</strong> nouveau(x) fichier(s) de Covage</span>
                  </div>
                  <div className="text-xs mt-1 opacity-90">
                    {categoryMessages.join(' • ')}
                  </div>
                </div>,
                {
                  icon: '📥',
                  duration: 5000,
                  style: {
                    borderRadius: '10px',
                    background: '#10b981',
                    color: '#fff',
                  },
                }
              );
            }
          }
        })
        .catch(err => {
          if (err.message === 'NO_FILES_FOUND') {
            console.log('Connexion réussie mais aucun fichier trouvé');
          } else {
            console.error('Erreur lors de la récupération des données:', err);
            setConnectionError(true);
            toast.error('Impossible de se connecter au serveur', {
              style: {
                borderRadius: '10px',
                background: '#ef4444',
                color: '#fff',
              },
            });
          }
          
          const emptyGroups = {
            'Raccordement': [],
            'Visite Technique': [],
            'Retour CRVT': [],
            'VT Planifiée': [],
            'Racco Planifié': [],
            'COMMENT': [],
            'Error': []
          };
          setCsvGroups(emptyGroups);
        })
        .finally(() => setLoading(false));
    };

    fetchCsvData();

    const intervalId = setInterval(fetchCsvData, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-600 font-medium">Chargement en cours...</p>
          <p className="text-sm text-gray-400">Connexion au serveur SFTP...</p>
        </div>
      </div>
    );
  }

  // Fonction pour obtenir les données filtrées et paginées de l'onglet actif
  const getCurrentTabData = () => {
    const currentFiles = (() => {
      switch(activeTab) {
        case 0: return csvGroups['Visite Technique'] || [];
        case 1: return csvGroups['VT Planifiée'] || [];
        case 2: return csvGroups['Retour CRVT'] || [];
        case 3: return csvGroups['Raccordement'] || [];
        case 4: return csvGroups['Racco Planifié'] || []; // Nouvel onglet
        case 5: return csvGroups['COMMENT'] || [];
        case 6: return csvGroups['ATTENTECLIENT'] || [];
        default: return [];
      }
    })();

    // Filtrer les lignes
    const allRows = currentFiles.flatMap(csv => 
      csv.sample_rows ? csv.sample_rows.filter(row => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          const rowValue = row[key]?.toString().toLowerCase() || '';
          return rowValue.includes(value.toString().toLowerCase());
        });
      }) : []
    );

    // Paginer
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRows = allRows.slice(startIndex, endIndex);

    return {
      files: currentFiles,
      allRows,
      paginatedRows,
      totalRows: allRows.length,
      totalPages: Math.ceil(allRows.length / rowsPerPage)
    };
  };

  const currentData = getCurrentTabData();

  const renderCsvList = () => {
    // Cas spécial : connexion réussie mais aucun fichier
    if (connectionSuccess && noFilesFound) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CloudIcon className="h-12 w-12 text-green-500" />
            </div>
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-medium">Connecté au serveur SFTP</span>
            </div>
            <p className="text-xl font-medium text-gray-700 mt-4">
              Aucun fichier disponible
            </p>
            <p className="text-sm text-gray-400 max-w-md">
              La connexion au serveur SFTP est établie avec succès, 
              mais aucun fichier ZIP n'a été trouvé pour le moment.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <RefreshIcon className="h-5 w-5" />
              <span>Rafraîchir</span>
            </button>
          </div>
        </div>
      );
    }

    // Cas : erreur de connexion
    if (connectionError) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-xl font-medium text-gray-700">
              Erreur de connexion
            </p>
            <p className="text-sm text-gray-400 max-w-md">
              Impossible de se connecter au serveur SFTP. 
              Vérifiez votre connexion réseau et réessayez.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <RefreshIcon className="h-5 w-5" />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      );
    }

    // Cas : pas de fichiers dans cette catégorie
    if (!currentData.files || currentData.files.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-xl font-medium text-gray-700">
              Aucun fichier disponible
            </p>
            <p className="text-sm text-gray-400">
              Cette catégorie ne contient aucun fichier pour le moment
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Bannière de connexion réussie */}
        {connectionSuccess && !noFilesFound && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Connecté au serveur SFTP</span>
          </div>
        )}

        {/* Statistiques */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              <strong>{currentData.totalRows}</strong> ligne(s) trouvée(s)
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="text-sm text-gray-500">
              <strong>{currentData.files.length}</strong> fichier(s)
            </span>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  {columnsToDisplay.map((column) => (
                    <th 
                      key={column}
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </th>
                  ))}
                  {(activeTab === 1 || activeTab === 4) && (
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date planifiée
                    </th>
                  )}
                  <th scope="col" className="relative px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                 </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.paginatedRows.map((row, rowIndex) => (
                  <tr 
                    key={`row-${rowIndex}`} 
                    className={`group hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent transition-all duration-200 ${
                      row._isNew ? 'animate-highlight' : ''
                    }`}
                  >
                    {columnsToDisplay.map((column, colIndex) => (
                      <td 
                        key={`${column}-${rowIndex}`} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                      >
                        <div className="flex items-center">
                          {column.includes('date') ? displayDate(row[column]) : (row[column] || '-')}
                          {row._isNew && colIndex === 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 animate-pulse">
                              Nouveau
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                    
                    {/* Colonne Date planifiée pour les onglets VT Planifiée (index 1) et Racco Planifié (index 4) */}
                    {(activeTab === 1 || activeTab === 4) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {row.planning_date ? new Date(row.planning_date).toLocaleDateString('fr-FR') : '-'}
                      </td>
                    )}
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          const parts = row._fileName?.split('_') || [];
                          const prefix = parts[0];
                          const bca = row.admin_bca;
                          const rds = row.admin_rds;
                          
                          if (bca && rds && prefix) {
                            router.visit(`/orders/${encodeURIComponent(bca)}/${encodeURIComponent(rds)}/${encodeURIComponent(prefix)}`);
                          } else if (bca && rds) {
                            router.visit(`/orders/${encodeURIComponent(bca)}/${encodeURIComponent(rds)}`);
                          } else {
                            toast.error('Données insuffisantes pour afficher les détails');
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg opacity-90 group-hover:opacity-100 transform group-hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <span>Détails</span>
                        <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {currentData.totalPages > 1 && (
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {[10, 25, 50, 100].map(size => (
                      <option key={size} value={size}>{size} lignes</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} sur {currentData.totalPages}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all ${
                      currentPage === 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  <span className="text-sm text-gray-700">
                    {currentPage} / {currentData.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, currentData.totalPages))}
                    disabled={currentPage === currentData.totalPages}
                    className={`p-2 rounded-lg transition-all ${
                      currentPage === currentData.totalPages 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentData.paginatedRows.length === 0 && (
            <div className="px-6 py-16 text-center">
              <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500 text-lg">Aucun résultat trouvé</p>
              <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Nouvel ordre des onglets avec Racco Planifié
  const tabs = [
    {
      label: 'Visite Technique',
      icon: <DocumentReportIcon className="w-5 h-5" />,
      count: csvGroups['Visite Technique']?.length || 0,
      color: 'blue'
    },
    {
      label: 'VT Planifiée',
      icon: <CalendarIcon className="w-5 h-5" />,
      count: csvGroups['VT Planifiée']?.length || 0,
      color: 'teal'
    },
    {
      label: 'Retour CRVT',
      icon: <ClockIcon className="w-5 h-5" />,
      count: csvGroups['Retour CRVT']?.length || 0,
      color: 'purple'
    },
    {
      label: 'Raccordement',
      icon: <LightningBoltIcon className="w-5 h-5" />,
      count: csvGroups['Raccordement']?.length || 0,
      color: 'amber'
    },
    {
      label: 'Racco Planifié',
      icon: <LightningBoltIcon className="w-5 h-5" />,
      count: csvGroups['Racco Planifié']?.length || 0,
      color: 'cyan'
    },
    {
      label: 'COMMENT',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      count: csvGroups['COMMENT']?.length || 0,
      color: 'green'
    },
    {
      label: 'Attente Client',
      icon: <ClockIcon className="w-5 h-5" />,
      count: csvGroups['ATTENTECLIENT']?.length || 0,
      color: 'orange'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  Backlog
                </span>
              </h1>
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                Raccordement et Visite Technique
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  showFilters 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <FilterIcon className={`h-5 w-5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                <span className="font-medium">{showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}</span>
              </button>

              <Link 
                href={'/api/vt/csv-error'} 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span>Fichiers Erreurs</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Filtres globaux */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 transform transition-all duration-300 animate-slideDown">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FilterIcon className="h-5 w-5 text-emerald-500" />
                Filtres avancés
              </h3>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
              >
                <XIcon className="h-4 w-4" />
                Réinitialiser
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {columnsToDisplay.map((field) => (
                  <div key={field} className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                    <div className="relative">
                      <input
                        ref={field === columnsToDisplay[0] ? searchInputRef : null}
                        type="text"
                        value={filters[field] || ''}
                        onChange={(e) => {
                          setFilters({ ...filters, [field]: e.target.value });
                          setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all group-hover:border-gray-300"
                        placeholder={`Rechercher...`}
                      />
                      <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  Effacer
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Appliquer les filtres
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
          {tabs.map((tab, index) => (
            <div
              key={index}
              onClick={() => {
                setActiveTab(index);
                setCurrentPage(1);
              }}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                activeTab === index 
                  ? `border-${tab.color}-500 shadow-${tab.color}-100` 
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 bg-${tab.color}-50 rounded-lg`}>
                  <div className={`text-${tab.color}-600`}>
                    {tab.icon}
                  </div>
                </div>
                <span className={`text-2xl font-bold text-${tab.color}-600`}>
                  {tab.count}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-600">{tab.label}</p>
            </div>
          ))}
        </div>

        {/* Contenu principal avec Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveTab(index);
                    setCurrentPage(1);
                  }}
                  className={`py-4 px-6 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                    activeTab === index
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === index
                        ? `bg-${tab.color}-100 text-${tab.color}-600`
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {renderCsvList()}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes highlight {
          0%, 100% {
            background-color: transparent;
          }
          50% {
            background-color: rgba(16, 185, 129, 0.1);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-highlight {
          animation: highlight 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}
