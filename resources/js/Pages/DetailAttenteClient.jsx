// resources/js/Pages/DetailAttenteClient.jsx

import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import axios from 'axios';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

export default function DetailAttenteClient({ auth, order, filename, prefixType, bcaReference }) {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('attente');
  const [completedTabs, setCompletedTabs] = useState([]);
  const [justificatifFile, setJustificatifFile] = useState(null);
  const [relanceFile, setRelanceFile] = useState(null);

  const { data, setData } = useForm({
    // Informations de la commande
    address_site_a_name: order?.address_site_a_name || '',
    address_site_a_postal: order?.address_site_a_postal || '',
    address_site_a_street: order?.address_site_a_street || '',
    address_site_a_town: order?.address_site_a_town || '',
    address_site_a_x: order?.address_site_a_x || '',
    address_site_a_y: order?.address_site_a_y || '',
    insee_code: order?.insee_code || '',
    admin_bca: order?.admin_bca || '',
    admin_prefix: order?.admin_prefix || '',
    admin_rds: order?.admin_rds || '',
    admin_contract: order?.admin_contract || '',
    bandwith: order?.bandwith || '',
    
    building_code: order?.building_code || '',
    network: order?.network || '',
    nro_name: order?.nro_name || '',
    nro_port: order?.nro_port || '',
    techno: order?.techno || '',
    bpe_piquage: order?.bpe_piquage || '',
    operator_name: order?.operator_name || '',
    operator_client_ref: order?.operator_client_ref || '',
    offer: order?.offer || '',
    project_name: order?.project_name || '',
    
    // Champs spécifiques à l'attente client
    begin_client_wait: order?.begin_client_wait || '',
    client_wait_end: order?.client_wait_end || '',
    wait_reason: order?.wait_reason || '',
    wait_status: order?.wait_status || 'en_cours',
    estimated_resolution_date: order?.estimated_resolution_date || '',
    comment: order?.comment || '',
    justificatif: order?.justificatif || '',
    relance_count: order?.relance_count || 0,
    last_relance_date: order?.last_relance_date || '',
  });

  // Configuration des onglets
  const tabs = [
    {
      label: 'Attente Client',
      key: 'attente',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      prefix: 'ATTENTECLIENT',
      color: 'amber',
      description: 'Gestion des périodes d\'attente client'
    },
    {
      label: 'Relances',
      key: 'relances',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      prefix: 'RELANCE',
      color: 'blue',
      description: 'Historique des relances client'
    },
    {
      label: 'Historique',
      key: 'historique',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      prefix: 'HISTORIQUE',
      color: 'purple',
      description: 'Historique des attentes client'
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentTab = tabs.find(t => t.key === activeTab);
    const prefix = currentTab?.prefix || 'ATTENTECLIENT';

    // Validation selon l'onglet
    if (activeTab === 'attente') {
      if (!data.begin_client_wait) {
        setMessage('La date de début d\'attente est obligatoire');
        return;
      }
      if (!data.wait_reason) {
        setMessage('Le motif d\'attente est obligatoire');
        return;
      }
    }

    if (activeTab === 'relances' && !justificatifFile) {
      setMessage('Le fichier de justificatif est obligatoire pour une relance');
      return;
    }

    try {
      // Générer le fichier CSV
      const csvContent = generateCsvContent(prefix);
      const filename = generateFilename(prefix);
      
      const formData = new FormData();
      formData.append('filename', filename);
      formData.append('content', csvContent);
      formData.append('activeTab', prefix);

      // Ajouter les fichiers selon l'onglet
      if (activeTab === 'relances' && justificatifFile) {
        const extension = justificatifFile.name.split('.').pop();
        const newFilename = `RELANCE_${data.admin_rds || 'RDS'}_${getFormattedDate()}.${extension}`;
        const renamedFile = new File([justificatifFile], newFilename, { type: justificatifFile.type });
        formData.append('justificatif', renamedFile, newFilename);
      }

      // Envoyer les données
      await axios.post('/api/attente-client/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCompletedTabs([...completedTabs, activeTab]);
      toast.success('Données enregistrées avec succès !');
      setMessage('Données enregistrées avec succès !');

      // Reset des fichiers
      setJustificatifFile(null);
      setRelanceFile(null);

    } catch (error) {
      console.error('Erreur:', error);
      setMessage(error.response?.data?.message || "Une erreur est survenue");
    }
  };

  const generateCsvContent = (prefix) => {
    const fields = getAllFields();
    
    const header = fields.join(',');
    
    const row = fields.map(field => {
      const value = data[field] || '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
    
    return `${header}\n${row}`;
  };

  const getAllFields = () => {
    return [
      'address_site_a_name',
      'address_site_a_postal',
      'address_site_a_street',
      'address_site_a_town',
      'address_site_a_x',
      'address_site_a_y',
      'insee_code',
      'admin_bca',
      'admin_prefix',
      'admin_rds',
      'admin_contract',
      'bandwith',
      
      'building_code',
      'network',
      'nro_name',
      'nro_port',
      'techno',
      'bpe_piquage',
      'operator_name',
      'operator_client_ref',
      'offer',
      'project_name',
      'begin_client_wait',
      'client_wait_end',
      'wait_reason',
      'wait_status',
      'estimated_resolution_date',
      'comment',
      'justificatif',
      'relance_count',
      'last_relance_date',
    ];
  };

  const generateFilename = (prefix) => {
    const rds = sanitizeString(data.admin_rds || 'RDS');
    const bca = sanitizeString(data.admin_bca || 'REFBCA');
    const date = getFormattedDate();
    const time = getFormattedTime();
    
    return `${prefix}_${rds}_${bca}_${date}_${time}.csv`;
  };

  const getFormattedDate = () => {
    const today = new Date();
    return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  };

  const getFormattedTime = () => {
    const today = new Date();
    return `${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}`;
  };

  const sanitizeString = (str) => {
    if (!str) return 'inconnu';
    return str.replace(/[^a-zA-Z0-9_-]/g, '');
  };

  const InfoCard = ({ title, icon, gradient, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4 border-b border-gray-200`}>
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="mr-2">{icon}</span>
          {title}
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value, isDate = false }) => {
    const displayValue = isDate && value ? new Date(value).toLocaleDateString('fr-FR') : value || '-';
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</label>
        <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700" value={displayValue} readOnly />
      </div>
    );
  };

  const getTabColorClasses = (color, isActive) => {
    const colors = {
      amber: {
        active: 'border-amber-500 text-amber-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        bg: 'bg-amber-50',
        ring: 'ring-amber-200',
        gradient: 'from-amber-50 to-yellow-50'
      },
      blue: {
        active: 'border-blue-500 text-blue-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        bg: 'bg-blue-50',
        ring: 'ring-blue-200',
        gradient: 'from-blue-50 to-indigo-50'
      },
      purple: {
        active: 'border-purple-500 text-purple-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        bg: 'bg-purple-50',
        ring: 'ring-purple-200',
        gradient: 'from-purple-50 to-violet-50'
      }
    };
    return colors[color] || colors.amber;
  };

  const CommonInfoSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Colonne gauche */}
      <div className="space-y-6">
        <InfoCard 
          title="Adresse Site A" 
          gradient="from-blue-50 to-indigo-50"
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>}
        >
          <InfoRow label="Nom du site" value={data.address_site_a_name} />
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Code postal" value={data.address_site_a_postal} />
            <InfoRow label="Ville" value={data.address_site_a_town} />
          </div>
          <InfoRow label="Rue" value={data.address_site_a_street} />
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Coordonnée X" value={data.address_site_a_x} />
            <InfoRow label="Coordonnée Y" value={data.address_site_a_y} />
          </div>
          <InfoRow label="Code INSEE" value={data.insee_code} />
        </InfoCard>
      </div>

      {/* Colonne droite */}
      <div className="space-y-6">
        <InfoCard 
          title="Informations commande" 
          gradient="from-indigo-50 to-purple-50"
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>}
        >
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Référence BCA" value={data.admin_bca} />
            <InfoRow label="RDS" value={data.admin_rds} />
          </div>
          <InfoRow label="Opérateur" value={data.operator_name} />
          <InfoRow label="Offre" value={data.offer} />
        </InfoCard>
      </div>
    </div>
  );

  return (
    <Main user={auth.user}>
      <Head title="Attente Client" />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">
              Gestion d'attente client - {data.admin_bca || 'Nouvelle commande'}
            </h1>
            <p className="text-white/80 mt-1">
              Gérez les périodes d'attente et les relances client
            </p>
            {filename && (
              <div className="mt-2 text-sm text-white/70">
                Fichier source : {filename}
              </div>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 px-8 pt-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const isCompleted = completedTabs.includes(tab.key);
                const colors = getTabColorClasses(tab.color, isActive);

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      transition-all duration-200
                      ${isActive ? colors.active : isCompleted ? 'border-green-500 text-green-600' : colors.inactive}
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${colors.ring}
                    `}
                  >
                    <span className={`
                      mr-3 p-2 rounded-lg transition-all
                      ${isActive ? colors.bg : 'bg-gray-50 group-hover:bg-gray-100'}
                    `}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    {isCompleted && (
                      <svg className="ml-2 w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Description de l'onglet */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {tabs.find(t => t.key === activeTab)?.description}
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="p-8" encType="multipart/form-data">
            <CommonInfoSection />

            {/* Section Attente Client */}
            {activeTab === 'attente' && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Gestion de l'attente client
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date début d'attente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="begin_client_wait"
                      value={data.begin_client_wait}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date fin d'attente
                    </label>
                    <input
                      type="date"
                      name="client_wait_end"
                      value={data.client_wait_end}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="wait_status"
                      value={data.wait_status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="en_cours">En cours</option>
                      <option value="resolue">Résolue</option>
                      <option value="relance">En relance</option>
                      <option value="escalade">Escaladée</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif de l'attente <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="wait_reason"
                      value={data.wait_reason}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Sélectionnez un motif</option>
                      <option value="client_indisponible">Client indisponible</option>
                      <option value="document_manquant">Document manquant</option>
                      <option value="validation_interne">Validation interne</option>
                      <option value="travaux_externes">Travaux externes</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de résolution estimée
                    </label>
                    <input
                      type="date"
                      name="estimated_resolution_date"
                      value={data.estimated_resolution_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment"
                      maxLength={250}
                      value={data.comment}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Détails sur l'attente client..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section Relances */}
            {activeTab === 'relances' && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Gestion des relances
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de relance
                    </label>
                    <input
                      type="date"
                      name="last_relance_date"
                      value={data.last_relance_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de relances
                    </label>
                    <input
                      type="number"
                      name="relance_count"
                      value={data.relance_count}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Justificatif de relance <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer group">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => setJustificatifFile(e.target.files[0])}
                          required
                          className="hidden"
                        />
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="mt-1 block text-sm text-gray-600 group-hover:text-blue-600">Choisir un fichier</span>
                        </div>
                      </label>
                      {justificatifFile && (
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{justificatifFile.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire de relance</label>
                    <textarea
                      name="comment"
                      maxLength={250}
                      value={data.comment}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Détails de la relance..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section Historique */}
            {activeTab === 'historique' && (
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Historique des attentes
                </h3>

                <div className="bg-white rounded-lg p-6 text-center text-gray-500">
                  <p>L'historique des attentes client sera affiché ici</p>
                  <p className="text-sm mt-2">Fonctionnalité à venir</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition"
              >
                {activeTab === 'attente' && 'Enregistrer l\'attente'}
                {activeTab === 'relances' && 'Enregistrer la relance'}
                {activeTab === 'historique' && 'Actualiser'}
              </button>
            </div>

            {/* Message de notification */}
            {message && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-start ${
                  message.includes('succès')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <svg
                  className={`flex-shrink-0 h-5 w-5 mr-3 ${
                    message.includes('succès') ? 'text-green-500' : 'text-red-500'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {message.includes('succès') ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span>{message}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </Main>
  );
}
