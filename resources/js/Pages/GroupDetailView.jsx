import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
  DocumentTextIcon, 
  ArrowLeftIcon,
  ClockIcon,
  TableIcon,
  FolderIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';

export default function GroupDetailView({ group, rds, refBca, error }) {
  const [viewMode, setViewMode] = useState('table');

  const goBack = () => {
    router.visit('/grouped-data');
  };

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

  if (error || !group) {
    return (
      <AuthenticatedLayout>
        <Head title="Détail du Groupe" />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Retour
            </button>
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Groupe non trouvé</h2>
              <p className="text-gray-600">RDS: {rds} / REF BCA: {refBca}</p>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Groupe ${group.rds} - ${group.ref_bca}`} />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={goBack}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Retour à la liste
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Détail du Groupe
                  </span>
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="bg-gray-100 px-3 py-1 rounded-lg">
                    <span className="text-sm text-gray-600">RDS:</span>
                    <span className="ml-2 font-semibold text-gray-800">{group.rds}</span>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-lg">
                    <span className="text-sm text-gray-600">REF BCA:</span>
                    <span className="ml-2 font-semibold text-gray-800">{group.ref_bca}</span>
                  </div>
                </div>
                <p className="text-gray-500 mt-2">
                  {group.files?.length || 0} fichiers • {group.data?.length || 0} enregistrements
                </p>
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
              </div>
            </div>
          </div>

          {/* Fichiers associés */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Fichiers associés</h3>
            <div className="flex flex-wrap gap-2">
              {group.files?.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.file_name}</span>
                  <PrefixBadge prefix={file.prefix} />
                  <span className="text-xs text-gray-400">{file.row_count} lignes</span>
                </div>
              ))}
            </div>
          </div>

          {/* Données */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Données fusionnées ({group.data?.length || 0} enregistrements)
              </h3>
            </div>
            
            <div className="p-4">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                          Source
                        </th>
                        {group.data?.[0] && Object.keys(group.data[0])
                          .filter(key => !['source_file', 'file_name'].includes(key))
                          .slice(0, 10)
                          .map((col, idx) => (
                            <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              {col.replace(/_/g, ' ')}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.data?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm sticky left-0 bg-white">
                            <PrefixBadge prefix={row.source_file} />
                          </td>
                          {Object.entries(row)
                            .filter(([key]) => !['source_file', 'file_name'].includes(key))
                            .slice(0, 10)
                            .map(([key, value], colIdx) => (
                              <td key={colIdx} className="px-4 py-3 text-sm text-gray-700">
                                {value || '-'}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.data?.map((row, idx) => {
                    const displayFields = Object.entries(row).filter(([key]) => !['source_file', 'file_name'].includes(key));
                    return (
                      <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                          <PrefixBadge prefix={row.source_file} />
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          {displayFields.slice(0, 6).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-medium text-gray-800">{value || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
