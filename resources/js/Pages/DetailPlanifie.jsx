import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import axios from 'axios';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

export default function DetailPlanifie({ auth, order, filename, fileInfo }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('edit');
  const [ropFile, setRopFile] = useState(null);
  const [synoptiqueFile, setSynoptiqueFile] = useState(null);
  const [routeFile, setRouteFile] = useState(null);
  
  // ✅ S'assurer que les champs obligatoires sont toujours remplis
  const { data, setData } = useForm({
    // Informations de la commande (lecture seule)
    address_site_a_name: order?.address_site_a_name || '',
    address_site_a_postal: order?.address_site_a_postal || '',
    address_site_a_street: order?.address_site_a_street || '',
    address_site_a_town: order?.address_site_a_town || '',
    address_site_a_x: order?.address_site_a_x || '',
    address_site_a_y: order?.address_site_a_y || '',
    insee_code: order?.insee_code || '',
    
    // ✅ CHAMPS OBLIGATOIRES - toujours remplis
    admin_bca: order?.admin_bca || '',
    admin_prefix: order?.admin_prefix || '',
    admin_rds: order?.admin_rds || '',
    admin_contract: order?.admin_contract || '',
    
    bandwith: order?.bandwith || '',
    bpe_piquage: order?.bpe_piquage || '',
    bca_sending_date: order?.bca_sending_date || '',
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
    equipement_number: order?.equipement_number || '',
    mer_number: order?.mer_number || '',
    client_wait_end: order?.client_wait_end || '',
    begin_client_wait: order?.begin_client_wait || '',
    article_designation: order?.article_designation || '',
    // Champs pour Edit Planif date
    planning_date: order?.planning_date || '',
    comment_edit: '',
    // Champs pour Livré CRVT
    infra_to_be_created: '',
    effective_date: '',
    result_status: '',
    submission_date: '',
    comment_livraison: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(name, value);
  };

  const isValidDateFormat = (dateString) => {
    if (!dateString || dateString === '') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const isValidComment = (comment) => {
    if (!comment || comment === '') return true;
    return comment.trim().length <= 250;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

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

  // Soumission pour Edit Planif date
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Vérifier les champs obligatoires
    if (!validateRequiredFields()) {
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(true);

    const currentPlanningDate = data.planning_date;
    
    if (!currentPlanningDate) {
      toast.error('La date de planification est obligatoire');
      setIsSubmitting(false);
      return;
    }

    if (!isValidDateFormat(currentPlanningDate)) {
      toast.error('La date doit être au format YYYY-MM-DD');
      setIsSubmitting(false);
      return;
    }

    if (data.comment_edit && !isValidComment(data.comment_edit)) {
      toast.error('Le commentaire ne doit pas dépasser 250 caractères');
      setIsSubmitting(false);
      return;
    }

    const today = new Date();
    const formattedDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('');
    const formattedTime = [
      String(today.getHours()).padStart(2, '0'),
      String(today.getMinutes()).padStart(2, '0')
    ].join('');

    const readOnlyFields = [
      'address_site_a_name', 'address_site_a_postal', 'address_site_a_street',
      'address_site_a_town', 'address_site_a_x', 'address_site_a_y',
      'bandwith', 'bca_sending_date', 'building_code', 'admin_contract',
      'client_directive_access', 'client_directive_intervention',
      'client_directive_planning', 'contact_on_site_firstname',
      'contact_on_site_lastname', 'contact_on_site_mail', 'contact_on_site_phone',
      'covage_contact_name', 'covage_contact_mail', 'covage_contact_phone',
      'network', 'nro_name', 'nro_port', 'offer', 'oi_reference',
      'operator_client_ref', 'operator_name', 'order_date', 'bpe_piquage',
      'project_name', 'rop_ref', 'techno', 'equipement_number', 'mer_number',
      'client_wait_end', 'begin_client_wait', 'insee_code', 'article_designation'
    ];

    // ✅ S'assurer que admin_rds, admin_bca, admin_prefix sont inclus
    const allData = {
      ...data,
      admin_bca: data.admin_bca,  // Déjà rempli
      admin_rds: data.admin_rds,  // Déjà rempli
      admin_prefix: 'EDITPLANIFDATE',
      planning_date: currentPlanningDate,
      comment: data.comment_edit,
    };

    const allFields = Object.keys(allData);
    const headers = allFields.filter(field => {
      const value = allData[field];
      return (
        !readOnlyFields.includes(field) &&
        value !== undefined &&
        value !== null &&
        value !== ''
      );
    });

    // ✅ Vérifier que les champs obligatoires sont dans les headers
    const requiredHeaders = ['admin_rds', 'admin_bca', 'admin_prefix'];
    requiredHeaders.forEach(header => {
      if (!headers.includes(header)) {
        headers.push(header);
      }
    });

    const escapeCSVValue = (value, isCommentField) => {
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
    
    const row = headers.map(header => {
      const isComment = commentFields.includes(header);
      const value = allData[header];
      return escapeCSVValue(value, isComment);
    });

    const csvContent = `${headers.join(',')}\n${row.join(',')}`;

    const cleanForFilename = (str) => {
      if (!str?.toString().trim()) return 'inconnu';
      return str.toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-+|-+$)/g, '')
        .substring(0, 30);
    };

    // ✅ Utiliser les valeurs existantes pour les noms de fichiers
    const adminRds = cleanForFilename(data.admin_rds || 'RDS');
    const adminBcaRef = cleanForFilename(data.admin_bca || 'REFBCA');

    const csvFilename = `EDITPLANIFDATE_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.csv`;
    const zipFilename = `EDITPLANIFDATE_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.zip`;

    try {
      const zip = new JSZip();
      zip.file(csvFilename, csvContent);
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const formData = new FormData();
      formData.append('zipFile', zipBlob, zipFilename);
      formData.append('activeTab', 'Edit Planif date');
      formData.append('planning_date', currentPlanningDate);
      formData.append('comment', data.comment_edit || '');
      // ✅ Ajouter les champs obligatoires au formData
      formData.append('admin_rds', data.admin_rds);
      formData.append('admin_bca', data.admin_bca);
      formData.append('admin_prefix', 'EDITPLANIFDATE');

      const response = await axios.post('/api/vt/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Date de planification modifiée avec succès !');
      setMessage('Date de planification modifiée avec succès !');
      setData('planning_date', '');
      setData('comment_edit', '');
      
    } catch (error) {
      console.error('Erreur:', error);
      let errorMessage = "Une erreur est survenue lors de l'envoi.";
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      }
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soumission pour Livré CRVT
  const handleLivraisonSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Vérifier les champs obligatoires
    if (!validateRequiredFields()) {
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(true);

    if (!ropFile || !synoptiqueFile || !routeFile) {
      setMessage('Tous les fichiers sont obligatoires');
      toast.error('Tous les fichiers sont obligatoires');
      setIsSubmitting(false);
      return;
    }

    if (!data.effective_date) {
      toast.error('La date effective est obligatoire');
      setIsSubmitting(false);
      return;
    }

    if (!data.submission_date) {
      toast.error('La date de soumission est obligatoire');
      setIsSubmitting(false);
      return;
    }

    const today = new Date();
    const formattedDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('');
    const formattedTime = [
      String(today.getHours()).padStart(2, '0'),
      String(today.getMinutes()).padStart(2, '0')
    ].join('');

    const readOnlyFields = [
      'address_site_a_name', 'address_site_a_postal', 'address_site_a_street',
      'address_site_a_town', 'address_site_a_x', 'address_site_a_y',
      'bandwith', 'bca_sending_date', 'building_code', 'admin_contract', 'admin_prefix',
      'admin_rds', 'client_directive_access', 'client_directive_intervention',
      'client_directive_planning', 'contact_on_site_firstname',
      'contact_on_site_lastname', 'contact_on_site_mail', 'contact_on_site_phone',
      'covage_contact_name', 'covage_contact_mail', 'covage_contact_phone',
      'network', 'nro_name', 'nro_port', 'offer', 'oi_reference',
      'operator_client_ref', 'operator_name', 'order_date', 'bpe_piquage',
      'project_name', 'rop_ref', 'techno', 'equipement_number', 'mer_number',
      'client_wait_end', 'begin_client_wait', 'insee_code', 'article_designation'
    ];

    // ✅ S'assurer que admin_rds, admin_bca, admin_prefix sont inclus
    const allData = {
      ...data,
      admin_bca: data.admin_bca,  // Déjà rempli
      admin_rds: data.admin_rds,  // Déjà rempli
      admin_prefix: 'CRVTCLI',
      effective_date: data.effective_date,
      submission_date: data.submission_date,
      result_status: data.result_status,
      infra_to_be_created: data.infra_to_be_created,
      comment: data.comment_livraison,
    };

    const allFields = Object.keys(allData);
    const headers = allFields.filter(field => {
      const value = allData[field];
      return (
        !readOnlyFields.includes(field) &&
        value !== undefined &&
        value !== null &&
        value !== ''
      );
    });

    // ✅ Vérifier que les champs obligatoires sont dans les headers
    const requiredHeaders = ['admin_rds', 'admin_bca', 'admin_prefix'];
    requiredHeaders.forEach(header => {
      if (!headers.includes(header)) {
        headers.push(header);
      }
    });

    const escapeCSVValue = (value, isCommentField) => {
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
    
    const row = headers.map(header => {
      const isComment = commentFields.includes(header);
      const value = allData[header];
      return escapeCSVValue(value, isComment);
    });

    const csvContent = `${headers.join(',')}\n${row.join(',')}`;

    const cleanForFilename = (str) => {
      if (!str?.toString().trim()) return 'inconnu';
      return str.toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-+|-+$)/g, '')
        .substring(0, 30);
    };

    // ✅ Utiliser les valeurs existantes pour les noms de fichiers
    const adminRds = cleanForFilename(data.admin_rds || 'RDS');
    const adminBcaRef = cleanForFilename(data.admin_bca || 'REFBCA');

    const csvFilename = `CRVTCLI_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.csv`;
    const zipFilename = `CRVTCLI_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.zip`;

    const zip = new JSZip();
    zip.file(csvFilename, csvContent);
    
    // Ajouter les fichiers
    const ropExtension = ropFile.name.split('.').pop();
    const synoptiqueExtension = synoptiqueFile.name.split('.').pop();
    const routeExtension = routeFile.name.split('.').pop();
    
    zip.file(`CRVTCLI_${adminRds}_${formattedDate}.${ropExtension}`, ropFile);
    zip.file(`DEVIS_${adminRds}_${formattedDate}.${synoptiqueExtension}`, synoptiqueFile);
    zip.file(`ROP_${adminBcaRef}_${adminRds}_${formattedDate}_V1.${routeExtension}`, routeFile);

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const formData = new FormData();
      formData.append('zipFile', zipBlob, zipFilename);
      formData.append('activeTab', 'Livré CRVT');
      // ✅ Ajouter les champs obligatoires au formData
      formData.append('admin_rds', data.admin_rds);
      formData.append('admin_bca', data.admin_bca);
      formData.append('admin_prefix', 'CRVTCLI');

      const response = await axios.post('/api/vt/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('CRVT livré avec succès !');
      setMessage('CRVT livré avec succès !');
      
      // Reset des fichiers
      setRopFile(null);
      setSynoptiqueFile(null);
      setRouteFile(null);
      setData('effective_date', '');
      setData('submission_date', '');
      setData('result_status', '');
      setData('infra_to_be_created', '');
      setData('comment_livraison', '');
      
    } catch (error) {
      console.error('Erreur:', error);
      let errorMessage = "Une erreur est survenue lors de l'envoi.";
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      }
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (reste du code identique pour les sections d'affichage)
  
  // Pour éviter de répéter tout le code, je garde la suite inchangée
  // Les sections d'affichage (sections, InfoRow, etc.) restent identiques
  
  if (!order) {
    return (
      <Main user={auth.user}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Commande non trouvée</h2>
              <p className="text-gray-600">La commande que vous recherchez n'existe pas.</p>
            </div>
          </div>
        </div>
      </Main>
    );
  }

  // Sections d'informations (inchangées)
  const sections = [
    // ... (contenu inchangé)
  ];

  const InfoRow = ({ label, value, type = 'text' }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type="text"
        value={type === 'date' ? formatDate(value) : value || '-'}
        readOnly
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm"
      />
    </div>
  );

  return (
    <Main user={auth.user}>
      <Head title="VT Planifiée - Détails" />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header - affichage des infos obligatoires */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.visit('/Dashboard')}
                className="group flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:shadow-lg hover:border-[#46BA68] transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </button>

              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-[#46BA68] to-[#515E65] bg-clip-text text-transparent">
                    VT Planifiée
                  </span>
                </h1>
                <p className="text-gray-600">Gérez la modification de date et la livraison du CRVT</p>
              </div>

              <div className="w-24"></div>
            </div>
          </div>

          {/* ✅ Bannière d'information avec affichage des identifiants obligatoires */}
          <div className="mb-8">
            <div className="relative overflow-hidden bg-gradient-to-r from-[#46BA68] to-[#515E65] rounded-2xl shadow-xl">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">
                          Référence BCA: <span className="font-bold text-yellow-300">{data.admin_bca || 'NON DEFINI'}</span>
                        </h2>
                        <p className="text-white/80 mt-1">
                          RDS: {data.admin_rds || 'NON DEFINI'} | Préfixe: {data.admin_prefix || 'NON DEFINI'}
                        </p>
                      </div>
                    </div>
                    {fileInfo?.formatted_date && (
                      <p className="text-white/70 text-sm mt-1">
                        Date planifiée: {fileInfo.formatted_date} {fileInfo.formatted_time ? `à ${fileInfo.formatted_time}` : ''}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">VT Planifiée</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          

          {/* Onglets de navigation */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveSection('edit')}
                className={`py-4 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeSection === 'edit'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier la date
                </div>
              </button>
              <button
                onClick={() => setActiveSection('livraison')}
                className={`py-4 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeSection === 'livraison'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Livrer CRVT
                </div>
              </button>
            </nav>
          </div>

          {/* Section Modifier la date */}
          {activeSection === 'edit' && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-lg border border-amber-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-100 to-yellow-100 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-200 rounded-lg">
                      <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Modifier la date de planification
                    </h3>
                    <span className="px-2 py-1 text-xs bg-amber-200 text-amber-800 rounded-full">
                      Préfixe: EDITPLANIFDATE
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouvelle date de planification <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="planning_date"
                        value={data.planning_date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Format: YYYY-MM-DD (ex: 2024-03-25)
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motif de la modification <span className="text-gray-400 text-xs">(optionnel, max 250 caractères)</span>
                      </label>
                      <textarea
                        name="comment_edit"
                        value={data.comment_edit}
                        onChange={handleChange}
                        rows="3"
                        maxLength={250}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-y"
                        placeholder="Indiquez la raison du changement de date..."
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {data.comment_edit?.length || 0}/250 caractères
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleEditSubmit}
                      disabled={isSubmitting}
                      className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isSubmitting ? 'Envoi en cours...' : 'Modifier la date'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Livrer CRVT */}
          {activeSection === 'livraison' && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-200 rounded-lg">
                      <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Livraison du CRVT
                    </h3>
                    <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">
                      Préfixe: CRVTCLI
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Résultat du Compte-Rendu
                      </label>
                      <select
                        name="result_status"
                        value={data.result_status}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <option value="">-- Sélectionner une option --</option>
                        <option value="Blocage privé">Blocage privé</option>
                        <option value="Blocage publique">Blocage publique</option>
                        <option value="Blocage privé et public">Blocage privé et public</option>
                        <option value="Pas de blocage">Pas de blocage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de soumission <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="submission_date"
                        value={data.submission_date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date effective <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="effective_date"
                        value={data.effective_date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Infrastructure à créer
                      </label>
                      <select
                        name="infra_to_be_created"
                        value={data.infra_to_be_created}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <option value="">-- Sélectionner --</option>
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
                      </select>
                    </div>
                  </div>

                  {/* Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Devis d'attachement
                      </label>
                      <div className="flex items-center space-x-3">
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50/50 cursor-pointer group">
                          <input 
                            type="file" 
                            onChange={e => setRopFile(e.target.files[0])}
                            className="hidden" 
                          />
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="mt-1 block text-sm text-gray-600 group-hover:text-green-600">Choisir un fichier</span>
                          </div>
                        </label>
                        {ropFile && (
                          <span className="text-sm text-gray-600 truncate max-w-[150px]">{ropFile.name}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CR VT Client <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50/50 cursor-pointer group">
                          <input 
                            type="file" 
                            onChange={e => setSynoptiqueFile(e.target.files[0])}
                            required
                            className="hidden" 
                          />
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="mt-1 block text-sm text-gray-600 group-hover:text-green-600">Choisir un fichier</span>
                          </div>
                        </label>
                        {synoptiqueFile && (
                          <span className="text-sm text-gray-600 truncate max-w-[150px]">{synoptiqueFile.name}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Route optique <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50/50 cursor-pointer group">
                          <input 
                            type="file" 
                            onChange={e => setRouteFile(e.target.files[0])}
                            required
                            className="hidden" 
                          />
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="mt-1 block text-sm text-gray-600 group-hover:text-green-600">Choisir un fichier</span>
                          </div>
                        </label>
                        {routeFile && (
                          <span className="text-sm text-gray-600 truncate max-w-[150px]">{routeFile.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment_livraison"
                      value={data.comment_livraison}
                      onChange={handleChange}
                      rows="3"
                      maxLength={250}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Ajoutez un commentaire si nécessaire..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {data.comment_livraison?.length || 0}/250 caractères
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleLivraisonSubmit}
                      disabled={isSubmitting}
                      className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {isSubmitting ? 'Envoi en cours...' : 'Livrer le CRVT'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Détails de la commande */}
          <details className="mb-8" open>
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-[#46BA68] transition-colors">
              📋 Détails complets de la commande
            </summary>
            <div className="mt-4 space-y-4">
              {sections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#46BA68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                      </svg>
                      <h4 className="font-medium text-gray-700">{section.title}</h4>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.fields.map((field) => (
                      <InfoRow
                        key={field.name}
                        label={field.label}
                        value={data[field.name]}
                        type={field.type}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* Message de statut */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-xl animate-slideUp ${
                message.includes('succès')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {message.includes('succès') ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
          
        
    </Main>
  );
}
