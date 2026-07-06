import Main from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import axios from 'axios';
import React from 'react';

export default function DetailRacco({ auth, order }) {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [completedTabs, setCompletedTabs] = useState([]);
  const [cableShapeBpeFile, setCableShapeBpeFile] = useState(null);
  const [pmvClosureFile, setPmvClosureFile] = useState(null);
  const [supply, setSupplyFile] = useState(null);
  const [supply2, setSupplyFile2] = useState(null);
  const [ropFile, setRopFile] = useState(null);

  const { errors } = usePage().props;

  const { data, setData } = useForm({
    address_site_a_name: order?.address_site_a_name || '',
    address_site_a_postal: order?.address_site_a_postal || '',
    address_site_a_street: order?.address_site_a_street || '',
    address_site_a_town: order?.address_site_a_town || '',
    address_site_a_x: order?.address_site_a_x || '',
    address_site_a_y: order?.address_site_a_y || '',
    insee_code: order?.insee_code || '',
    admin_bca: order?.admin_bca || '',
    admin_order_date: order?.admin_order_date || '',
    admin_prefix: order?.admin_prefix || '',
    admin_rds: order?.admin_rds || '',
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
    covage_contact_mail: order?.covage_contact_mail || '',
    covage_contact_phone: order?.covage_contact_phone || '',
    network: order?.network || '',
    nro_name: order?.nro_name || '',
    nro_port: order?.nro_port || '',
    offer: order?.offer || '',
    oi_reference: order?.oi_reference || '',
    operator_client_ref: order?.operator_client_ref || '',
    operator_name: order?.operator_name || '',
    order_date: order?.order_date || '',
    pop_name: order?.pop_name || '',
    project_name: order?.project_name || '',
    rop_ref: order?.rop_ref || '',
    techno: order?.techno || '',
    vt_comment: order?.vt_comment || '',
    vt_fail_comment: order?.vt_fail_comment || '',
    fail_reason: order?.fail_reason || '',
    comment: order?.comment || '',
    effective_date: order?.effective_date || '',
    submission_date: order?.submission_date || '',
    admin_contract: order?.admin_contract || '',
    rop_travaux: order?.rop_travaux || '',
    infra_to_be_created: order?.infra_to_be_created || '',
    arc_ars_declaration_date: order?.arc_ars_declaration_date || '',
    bpe_piquage: order?.bpe_piquage || '',
    enedis_order_start_date: order?.enedis_order_start_date || '',
    orange_order_ref: order?.orange_order_ref || '',
    orange_order_start_date: order?.orange_order_start_date || '',
    orange_submission_date: order?.orange_submission_date || '',
    racco_planning_end_date: order?.racco_planning_end_date || '',
    pmv_application_date: order?.pmv_application_date || '',
    pmv_validation_date: order?.pmv_validation_date || '',
    third_party_company_name: order?.third_party_company_name || '',
    third_party_order_start_date: order?.third_party_order_start_date || '',
    cable_shape_bpe: order?.cable_shape_bpe || '',
    pmv_closure: order?.pmv_closure || '',
    supply_dft: order?.supply_dft || '',
    supply: order?.supply || '',
    planning_date: order?.planning_date,
    begin_client_wait: order?.begin_client_wait || '',
    client_wait_end: order?.client_wait_end || '',
    mer_number: order?.mer_number || '',
    equipement_number: order?.equipement_number || '',
    article_designation: order?.article_designation || '',
    // Champs spécifiques
    cable_capacity: '',
    gc_length: '',
    ml_length_extension_cable: '',
    ml_length_racco_cable_private_domain: '',
    ml_length_racco_cable_public_domain: '',
    enedis_validation_date: '',
    orange_validation_date: '',
    pole_intervention: '',
    // Nouveaux champs pour Livré CR Client
    cpe_installed: '',
    cpe_operator_number: '',
    client_cpe_serial: '',
  });

  // Configuration des champs communs à tous les onglets
  const allFields = [
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
    'building_code',
    'client_directive_access',
    'client_directive_intervention',
    'client_directive_planning',
    'contact_on_site_firstname',
    'contact_on_site_lastname',
    'contact_on_site_mail',
    'contact_on_site_phone',
    'covage_contact_name',
    'covage_contact_mail',
    'network',
    'nro_name',
    'nro_port',
    'offer',
    'oi_reference',
    'operator_client_ref',
    'operator_name',
    'order_date',
    'pop_name',
    'project_name',
    'rop_ref',
    'techno',
    'bpe_piquage',
    'begin_client_wait',
    'client_wait_end',
    'mer_number',
    'equipement_number',
    'article_designation',
  ];

  const tabs = [
    {
      label: 'Livré CR Client',
      key: 'Livré CR Client',
      description: 'Finaliser et livrer le compte-rendu client après visite technique',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      prefix: 'CRIDOCCLI',
      color: 'emerald',
      specificFields: [
        'effective_date', 
        'submission_date', 
        'comment',
        'cpe_installed',
        'cpe_operator_number',
        'client_cpe_serial'
      ]
    },
    {
      label: 'Impossibilité',
      key: 'Impossibilité',
      description: 'Signaler une impossibilité de réaliser le raccordement',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      prefix: 'PLANIFRACCODATEKO',
      color: 'red',
      specificFields: ['fail_reason', 'comment']
    },
    {
      label: 'Planifier raccordement',
      key: 'Planifier le raccordement',
      description: 'Programmer la date de réalisation du raccordement',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      prefix: 'PLANIFRACCODATE',
      color: 'blue',
      specificFields: [
        'arc_ars_declaration_date',
        'enedis_order_start_date',
        'orange_order_ref',
        'orange_order_start_date',
        'planning_date',
        'pmv_application_date',
        'third_party_company_name',
        'third_party_order_start_date',
        'comment'
      ]
    },
    {
      label: 'Edit Planif date',
      key: 'EDITPLANIFDATE',
      description: 'Modifier la date de planification du raccordement',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      prefix: 'EDITPLANIFDATE',
      color: 'amber',
      specificFields: ['planning_date', 'comment']
    },
    {
      label: 'Livraison DOE',
      key: 'Livraison DOE',
      description: 'Transmettre les documents d\'exécution des ouvrages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      prefix: 'DOEDOC',
      color: 'indigo',
      specificFields: [
        'cable_capacity',
        'gc_length',
        'ml_length_extension_cable',
        'ml_length_racco_cable_private_domain',
        'ml_length_racco_cable_public_domain',
        'pmv_validation_date',
        'submission_date',
        'comment'
      ]
    },
    {
      label: 'Livraison DFT',
      key: 'Livraison DFT',
      description: 'Transmettre les documents finaux de travaux',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      prefix: 'DFTDOC',
      color: 'violet',
      specificFields: [
        'enedis_validation_date',
        'orange_submission_date',
        'orange_validation_date',
        'pole_intervention',
        'comment'
      ]
    },
    
  ];

  // Configuration des champs pour chaque onglet
  const tabFieldsConfig = {};
  tabs.forEach(tab => {
    tabFieldsConfig[tab.key] = [...allFields, ...tab.specificFields];
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(name, value);
  };

  const isValidDecimal3 = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^\d+\.\d{3}$/.test(value);
  };

  // Fonction de validation du format de date YYYY-MM-DD
  const isValidDateFormat = (dateString) => {
    if (!dateString || dateString === '') return true;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // Fonction de validation du commentaire (min 3, max 250)
  const isValidComment = (comment) => {
    if (!comment || comment === '') return true;
    const length = comment.trim().length;
    return length >= 3 && length <= 250;
  };

  // Fonction pour échapper les guillemets dans une chaîne
  const escapeQuotes = (str) => {
    if (!str) return '';
    return str.replace(/"/g, '""');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentTab = tabs[activeTab].key;
    if (!currentTab) {
      setMessage('Veuillez sélectionner une action');
      return;
    }

    // Vérification que admin_bca et admin_rds sont présents
    if (!data.admin_bca) {
      setMessage('La référence BCA est obligatoire');
      toast.error('La référence BCA est obligatoire');
      return;
    }
    if (!data.admin_rds) {
      setMessage('La référence RDS est obligatoire');
      toast.error('La référence RDS est obligatoire');
      return;
    }

    // Liste de tous les champs de date à valider
    const dateFields = [
      'effective_date',
      'submission_date',
      'planning_date',
      'arc_ars_declaration_date',
      'enedis_order_start_date',
      'orange_order_start_date',
      'pmv_application_date',
      'pmv_validation_date',
      'third_party_order_start_date',
      'enedis_validation_date',
      'orange_submission_date',
      'orange_validation_date',
      'begin_client_wait',
      'client_wait_end',
      'order_date',
      'admin_order_date',
      'bca_sending_date'
    ];

    // Validation des dates
    for (const field of dateFields) {
      const value = data[field];
      if (value && !isValidDateFormat(value)) {
        const fieldLabel = field.replace(/_/g, ' ').toUpperCase();
        setMessage(`Le champ "${fieldLabel}" doit être au format YYYY-MM-DD`);
        toast.error(`Le champ "${fieldLabel}" doit être au format YYYY-MM-DD`);
        return;
      }
    }

    // Validation du commentaire si présent
    if (data.comment && !isValidComment(data.comment)) {
      setMessage('Le commentaire doit contenir entre 3 et 250 caractères');
      toast.error('Le commentaire doit contenir entre 3 et 250 caractères');
      return;
    }

    if (currentTab === 'Livré CR Client' && !ropFile) {
      setMessage('Le fichier ROP est obligatoire');
      return;
    }

    if (currentTab === 'Livraison DOE') {
      if (!cableShapeBpeFile) {
        setMessage('Le fichier Cable Shape BPE est obligatoire.');
        return;
      }
      if (!pmvClosureFile) {
        setMessage('Le fichier PMV Closure est obligatoire.');
        return;
      }

      if (!isValidDecimal3(data.gc_length)) {
        setMessage('La longueur GC doit être un nombre avec exactement 3 décimales (ex: 2.345).');
        return;
      }
      if (!isValidDecimal3(data.ml_length_extension_cable)) {
        setMessage("La longueur du câble d'extension doit être un nombre avec exactement 3 décimales.");
        return;
      }
      if (!isValidDecimal3(data.ml_length_racco_cable_private_domain)) {
        setMessage("La longueur en domaine privé doit être un nombre avec exactement 3 décimales.");
        return;
      }
      if (!isValidDecimal3(data.ml_length_racco_cable_public_domain)) {
        setMessage("La longueur en domaine public doit être un nombre avec exactement 3 décimales.");
        return;
      }
    }

    const commentFields = ['comment'];
    // Exclure bandwith et admin_contract des readOnlyFields pour qu'ils ne soient pas inclus dans le CSV
    const readOnlyFields = allFields.filter(field => field !== 'bandwith' && field !== 'admin_contract');

    const relevantFields = tabFieldsConfig[currentTab] || [];

    const modifiedData = relevantFields.reduce((acc, field) => {
      if (readOnlyFields.includes(field)) {
        acc[field] = '';
      } else {
        const value = data[field];
        if (value !== undefined && value !== null && value !== '') {
          acc[field] = value;
        }
      }
      return acc;
    }, {});

    // S'assurer que admin_bca et admin_rds sont toujours présents dans les données
    modifiedData.admin_bca = data.admin_bca;
    modifiedData.admin_rds = data.admin_rds;

    const prefix = tabs[activeTab].prefix;
    modifiedData.admin_prefix = prefix;

    const escapeCSVValue = (value, isCommentField) => {
      if (value == null) return '';
      let str = String(value);
      
      // Pour les champs de commentaire, toujours mettre entre guillemets et échapper les guillemets internes
      if (isCommentField) {
        // Échapper les guillemets doubles
        str = str.replace(/"/g, '""');
        // Retourner la valeur entre guillemets
        return `"${str}"`;
      }
      
      // Pour les autres champs, échapper seulement si nécessaire
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = relevantFields;
    const row = headers.map(header => {
      const isComment = commentFields.includes(header);
      let value = modifiedData[header];
      
      // S'assurer que le commentaire est bien traité
      if (isComment && value) {
        // Le commentaire sera automatiquement mis entre guillemets par escapeCSVValue
        return escapeCSVValue(value, true);
      }
      
      return modifiedData[header] !== undefined ? escapeCSVValue(modifiedData[header], isComment) : '';
    });

    const csvContent = `${headers.join(',')}\n${row.join(',')}`;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}`;

    const cleanForFilename = (str) => {
      if (!str?.toString().trim()) return 'inconnu';
      return str.toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-+|-+$)/g, '')
        .substring(0, 30);
    };

    const adminRds = cleanForFilename(data.admin_rds || 'RDS');
    const adminBcaRef = cleanForFilename(data.admin_bca || 'REFBCA');

    const csvFilename = `${prefix}_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.csv`;

    const formData = new FormData();
    formData.append('filename', csvFilename);
    formData.append('content', csvContent);
    formData.append('activeTab', currentTab);

    // Gestion des fichiers selon l'onglet
    if (currentTab === 'Livré CR Client' && ropFile) {
      const extension = ropFile.name.split('.').pop();
      const newRopFilename = `CRI_${adminRds}_${formattedDate}.${extension}`;
      const renamedRopFile = new File([ropFile], newRopFilename, { type: ropFile.type });
      formData.append('rop_travaux', renamedRopFile, newRopFilename);
    }

    if (currentTab === 'Livraison DOE') {
      const cableExtension = cableShapeBpeFile.name.split('.').pop();
      const newCableFilename = `DOE_${adminRds}_${adminBcaRef}_${formattedDate}.${cableExtension}`;
      const renamedCableFile = new File([cableShapeBpeFile], newCableFilename, { type: cableShapeBpeFile.type });
      formData.append('cable_shape_bpe', renamedCableFile, newCableFilename);

      const pmvExtension = pmvClosureFile.name.split('.').pop();
      const newPmvFilename = `DOEPMV_${adminRds}_${formattedDate}.${pmvExtension}`;
      const renamedPmvFile = new File([pmvClosureFile], newPmvFilename, { type: pmvClosureFile.type });
      formData.append('pmv_closure', renamedPmvFile, newPmvFilename);
    }

    if (currentTab === 'Livraison DFT') {
      if (supply) {
        const cableExtension = supply.name.split('.').pop();
        const newCableFilename = `DFT_GCB1_${adminRds}_${formattedDate}_${formattedTime}.${cableExtension}`;
        const renamedCableFile = new File([supply], newCableFilename, { type: supply.type });
        formData.append('supply_dft', renamedCableFile, newCableFilename);
      }

      if (supply2) {
        const pmvExtension = supply2.name.split('.').pop();
        const newPmvFilename = `DFT_GCB2_${adminRds}_${formattedDate}_${formattedTime}.${pmvExtension}`;
        const renamedPmvFile = new File([supply2], newPmvFilename, { type: supply2.type });
        formData.append('supply', renamedPmvFile, newPmvFilename);
      }

      if (!supply && !supply2) {
        setMessage('Au moins un fichier DFT doit être fourni.');
        return;
      }
    }

    try {
      await axios.post('/api/vt/upload-racco', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset des fichiers
      if (currentTab === 'Livré CR Client') setRopFile(null);
      if (currentTab === 'Livraison DOE') {
        setCableShapeBpeFile(null);
        setPmvClosureFile(null);
      }
      if (currentTab === 'Livraison DFT') {
        setSupplyFile(null);
        setSupplyFile2(null);
      }

      setCompletedTabs([...completedTabs, activeTab]);
      toast.success('Fichier déposé avec succès !');
      setMessage('Fichier déposé avec succès !');
    } catch (error) {
      console.error(error);
      setMessage("Une erreur est survenue lors de l'envoi.");
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
      emerald: {
        active: 'border-emerald-500 text-emerald-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        completed: 'border-green-500 text-green-600',
        bg: 'bg-emerald-50',
        ring: 'ring-emerald-200',
        gradient: 'from-emerald-50 to-green-50'
      },
      red: {
        active: 'border-red-500 text-red-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        completed: 'border-green-500 text-green-600',
        bg: 'bg-red-50',
        ring: 'ring-red-200',
        gradient: 'from-red-50 to-rose-50'
      },
      blue: {
        active: 'border-blue-500 text-blue-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        completed: 'border-green-500 text-green-600',
        bg: 'bg-blue-50',
        ring: 'ring-blue-200',
        gradient: 'from-blue-50 to-indigo-50'
      },
      amber: {
        active: 'border-amber-500 text-amber-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        completed: 'border-green-500 text-green-600',
        bg: 'bg-amber-50',
        ring: 'ring-amber-200',
        gradient: 'from-amber-50 to-yellow-50'
      },
      indigo: {
        active: 'border-indigo-500 text-indigo-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        completed: 'border-green-500 text-green-600',
        bg: 'bg-indigo-50',
        ring: 'ring-indigo-200',
        gradient: 'from-indigo-50 to-purple-50'
      },
      violet: {
        active: 'border-violet-500 text-violet-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        completed: 'border-green-500 text-green-600',
        bg: 'bg-violet-50',
        ring: 'ring-violet-200',
        gradient: 'from-violet-50 to-purple-50'
      },
      purple: {
        active: 'border-purple-500 text-purple-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        completed: 'border-green-500 text-green-600',
        bg: 'bg-purple-50',
        ring: 'ring-purple-200',
        gradient: 'from-purple-50 to-violet-50'
      }
    };
    return colors[color] || colors.blue;
  };

  // Composants réutilisables
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
    } catch {
      return dateString;
    }
  };

  // Section d'informations communes - UNE SEULE COLONNE
  const CommonInfoSection = () => (
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
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Date envoi BCA" value={formatDate(data.bca_sending_date)} />
          <InfoRow label="Chargé de production" value={data.covage_contact_name} />
        </div>
      </InfoCard>

      <InfoCard 
        title="Informations techniques" 
        gradient="from-purple-50 to-pink-50"
        icon={<svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>}
      >
        <div className="grid grid-cols-2 gap-4">
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
        <InfoRow label="POP" value={data.pop_name} />
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Début attente client" value={formatDate(data.begin_client_wait)} />
          <InfoRow label="Fin attente client" value={formatDate(data.client_wait_end)} />
        </div>
      </InfoCard>
    </div>
  );

  return (
    <Main user={auth.user}>
      <Head title="Raccordement" />
      <div className="max-w-full  mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4fbb6b] to-[#505D64] px-8 py-6">
            <h1 className="text-3xl font-bold text-white">
              Raccordement - {data.admin_bca || 'Nouvelle commande'}
            </h1>
            <p className="text-white/80 mt-1">
              Gérez les différentes étapes du raccordement
            </p>
          </div>

          {/* Tabs Navigation */}
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

          {/* Tab Description */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {tabs[activeTab].description}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8" encType="multipart/form-data">
            <CommonInfoSection />

            {/* Sections spécifiques par onglet - UNE SEULE COLONNE */}
            {tabs[activeTab].key === 'Livré CR Client' && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Livraison CR Client
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date effective de rdv <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="effective_date"
                      value={data.effective_date}
                      required
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de soumission <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="submission_date"
                      value={data.submission_date}
                      required
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPE installé
                    </label>
                    <select
                      name="cpe_installed"
                      value={data.cpe_installed}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="Oui">Oui</option>
                      <option value="Non">Non</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro d'opérateur CPE
                    </label>
                    <input
                      type="text"
                      name="cpe_operator_number"
                      value={data.cpe_operator_number}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder="Ex: 123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de série CPE client
                    </label>
                    <input
                      type="text"
                      name="client_cpe_serial"
                      value={data.client_cpe_serial}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder="Ex: SN123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compte rendu d'intervention <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-200 cursor-pointer group">
                        <input
                          type="file"
                          onChange={e => setRopFile(e.target.files[0])}
                          required
                          className="hidden"
                        />
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="mt-1 block text-sm text-gray-600 group-hover:text-emerald-600">Choisir un fichier</span>
                        </div>
                      </label>
                      {ropFile && (
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{ropFile.name}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment"
                      maxLength={250}
                      minLength={3}
                      value={data.comment}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder="Ajoutez un commentaire (3 à 250 caractères)..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Le commentaire doit contenir entre 3 et 250 caractères
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white"
                    >
                      <option value="">-- Sélectionner une raison --</option>
                      <option value="Appel vers le client effectué, en attente de retour">Appel vers le client effectué, en attente de retour</option>
                      <option value="Cas de force majeur">Cas de force majeur</option>
                      <option value="Demande d'annulation de la commande à l'initiative du Client">Demande d'annulation de la commande à l'initiative du Client</option>
                      <option value="Demande d'arrêté de circulation ou permission de voirie en cours">Demande d'arrêté de circulation ou permission de voirie en cours</option>
                      <option value="Evènement public">Evènement public</option>
                      <option value="Fermeture (annuelle) de l’entreprise ou exceptionnelle">Fermeture (annuelle) de l’entreprise ou exceptionnelle</option>
                      <option value="Gel réseau">Gel réseau</option>
                      <option value="Le Client est indisponible">Le Client est indisponible</option>
                      <option value="Le Client est injoignable">Le Client est injoignable</option>
                      <option value="Le Client ne sait pas">Le Client ne sait pas</option>
                      <option value="Le Client ne veut pas">Le Client ne veut pas</option>
                      <option value="Le contact Client a changé entre la VT et le raccordement">Le contact Client a changé entre la VT et le raccordement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment"
                      maxLength={250}
                      minLength={3}
                      value={data.comment}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                      placeholder="Décrivez les raisons de l'impossibilité (3 à 250 caractères)..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Le commentaire doit contenir entre 3 et 250 caractères
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tabs[activeTab].key === 'Planifier le raccordement' && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Planification du raccordement
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de déclaration ARC et ARS</label>
                    <input
                      type="date"
                      name="arc_ars_declaration_date"
                      value={data.arc_ars_declaration_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de dépôt étude ENEDIS</label>
                    <input
                      type="date"
                      name="enedis_order_start_date"
                      value={data.enedis_order_start_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Référence commande Orange</label>
                    <input
                      type="text"
                      name="orange_order_ref"
                      value={data.orange_order_ref}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Ex: ORD-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date soumission Orange</label>
                    <input
                      type="date"
                      name="orange_order_start_date"
                      value={data.orange_order_start_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date prévisionnelle de rdv <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="planning_date"
                      value={data.planning_date}
                      required
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de demande de PMV</label>
                    <input
                      type="date"
                      name="pmv_application_date"
                      value={data.pmv_application_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Raison sociale du tiers</label>
                    <input
                      type="text"
                      name="third_party_company_name"
                      value={data.third_party_company_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Nom de l'entreprise"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date soumission commande tiers</label>
                    <input
                      type="date"
                      name="third_party_order_start_date"
                      value={data.third_party_order_start_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment"
                      maxLength={250}
                      minLength={3}
                      value={data.comment}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Ajoutez un commentaire (3 à 250 caractères)..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Le commentaire doit contenir entre 3 et 250 caractères
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tabs[activeTab].key === 'EDITPLANIFDATE' && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modification de la date de planification
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouvelle date de planification <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="planning_date"
                      value={data.planning_date}
                      required
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motif de la modification</label>
                    <textarea
                      name="comment"
                      maxLength={250}
                      minLength={3}
                      value={data.comment}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      placeholder="Indiquez la raison du changement de date (3 à 250 caractères)..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Le commentaire doit contenir entre 3 et 250 caractères
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <p>Préfixe utilisé : EDITPLANIFDATE</p>
                </div>
              </div>
            )}

            {tabs[activeTab].key === 'Livraison DOE' && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Livraison DOE
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DOE Travaux avec Shape du câble <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 cursor-pointer group">
                        <input
                          type="file"
                          accept=".dbf,.shx,.shp,.dwg"
                          onChange={(e) => setCableShapeBpeFile(e.target.files[0])}
                          required
                          className="hidden"
                        />
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="mt-1 block text-sm text-gray-600 group-hover:text-indigo-600">Choisir un fichier</span>
                        </div>
                      </label>
                      {cableShapeBpeFile && (
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{cableShapeBpeFile.name}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacité en FO du câble d'extension</label>
                    <select
                      name="cable_capacity"
                      value={data.cable_capacity}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
                    >
                      <option value="">Sélectionnez...</option>
                      <option value="12">12</option>
                      <option value="24">24</option>
                      <option value="36">36</option>
                      <option value="48">48</option>
                      <option value="72">72</option>
                      <option value="96">96</option>
                      <option value="144">144</option>
                      <option value="288">288</option>
                      <option value="432">432</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longueur en ML de Génie Civil</label>
                    <input
                      type="number"
                      step="0.001"
                      name="gc_length"
                      value={data.gc_length}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="0.000"
                    />
                    {errors.gc_length && (
                      <p className="text-red-500 text-sm mt-1">{errors.gc_length}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longueur en ML de câble d'extension</label>
                    <input
                      type="number"
                      step="0.001"
                      name="ml_length_extension_cable"
                      value={data.ml_length_extension_cable}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="0.000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longueur en ML (domaine privé)</label>
                    <input
                      type="number"
                      step="0.001"
                      name="ml_length_racco_cable_private_domain"
                      value={data.ml_length_racco_cable_private_domain}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="0.000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longueur en ML (domaine public)</label>
                    <input
                      type="number"
                      step="0.001"
                      name="ml_length_racco_cable_public_domain"
                      value={data.ml_length_racco_cable_public_domain}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="0.000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date validation PMV</label>
                    <input
                      type="date"
                      name="pmv_validation_date"
                      value={data.pmv_validation_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de soumission <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="submission_date"
                      value={data.submission_date}
                      required
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fermeture PMV/chantier <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 cursor-pointer group">
                        <input
                          type="file"
                          accept=".doc,.pdf,.docx"
                          onChange={(e) => setPmvClosureFile(e.target.files[0])}
                          required
                          className="hidden"
                        />
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="mt-1 block text-sm text-gray-600 group-hover:text-indigo-600">Choisir un fichier</span>
                        </div>
                      </label>
                      {pmvClosureFile && (
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{pmvClosureFile.name}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire libre DOE</label>
                    <textarea
                      name="comment"
                      maxLength={250}
                      minLength={3}
                      value={data.comment}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Ajoutez un commentaire (3 à 250 caractères)..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Le commentaire doit contenir entre 3 et 250 caractères
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tabs[activeTab].key === 'Livraison DFT' && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Livraison DFT
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date validation Enedis</label>
                    <input
                      type="date"
                      name="enedis_validation_date"
                      value={data.enedis_validation_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date validation DFT Orange (GCB2)</label>
                    <input
                      type="date"
                      name="orange_submission_date"
                      value={data.orange_submission_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date prévisionnelle de rdv</label>
                    <input
                      type="date"
                      name="orange_validation_date"
                      value={data.orange_validation_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intervention poteau Orange</label>
                    <select
                      name="pole_intervention"
                      value={data.pole_intervention}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition bg-white"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="Remplacement">Remplacement</option>
                      <option value="Renforcement">Renforcement</option>
                      <option value="Création">Création</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fourniture du DFT GCB1 Orange</label>
                    <div className="flex items-center space-x-3">
                      <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-violet-400 hover:bg-violet-50/50 transition-all duration-200 cursor-pointer group">
                        <input
                          type="file"
                          accept=".zip"
                          onChange={(e) => setSupplyFile(e.target.files[0])}
                          className="hidden"
                        />
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="mt-1 block text-sm text-gray-600 group-hover:text-violet-600">Choisir un fichier</span>
                        </div>
                      </label>
                      {supply && (
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{supply.name}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fourniture du GCB2 Orange</label>
                    <div className="flex items-center space-x-3">
                      <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-violet-400 hover:bg-violet-50/50 transition-all duration-200 cursor-pointer group">
                        <input
                          type="file"
                          accept=".zip"
                          onChange={(e) => setSupplyFile2(e.target.files[0])}
                          className="hidden"
                        />
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="mt-1 block text-sm text-gray-600 group-hover:text-violet-600">Choisir un fichier</span>
                        </div>
                      </label>
                      {supply2 && (
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{supply2.name}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment"
                      maxLength={250}
                      minLength={3}
                      value={data.comment}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                      placeholder="Ajoutez un commentaire (3 à 250 caractères)..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Le commentaire doit contenir entre 3 et 250 caractères
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#4fbb6b] to-[#3da856] hover:from-[#3da856] hover:to-[#2d8f40] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                {tabs[activeTab].key === 'Livré CR Client' && 'Valider la livraison'}
                {tabs[activeTab].key === 'Impossibilité' && 'Enregistrer l\'impossibilité'}
                {tabs[activeTab].key === 'Planifier le raccordement' && 'Confirmer la planification'}
                {tabs[activeTab].key === 'EDITPLANIFDATE' && 'Modifier la date'}
                {tabs[activeTab].key === 'Livraison DOE' && 'Valider la livraison DOE'}
                {tabs[activeTab].key === 'Livraison DFT' && 'Valider la livraison DFT'}
              </button>
            </div>

            {/* Message de notification */}
            {message && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-start animate-slide-down ${
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  )}
                </svg>
                <span>{message}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </Main>
  );
}
