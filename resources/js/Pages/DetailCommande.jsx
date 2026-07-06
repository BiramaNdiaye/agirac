import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import axios from 'axios';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

export default function Show({ order, auth, activeMainTab }) {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [completedTabs, setCompletedTabs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData } = useForm({
    address_site_a_name: order?.address_site_a_name || '',
    address_site_a_postal: order?.address_site_a_postal || '',
    address_site_a_street: order?.address_site_a_street || '',
    address_site_a_town: order?.address_site_a_town || '',
    address_site_a_x: order?.address_site_a_x || '',
    address_site_a_y: order?.address_site_a_y || '',
    
    // ✅ CHAMPS OBLIGATOIRES - toujours remplis
    admin_bca: order?.admin_bca || '',
    admin_prefix: order?.admin_prefix || '',
    admin_rds: order?.admin_rds || '',
    admin_contract: order?.admin_contract || '',
    
    admin_order_date: order?.admin_order_date || '',
    bandwith: order?.bandwith || '',
    building_code: order?.building_code || '',
    client_directive_access: order?.client_directive_access || '',
    client_directive_intervention: order?.client_directive_intervention || '',
    client_directive_planning: order?.client_directive_planning || '',
    contact_on_site_firstname: order?.contact_on_site_firstname || '',
    contact_on_site_lastname: order?.contact_on_site_lastname || '',
    contact_on_site_mail: order?.contact_on_site_mail || '',
    contact_on_site_phone: order?.contact_on_site_phone || '',
    covage_contact_name: order?.covage_contact_name || '',
    covage_contact_phone: order?.covage_contact_phone || '',
    covage_contact_mail: order?.covage_contact_mail || '',
    network: order?.network || '',
    nro_name: order?.nro_name || '',
    nro_port: order?.nro_port || '',
    offer: order?.offer || '',
    oi_reference: order?.oi_reference || '',
    operator_client_ref: order?.operator_client_ref || '',
    operator_name: order?.operator_name || '',
    order_date: order?.order_date || '',
    bpe_piquage: order?.bpe_piquage || '',
    project_name: order?.project_name || '',
    rop_ref: order?.rop_ref || '',
    techno: order?.techno || '',
    insee_code: order?.insee_code || '',
    begin_client_wait: order?.begin_client_wait || '',
    client_wait_end: order?.client_wait_end || '',
    mer_number: order?.mer_number || '',
    equipement_number: order?.equipement_number || '',
    article_designation: order?.article_designation || '',
    planning_date: '',
    fail_reason: '',
    comment: '',
  });

  // ✅ Fonction pour vérifier les champs obligatoires
  const validateRequiredFields = () => {
    const requiredFields = ['admin_rds', 'admin_bca', 'admin_prefix'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || data[field] === '') {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      const errorMsg = `Champs obligatoires manquants: ${missingFields.join(', ')}`;
      toast.error(errorMsg);
      console.error(errorMsg, data);
      return false;
    }
    return true;
  };

  // Configuration complète des champs
  const allFields = [
    'address_site_a_name', 'address_site_a_postal', 'address_site_a_street', 'address_site_a_town',
    'address_site_a_x', 'address_site_a_y', 'insee_code', 'admin_bca', 'admin_prefix', 'admin_rds',
    'admin_contract', 'bandwith', 'building_code', 'client_directive_access', 'client_directive_intervention',
    'client_directive_planning', 'contact_on_site_firstname', 'contact_on_site_lastname',
    'contact_on_site_mail', 'contact_on_site_phone', 'covage_contact_name', 'covage_contact_mail',
    'network', 'nro_name', 'nro_port', 'offer', 'oi_reference', 'operator_client_ref', 'operator_name',
    'order_date', 'bpe_piquage', 'project_name', 'rop_ref', 'techno', 'begin_client_wait', 'client_wait_end',
    'mer_number', 'equipement_number', 'article_designation',
  ];

  const tabs = [
    {
      label: 'Planifier la VT',
      key: 'Confimer la planification',
      description: 'Confirmer la date de planification de la visite technique',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'blue',
      specificFields: ['planning_date', 'comment']
    },
    {
      label: 'Impossibilité',
      key: 'Impossibilité',
      description: 'Signaler une impossibilité de planifier la VT',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      color: 'red',
      specificFields: ['fail_reason', 'comment']
    },
  ];

  // Configuration des champs pour chaque onglet
  const tabFieldsConfig = {
    'Confimer la planification': [...allFields, ...tabs.find(t => t.key === 'Confimer la planification').specificFields],
    'Impossibilité': [...allFields, ...tabs.find(t => t.key === 'Impossibilité').specificFields],
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let filteredValue;

    if (type === 'checkbox') {
      filteredValue = checked;
    } else if (typeof value === 'string') {
      filteredValue = value.replace(/,/g, '');
    } else {
      filteredValue = value;
    }

    setData((prevData) => ({
      ...prevData,
      [name]: filteredValue,
    }));
  };

  // Validation du format de date YYYY-MM-DD
  const isValidDateFormat = (dateString) => {
    if (!dateString || dateString === '') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // Validation du commentaire (min 3, max 250)
  const isValidComment = (comment) => {
    if (!comment || comment === '') return true;
    const length = comment.trim().length;
    return length >= 3 && length <= 250;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // ✅ Vérifier les champs obligatoires
    if (!validateRequiredFields()) {
      setIsSubmitting(false);
      return;
    }
    
    const currentTab = tabs[activeTab].key;

    // Vérification des champs obligatoires
    if (!data.admin_bca) {
      setMessage('La référence BCA est obligatoire');
      toast.error('La référence BCA est obligatoire');
      setIsSubmitting(false);
      return;
    }
    if (!data.admin_rds) {
      setMessage('La référence RDS est obligatoire');
      toast.error('La référence RDS est obligatoire');
      setIsSubmitting(false);
      return;
    }

    // Validation pour Confimer la planification
    if (currentTab === 'Confimer la planification' && !data.planning_date) {
      setMessage('La date de planification est obligatoire');
      toast.error('La date de planification est obligatoire');
      setIsSubmitting(false);
      return;
    }

    // Validation du format de date
    if (currentTab === 'Confimer la planification' && data.planning_date && !isValidDateFormat(data.planning_date)) {
      setMessage('La date de planification doit être au format YYYY-MM-DD');
      toast.error('La date de planification doit être au format YYYY-MM-DD');
      setIsSubmitting(false);
      return;
    }

    // Validation du commentaire
    if (data.comment && !isValidComment(data.comment)) {
      setMessage('Le commentaire doit contenir entre 3 et 250 caractères');
      toast.error('Le commentaire doit contenir entre 3 et 250 caractères');
      setIsSubmitting(false);
      return;
    }

    const relevantFields = tabFieldsConfig[currentTab] || [];

    const mergedData = relevantFields.reduce((acc, field) => {
      const value = data[field];
      if (value !== undefined && value !== null && value !== '') {
        acc[field] = value;
      }
      return acc;
    }, {});

    let prefix = '';
    switch (currentTab) {
      case 'Confimer la planification':
        prefix = 'PLANIFVTDATE';
        break;
      case 'Impossibilité':
        prefix = 'PLANIFDATEVTKO';
        break;
    }

    // ✅ S'assurer que admin_prefix, admin_rds, admin_bca sont inclus
    mergedData.admin_prefix = prefix;
    mergedData.admin_rds = data.admin_rds;
    mergedData.admin_bca = data.admin_bca;

    const escapeCsvValue = (value, isCommentField) => {
      if (value == null) return '';
      let str = String(value);
      
      if (isCommentField) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }
      
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const commentFields = ['comment'];
    const readOnlyFields = allFields;

    let headers = relevantFields;
    
    // ✅ Vérifier que les champs obligatoires sont dans les headers
    const requiredHeaders = ['admin_rds', 'admin_bca', 'admin_prefix'];
    requiredHeaders.forEach(header => {
      if (!headers.includes(header)) {
        headers.push(header);
      }
    });
    
    const row = headers.map(header => {
      if (readOnlyFields.includes(header) && !requiredHeaders.includes(header)) {
        return '';
      }
      const isComment = commentFields.includes(header);
      const value = mergedData[header];
      return value !== undefined ? escapeCsvValue(value, isComment) : '';
    });

    const csvContent = `${headers.join(',')}\n${row.join(',')}`;

    const cleanForFilename = (str) => {
      if (!str?.toString().trim()) return 'inconnu';
      return str
        .toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-+|-+$)/g, '')
        .substring(0, 30);
    };
    
    // ✅ Utiliser les valeurs existantes pour les noms de fichiers
    const adminRds = cleanForFilename(data.admin_rds || 'RDS');
    const adminBcaRef = cleanForFilename(data.admin_bca || 'REFBCA');

    const today = new Date();
    const formattedDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('');
    const formattedTime = [
      String(today.getHours()).padStart(2, '0'),
      String(today.getMinutes()).padStart(2, '0')
    ].join(':');
    const filename = `${prefix}_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime.replace(/:/g, '')}.csv`;

    const zip = new JSZip();
    zip.file(filename, csvContent);

    try {
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const zipFilename = `${prefix}_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime.replace(/:/g, '')}.zip`;
      const formData = new FormData();
      formData.append('zipFile', new File([zipContent], zipFilename, { type: 'application/zip' }));
      formData.append('activeTab', currentTab);
      // ✅ Ajouter les champs obligatoires au formData
      formData.append('admin_rds', data.admin_rds);
      formData.append('admin_bca', data.admin_bca);
      formData.append('admin_prefix', prefix);

      await axios.post('/api/vt/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCompletedTabs([...completedTabs, activeTab]);
      toast.success('Fichier ZIP déposé avec succès !');
      setMessage('Fichier ZIP déposé avec succès !');
      
      // Réinitialiser les champs
      setData('planning_date', '');
      setData('fail_reason', '');
      setData('comment', '');
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      let errorMessage = "Une erreur est survenue lors de l'envoi.";
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = "Fichier trop volumineux - taille maximale 10MB";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => {
        setMessage('');
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  if (!order) return <div className="p-6 text-red-500">Commande non trouvée.</div>;

  const getTabColorClasses = (color, isActive, isCompleted) => {
    const colors = {
      blue: { active: 'border-blue-500 text-blue-600', inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', completed: 'border-green-500 text-green-600', bg: 'bg-blue-50', ring: 'ring-blue-200', gradient: 'from-blue-50 to-indigo-50' },
      red: { active: 'border-red-500 text-red-600', inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', completed: 'border-green-500 text-green-600', bg: 'bg-red-50', ring: 'ring-red-200', gradient: 'from-red-50 to-rose-50' },
    };
    return colors[color] || colors.blue;
  };

  // Composant réutilisable pour les cartes d'information
  const InfoCard = ({ title, icon, gradient, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4 border-b border-gray-200`}>
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          {icon}
          {title}
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <input className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700" value={value || "-"} readOnly />
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch { return dateString; }
  };

  return (
    <Main user={auth.user}>
      <Head title="Visite Technique" />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header avec affichage des identifiants obligatoires */}
          <div className="bg-gradient-to-r from-[#4fbb6b] to-[#505D64] px-8 py-6">
            <h1 className="text-3xl font-bold text-white">
              Visite Technique - {data.admin_bca || 'Nouvelle commande'}
            </h1>
            <p className="text-white/80 mt-1">
              RDS: {data.admin_rds || 'NON DEFINI'} | Préfixe: {data.admin_prefix || 'NON DEFINI'}
            </p>
            <p className="text-white/70 text-sm mt-1">
              Gérez les différentes étapes de la visite technique
            </p>
          </div>

          {/* Tabs Navigation - inchangé */}
          <div className="border-b border-gray-200 px-8 pt-6 overflow-x-auto">
            <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
              {tabs.map((tab, index) => {
                const isActive = activeTab === index;
                const isCompleted = completedTabs.includes(index);
                const colors = getTabColorClasses(tab.color, isActive, isCompleted);
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(index)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      transition-all duration-200 ease-in-out
                      ${isActive ? colors.active : isCompleted ? colors.completed : colors.inactive}
                      ${isActive ? 'border-b-2' : ''}
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${colors.ring}
                    `}
                  >
                    <span className={`
                      mr-3 p-2 rounded-lg transition-all duration-200
                      ${isActive ? colors.bg : 'bg-gray-50 group-hover:bg-gray-100'}
                    `}>
                      {React.cloneElement(tab.icon, {
                        className: `w-5 h-5 ${isActive ? `text-${tab.color}-600` : 'text-gray-400 group-hover:text-gray-500'}`
                      })}
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

          {/* Tab Description - inchangé */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {tabs[activeTab].description}
            </p>
          </div>

          {/* Form - inchangé dans le reste */}
          <form onSubmit={handleSubmit} className="p-8" encType="multipart/form-data">
              <div className="space-y-6 mb-8">
              <InfoCard 
                title="Adresse Site A" 
                gradient="from-blue-50 to-indigo-50"
                icon={<svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <InfoCard 
                title="Informations Covage" 
                gradient="from-indigo-50 to-purple-50"
                icon={<svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>}
              >
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Référence BCA" value={data.admin_bca} />
                  <InfoRow label="Préfixe" value={data.admin_prefix} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="RDS" value={data.admin_rds} />
                  <InfoRow label="Référence contrat" value={data.admin_contract} />
                </div>
                <InfoRow label="Chargé de production" value={data.covage_contact_name} />
              </InfoCard>

              <InfoCard 
                title="Informations techniques" 
                gradient="from-purple-50 to-pink-50"
                icon={<svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>}
              >
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Bande passante" value={data.bandwith} />
                  <InfoRow label="Technologie" value={data.techno} />
                </div>
                <InfoRow label="Réseau" value={data.network} />
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Nom NRO" value={data.nro_name} />
                  <InfoRow label="Port NRO" value={data.nro_port} />
                </div>
                <InfoRow label="BPE Piquage" value={data.bpe_piquage} />
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="N° MER" value={data.mer_number} />
                  <InfoRow label="N° Équipement opérateur" value={data.equipement_number} />
                </div>
                <InfoRow label="Opérations" value={data.article_designation} />
              </InfoCard>

              <InfoCard 
                title="Informations client et planning" 
                gradient="from-amber-50 to-orange-50"
                icon={<svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>}
              >
                <InfoRow label="Opérateur" value={data.operator_name} />
                <InfoRow label="Référence client" value={data.operator_client_ref} />
                <InfoRow label="Offre" value={data.offer} />
                <InfoRow label="Référence OI" value={data.oi_reference} />
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Début attente client" value={formatDate(data.begin_client_wait)} />
                  <InfoRow label="Fin attente client" value={formatDate(data.client_wait_end)} />
                </div>
              </InfoCard>
            </div>
            
            {/* Section Planifier la VT */}
            {tabs[activeTab].key === 'Confimer la planification' && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Confirmation de la planification
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date prévisionnelle <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="planning_date"
                      value={data.planning_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-400 mt-1">Format: YYYY-MM-DD</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire (3 à 250 caractères)</label>
                    <textarea
                      name="comment"
                      value={data.comment}
                      maxLength={250}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Ajoutez un commentaire si nécessaire..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{data.comment?.length || 0}/250 caractères</p>
                  </div>
                </div>
              </div>
            )}

            {/* Section Impossibilité */}
            {tabs[activeTab].key === 'Impossibilité' && (
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Déclaration d'impossibilité
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif d'échec <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fail_reason"
                      value={data.fail_reason}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white"
                    >
                      <option value="">-- Sélectionner une raison --</option>
                      <option value="Appel vers le client effectué, en attente de retour">Appel vers le client effectué, en attente de retour</option>
                      <option value="Cas de force majeur">Cas de force majeur</option>
                      <option value="Demande d'annulation de la commande à l'initiative du Client">Demande d'annulation de la commande à l'initiative du Client</option>
                      <option value="Evènement public">Evènement public</option>
                      <option value="Le Client est indisponible">Le Client est indisponible</option>
                      <option value="Le Client est injoignable">Le Client est injoignable</option>
                      <option value="Le Client ne sait pas">Le Client ne sait pas</option>
                      <option value="Le Client ne veut pas">Le Client ne veut pas</option>
                      <option value="Le contact Client est obsolète">Le contact Client est obsolète</option>
                      <option value="Le Site Client est en construction">Le Site Client est en construction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire (3 à 250 caractères)</label>
                    <textarea
                      name="comment"
                      value={data.comment}
                      maxLength={250}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                      placeholder="Décrivez les raisons de l'impossibilité..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{data.comment?.length || 0}/250 caractères</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.visit('/backlog')}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#4fbb6b] to-[#3da856] hover:from-[#3da856] hover:to-[#2d8f40] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tabs[activeTab].key === 'Confimer la planification' && 'Confirmer la planification'}
                {tabs[activeTab].key === 'Impossibilité' && 'Enregistrer l\'impossibilité'}
              </button>
            </div>

            {/* Message de notification */}
            {message && (
              <div className={`mt-4 p-4 rounded-lg flex items-start animate-slide-down ${message.includes('succès') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                <svg className={`flex-shrink-0 h-5 w-5 mr-3 ${message.includes('succès') ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {message.includes('succès') ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
                <span>{message}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </Main>
  );
}
