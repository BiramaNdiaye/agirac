// resources/js/Pages/DetailRaccoPlanifie.jsx

import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import axios from 'axios';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

export default function DetailRaccoPlanifie({ auth, order, filename, fileInfo }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('edit'); // 'edit', 'crclient', 'doe', 'dft'
  
  // États pour les fichiers
  const [ropFile, setRopFile] = useState(null); // Pour CR Client
  const [cableShapeBpeFile, setCableShapeBpeFile] = useState(null); // Pour DOE
  const [pmvClosureFile, setPmvClosureFile] = useState(null); // Pour DOE
  const [supply, setSupplyFile] = useState(null); // Pour DFT
  const [supply2, setSupplyFile2] = useState(null); // Pour DFT
  
  const { data, setData } = useForm({
    // Informations de la commande (lecture seule)
    address_site_a_name: order?.address_site_a_name || '',
    address_site_a_postal: order?.address_site_a_postal || '',
    address_site_a_street: order?.address_site_a_street || '',
    address_site_a_town: order?.address_site_a_town || '',
    address_site_a_x: order?.address_site_a_x || '',
    address_site_a_y: order?.address_site_a_y || '',
    insee_code: order?.insee_code || '',
    admin_bca: order?.admin_bca || '',
    admin_prefix: order?.admin_prefix || '',
    admin_contract: order?.admin_contract || '',
    admin_rds: order?.admin_rds || '',
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
    // Champs pour Livré CR Client
    effective_date: '',
    submission_date: '',
    comment_crclient: '',
    cpe_installed: '',
    cpe_operator_number: '',
    client_cpe_serial: '',
    // Champs pour Livraison DOE
    cable_capacity: '',
    gc_length: '',
    ml_length_extension_cable: '',
    ml_length_racco_cable_private_domain: '',
    ml_length_racco_cable_public_domain: '',
    pmv_validation_date: '',
    submission_date_doe: '',
    comment_doe: '',
    // Champs pour Livraison DFT
    enedis_validation_date: '',
    orange_submission_date: '',
    orange_validation_date: '',
    pole_intervention: '',
    comment_dft: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(name, value);
  };

  // Fonctions de validation
  const isValidDateFormat = (dateString) => {
    if (!dateString || dateString === '') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const isValidDecimal3 = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^\d+\.\d{3}$/.test(value);
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

  // Soumission pour Edit Planif date
  const handleEditSubmit = async (e) => {
    e.preventDefault();
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

    const allData = {
      ...data,
      admin_bca: order?.admin_bca,
      admin_rds: order?.admin_rds,
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

      await axios.post('/api/vt/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Date de planification modifiée avec succès !');
      setMessage('Date de planification modifiée avec succès !');
      setData('planning_date', '');
      setData('comment_edit', '');
      
    } catch (error) {
      console.error('Erreur:', error);
      let errorMessage = "Une erreur est survenue lors de l'envoi.";
      if (error.response?.status === 413) {
        errorMessage = "Fichier trop volumineux - taille maximale 10MB";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soumission pour Livré CR Client
  const handleCrClientSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!ropFile) {
      setMessage('Le fichier ROP est obligatoire');
      toast.error('Le fichier ROP est obligatoire');
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

    const allData = {
      ...data,
      admin_bca: order?.admin_bca,
      admin_rds: order?.admin_rds,
      admin_prefix: 'CRIDOCCLI',
      effective_date: data.effective_date,
      submission_date: data.submission_date,
      cpe_installed: data.cpe_installed,
      cpe_operator_number: data.cpe_operator_number,
      client_cpe_serial: data.client_cpe_serial,
      comment: data.comment_crclient,
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

    const adminRds = cleanForFilename(data.admin_rds || 'RDS');
    const adminBcaRef = cleanForFilename(data.admin_bca || 'REFBCA');

    const csvFilename = `CRIDOCCLI_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.csv`;
    const zipFilename = `CRIDOCCLI_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.zip`;

    const zip = new JSZip();
    zip.file(csvFilename, csvContent);
    
    // Ajouter le fichier ROP
    const ropExtension = ropFile.name.split('.').pop();
    zip.file(`CRI_${adminRds}_${formattedDate}.${ropExtension}`, ropFile);

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const formData = new FormData();
      formData.append('zipFile', zipBlob, zipFilename);
      formData.append('activeTab', 'Livré CR Client');

      await axios.post('/api/vt/upload-racco', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('CR Client livré avec succès !');
      setMessage('CR Client livré avec succès !');
      
      // Reset
      setRopFile(null);
      setData('effective_date', '');
      setData('submission_date', '');
      setData('cpe_installed', '');
      setData('cpe_operator_number', '');
      setData('client_cpe_serial', '');
      setData('comment_crclient', '');
      
    } catch (error) {
      console.error('Erreur:', error);
      let errorMessage = "Une erreur est survenue lors de l'envoi.";
      if (error.response?.status === 413) {
        errorMessage = "Fichier trop volumineux - taille maximale 10MB";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soumission pour Livraison DOE
  const handleDoeSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!cableShapeBpeFile) {
      setMessage('Le fichier Cable Shape BPE est obligatoire.');
      toast.error('Le fichier Cable Shape BPE est obligatoire.');
      setIsSubmitting(false);
      return;
    }
    if (!pmvClosureFile) {
      setMessage('Le fichier PMV Closure est obligatoire.');
      toast.error('Le fichier PMV Closure est obligatoire.');
      setIsSubmitting(false);
      return;
    }

    if (!isValidDecimal3(data.gc_length)) {
      setMessage('La longueur GC doit être un nombre avec exactement 3 décimales (ex: 2.345).');
      toast.error('Format invalide pour la longueur GC');
      setIsSubmitting(false);
      return;
    }
    if (!isValidDecimal3(data.ml_length_extension_cable)) {
      setMessage("La longueur du câble d'extension doit être un nombre avec exactement 3 décimales.");
      setIsSubmitting(false);
      return;
    }
    if (!isValidDecimal3(data.ml_length_racco_cable_private_domain)) {
      setMessage("La longueur en domaine privé doit être un nombre avec exactement 3 décimales.");
      setIsSubmitting(false);
      return;
    }
    if (!isValidDecimal3(data.ml_length_racco_cable_public_domain)) {
      setMessage("La longueur en domaine public doit être un nombre avec exactement 3 décimales.");
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

    const allData = {
      ...data,
      admin_bca: order?.admin_bca,
      admin_rds: order?.admin_rds,
      admin_prefix: 'DOEDOC',
      cable_capacity: data.cable_capacity,
      gc_length: data.gc_length,
      ml_length_extension_cable: data.ml_length_extension_cable,
      ml_length_racco_cable_private_domain: data.ml_length_racco_cable_private_domain,
      ml_length_racco_cable_public_domain: data.ml_length_racco_cable_public_domain,
      pmv_validation_date: data.pmv_validation_date,
      submission_date: data.submission_date_doe,
      comment: data.comment_doe,
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

    const adminRds = cleanForFilename(data.admin_rds || 'RDS');
    const adminBcaRef = cleanForFilename(data.admin_bca || 'REFBCA');

    const csvFilename = `DOEDOC_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.csv`;
    const zipFilename = `DOEDOC_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.zip`;

    const zip = new JSZip();
    zip.file(csvFilename, csvContent);
    
    // Ajouter les fichiers
    const cableExtension = cableShapeBpeFile.name.split('.').pop();
    zip.file(`DOE_${adminRds}_${adminBcaRef}_${formattedDate}.${cableExtension}`, cableShapeBpeFile);
    
    const pmvExtension = pmvClosureFile.name.split('.').pop();
    zip.file(`DOEPMV_${adminRds}_${formattedDate}.${pmvExtension}`, pmvClosureFile);

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const formData = new FormData();
      formData.append('zipFile', zipBlob, zipFilename);
      formData.append('activeTab', 'Livraison DOE');

      await axios.post('/api/vt/upload-racco', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('DOE livré avec succès !');
      setMessage('DOE livré avec succès !');
      
      // Reset
      setCableShapeBpeFile(null);
      setPmvClosureFile(null);
      setData('cable_capacity', '');
      setData('gc_length', '');
      setData('ml_length_extension_cable', '');
      setData('ml_length_racco_cable_private_domain', '');
      setData('ml_length_racco_cable_public_domain', '');
      setData('pmv_validation_date', '');
      setData('submission_date_doe', '');
      setData('comment_doe', '');
      
    } catch (error) {
      console.error('Erreur:', error);
      let errorMessage = "Une erreur est survenue lors de l'envoi.";
      if (error.response?.status === 413) {
        errorMessage = "Fichier trop volumineux - taille maximale 10MB";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soumission pour Livraison DFT
  const handleDftSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!supply && !supply2) {
      setMessage('Au moins un fichier DFT doit être fourni.');
      toast.error('Au moins un fichier DFT doit être fourni.');
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

    const allData = {
      ...data,
      admin_bca: order?.admin_bca,
      admin_rds: order?.admin_rds,
      admin_prefix: 'DFTDOC',
      enedis_validation_date: data.enedis_validation_date,
      orange_submission_date: data.orange_submission_date,
      orange_validation_date: data.orange_validation_date,
      pole_intervention: data.pole_intervention,
      comment: data.comment_dft,
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

    const adminRds = cleanForFilename(data.admin_rds || 'RDS');
    const adminBcaRef = cleanForFilename(data.admin_bca || 'REFBCA');

    const csvFilename = `DFTDOC_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.csv`;
    const zipFilename = `DFTDOC_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.zip`;

    const zip = new JSZip();
    zip.file(csvFilename, csvContent);
    
    // Ajouter les fichiers
    if (supply) {
      const cableExtension = supply.name.split('.').pop();
      zip.file(`DFT_GCB1_${adminRds}_${formattedDate}_${formattedTime}.${cableExtension}`, supply);
    }
    if (supply2) {
      const pmvExtension = supply2.name.split('.').pop();
      zip.file(`DFT_GCB2_${adminRds}_${formattedDate}_${formattedTime}.${pmvExtension}`, supply2);
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const formData = new FormData();
      formData.append('zipFile', zipBlob, zipFilename);
      formData.append('activeTab', 'Livraison DFT');

      await axios.post('/api/vt/upload-racco', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('DFT livré avec succès !');
      setMessage('DFT livré avec succès !');
      
      // Reset
      setSupplyFile(null);
      setSupplyFile2(null);
      setData('enedis_validation_date', '');
      setData('orange_submission_date', '');
      setData('orange_validation_date', '');
      setData('pole_intervention', '');
      setData('comment_dft', '');
      
    } catch (error) {
      console.error('Erreur:', error);
      let errorMessage = "Une erreur est survenue lors de l'envoi.";
      if (error.response?.status === 413) {
        errorMessage = "Fichier trop volumineux - taille maximale 10MB";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Sections d'informations
  const sections = [
    {
      title: "📍 Adresse du site",
      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
      fields: [
        { name: 'address_site_a_name', label: 'Nom du site' },
        { name: 'address_site_a_postal', label: 'Code postal' },
        { name: 'address_site_a_street', label: 'Rue' },
        { name: 'address_site_a_town', label: 'Ville' },
        { name: 'address_site_a_x', label: 'Coordonnée X' },
        { name: 'address_site_a_y', label: 'Coordonnée Y' },
        { name: 'building_code', label: 'Code bâtiment' },
        { name: 'insee_code', label: 'Code INSEE' }
      ]
    },
    {
      title: "👤 Informations client",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      fields: [
        { name: 'operator_name', label: 'Nom opérateur' },
        { name: 'operator_client_ref', label: 'Réf. client opérateur' },
        { name: 'project_name', label: 'Nom du projet' },
        { name: 'contact_on_site_firstname', label: 'Prénom contact' },
        { name: 'contact_on_site_lastname', label: 'Nom contact' },
        { name: 'contact_on_site_mail', label: 'Email contact' },
        { name: 'contact_on_site_phone', label: 'Téléphone contact' }
      ]
    },
    {
      title: "🏢 Informations Covage",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      fields: [
        { name: 'covage_contact_name', label: 'Nom contact' },
        { name: 'covage_contact_mail', label: 'Email contact' },
        { name: 'covage_contact_phone', label: 'Téléphone contact' },
        { name: 'admin_bca', label: 'Référence BCA' },
        { name: 'admin_prefix', label: 'Préfixe administratif' },
        { name: 'admin_rds', label: 'RDS' },
        { name: 'rop_ref', label: 'Réf. ROP' },
        { name: 'oi_reference', label: 'Référence OI' },
        { name: 'bca_sending_date', label: "Date d'envoi BCA", type: 'date' }
      ]
    },
    {
      title: "🌐 Réseaux et technologie",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      fields: [
        { name: 'network', label: 'Réseau' },
        { name: 'techno', label: 'Technologie' },
        { name: 'offer', label: 'Offre' },
        { name: 'bandwith', label: 'Bande passante' },
        { name: 'pop_name', label: 'Nom POP' },
        { name: 'nro_name', label: 'Nom NRO' },
        { name: 'nro_port', label: 'Port NRO' },
        { name: 'order_date', label: 'Date de commande', type: 'date' }
      ]
    },
    {
      title: "⚙️ Équipement",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      fields: [
        { name: 'equipement_number', label: "Numéro d'équipement" },
        { name: 'mer_number', label: 'Numéro MER' },
        { name: 'article_designation', label: 'Désignation article' },
        { name: 'bpe_piquage', label: 'BPE Piquage' }
      ]
    },
    {
      title: "📅 Dates d'attente client",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      fields: [
        { name: 'begin_client_wait', label: 'Début attente client', type: 'date' },
        { name: 'client_wait_end', label: 'Fin attente client', type: 'date' }
      ]
    }
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

  const tabs = [
    { id: 'edit', label: 'Modifier la date', icon: '📅', color: 'amber' },
    { id: 'crclient', label: 'Livré CR Client', icon: '📋', color: 'emerald' },
    { id: 'doe', label: 'Livraison DOE', icon: '📊', color: 'indigo' },
    { id: 'dft', label: 'Livraison DFT', icon: '📁', color: 'violet' }
  ];

  return (
    <Main user={auth.user}>
      <Head title="Raccordement Planifié" />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.visit('/backlog')}
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
                    Raccordement Planifié
                  </span>
                </h1>
                <p className="text-gray-600">Gérez la modification de date et les livraisons</p>
              </div>

              <div className="w-24"></div>
            </div>
          </div>

          {/* Bannière d'information */}
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
                          Référence BCA: <span className="font-bold text-yellow-300">{data.admin_bca}</span>
                        </h2>
                        <p className="text-white/80 mt-1">
                          RDS: {data.admin_rds}
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
                      <span className="text-sm">Raccordement Planifié</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Onglets de navigation */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`py-4 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${
                    activeSection === tab.id
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
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
                      <p className="text-xs text-gray-400 mt-1">Format: YYYY-MM-DD</p>
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
                      <p className="text-xs text-gray-400 mt-1">{data.comment_edit?.length || 0}/250 caractères</p>
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

          {/* Section Livré CR Client */}
          {activeSection === 'crclient' && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-lg border border-emerald-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-100 to-green-100 border-b border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-200 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Livraison CR Client
                    </h3>
                    <span className="px-2 py-1 text-xs bg-emerald-200 text-emerald-800 rounded-full">
                      Préfixe: CRIDOCCLI
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date effective de rdv <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="effective_date"
                        value={data.effective_date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
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
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        placeholder="Ex: SN123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compte rendu d'intervention <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer group">
                          <input 
                            type="file" 
                            onChange={e => setRopFile(e.target.files[0])}
                            required
                            className="hidden" 
                          />
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment_crclient"
                      value={data.comment_crclient}
                      onChange={handleChange}
                      rows="3"
                      maxLength={250}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder="Ajoutez un commentaire si nécessaire..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{data.comment_crclient?.length || 0}/250 caractères</p>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleCrClientSubmit}
                      disabled={isSubmitting}
                      className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {isSubmitting ? 'Envoi en cours...' : 'Livrer le CR Client'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Livraison DOE */}
          {activeSection === 'doe' && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg border border-indigo-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-100 to-purple-100 border-b border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-200 rounded-lg">
                      <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Livraison DOE
                    </h3>
                    <span className="px-2 py-1 text-xs bg-indigo-200 text-indigo-800 rounded-full">
                      Préfixe: DOEDOC
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DOE Travaux avec Shape du câble <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer group">
                          <input 
                            type="file" 
                            accept=".dbf,.shx,.shp,.dwg"
                            onChange={e => setCableShapeBpeFile(e.target.files[0])}
                            required
                            className="hidden" 
                          />
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        placeholder="0.000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Longueur en ML de câble d'extension</label>
                      <input
                        type="number"
                        step="0.001"
                        name="ml_length_extension_cable"
                        value={data.ml_length_extension_cable}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de soumission <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="submission_date_doe"
                        value={data.submission_date_doe}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fermeture PMV/chantier <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer group">
                          <input 
                            type="file" 
                            accept=".doc,.pdf,.docx"
                            onChange={e => setPmvClosureFile(e.target.files[0])}
                            required
                            className="hidden" 
                          />
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment_doe"
                      value={data.comment_doe}
                      onChange={handleChange}
                      rows="3"
                      maxLength={250}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Ajoutez un commentaire si nécessaire..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{data.comment_doe?.length || 0}/250 caractères</p>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleDoeSubmit}
                      disabled={isSubmitting}
                      className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {isSubmitting ? 'Envoi en cours...' : 'Livrer le DOE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Livraison DFT */}
          {activeSection === 'dft' && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl shadow-lg border border-violet-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-violet-100 to-purple-100 border-b border-violet-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-200 rounded-lg">
                      <svg className="w-5 h-5 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Livraison DFT
                    </h3>
                    <span className="px-2 py-1 text-xs bg-violet-200 text-violet-800 rounded-full">
                      Préfixe: DFTDOC
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date validation Enedis</label>
                      <input
                        type="date"
                        name="enedis_validation_date"
                        value={data.enedis_validation_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date validation DFT Orange (GCB2)</label>
                      <input
                        type="date"
                        name="orange_submission_date"
                        value={data.orange_submission_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date prévisionnelle de rdv</label>
                      <input
                        type="date"
                        name="orange_validation_date"
                        value={data.orange_validation_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Intervention poteau Orange</label>
                      <select
                        name="pole_intervention"
                        value={data.pole_intervention}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition bg-white"
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
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-violet-400 hover:bg-violet-50/50 cursor-pointer group">
                          <input 
                            type="file" 
                            accept=".zip"
                            onChange={e => setSupplyFile(e.target.files[0])}
                            className="hidden" 
                          />
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-violet-400 hover:bg-violet-50/50 cursor-pointer group">
                          <input 
                            type="file" 
                            accept=".zip"
                            onChange={e => setSupplyFile2(e.target.files[0])}
                            className="hidden" 
                          />
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                    <textarea
                      name="comment_dft"
                      value={data.comment_dft}
                      onChange={handleChange}
                      rows="3"
                      maxLength={250}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                      placeholder="Ajoutez un commentaire si nécessaire..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{data.comment_dft?.length || 0}/250 caractères</p>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleDftSubmit}
                      disabled={isSubmitting}
                      className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {isSubmitting ? 'Envoi en cours...' : 'Livrer le DFT'}
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
