import React, { useState, useRef, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const ACTION_TYPES = {
  PLANIFICATION: 'planification',
  IMPOSSIBILITE: 'impossibilite',
  LIVRAISON_CR: 'livraison_cr',
  MODIFICATION_DATE: 'modification_date',
  LIVRAISON_DOE: 'livraison_doe',
  LIVRAISON_DFT: 'livraison_dft',
  ROUTE_OPTIQUE: 'route_optique'
};

const actionConfig = {
  [ACTION_TYPES.PLANIFICATION]: { label: 'Planifier', icon: '', color: 'emerald', submitText: 'Planifier le raccordement' },
  [ACTION_TYPES.IMPOSSIBILITE]: { label: 'Impossibilité', icon: '', color: 'red', submitText: "Enregistrer l'impossibilité" },
  [ACTION_TYPES.LIVRAISON_CR]: { label: 'CR Client', icon: '', color: 'teal', submitText: 'Livrer CR Client' },
  [ACTION_TYPES.MODIFICATION_DATE]: { label: 'Modifier date', icon: '', color: 'amber', submitText: 'Modifier la date' },
  [ACTION_TYPES.LIVRAISON_DOE]: { label: 'Livrer DOE', icon: '', color: 'indigo', submitText: 'Livrer DOE' },
  [ACTION_TYPES.LIVRAISON_DFT]: { label: 'Livrer DFT', icon: '', color: 'slate', submitText: 'Livrer DFT' },
  [ACTION_TYPES.ROUTE_OPTIQUE]: { label: 'Route Optique', icon: '', color: 'gold', submitText: 'Route Optique' },
};

// ===== COMPOSANTS STABLES =====
const InputField = ({ label, name, type = 'text', required, placeholder, children, value, onChange, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-slate-700 mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        rows={3}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white/80"
        {...props}
      />
    ) : type === 'select' ? (
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80"
        {...props}
      >
        {children}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white/80"
        {...props}
      />
    )}
  </div>
);

const FileUpload = ({ label, onChange, fileName, required, accept }) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-slate-700 mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="flex items-center justify-center w-full">
      <label className="flex flex-col w-full h-32 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50/80 hover:border-emerald-400 transition-all cursor-pointer bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-slate-600"><span className="font-semibold">Cliquez ou glissez</span></p>
          <p className="text-xs text-slate-400 mt-1">{accept ? `Formats: ${accept}` : 'Tous formats'}</p>
        </div>
        <input type="file" className="hidden" onChange={onChange} accept={accept} />
      </label>
    </div>
    {fileName && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">✓ {fileName}</p>}
  </div>
);

// ===== COMPOSANT PRINCIPAL =====
export default function DepotActionRaccordementComplet({ order, initialAction, onSuccess, onClose, existingActions = [] }) {
  const [activeAction, setActiveAction] = useState(initialAction || ACTION_TYPES.PLANIFICATION);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États fichiers
  const [ropFile, setRopFile] = useState(null);
  const [cableShapeFile, setCableShapeFile] = useState(null);
  const [pmvClosureFile, setPmvClosureFile] = useState(null);
  const [supplyFile1, setSupplyFile1] = useState(null);
  const [supplyFile2, setSupplyFile2] = useState(null);

  const abortControllerRef = useRef(null);

  const { data, setData } = useForm({
    admin_rds: order?.admin_rds || '',
    admin_bca: order?.admin_bca || '',
    admin_prefix: order?.admin_prefix || '',
    admin_contract: order?.admin_contract || '',
    comment: '',
    planning_date: '',
    arc_ars_declaration_date: '',
    enedis_order_start_date: '',
    orange_order_ref: '',
    orange_order_start_date: '',
    pmv_application_date: '',
    third_party_company_name: '',
    third_party_order_start_date: '',
    fail_reason: '',
    effective_date: '',
    submission_date: '',
    cpe_installed: '',
    cpe_operator_number: '',
    client_cpe_serial: '',
    new_planning_date: '',
    cable_capacity: '',
    gc_length: '',
    ml_length_extension_cable: '',
    ml_length_racco_cable_private_domain: '',
    ml_length_racco_cable_public_domain: '',
    pmv_validation_date: '',
    submission_date_doe: '',
    enedis_validation_date: '',
    orange_submission_date: '',
    orange_validation_date: '',
    pole_intervention: '',
    enedis_order_ref: '',
     version: '',
  });

  // Tous les champs standards (doivent correspondre à ceux attendus par Covage)
  const allFields = [
    'address_site_a_name',
    'address_site_a_postal',
    'address_site_a_street',
    'address_site_a_town',
    'address_site_a_x',
    'address_site_a_y',
    'insee_code',
    'admin_contract',
    'bandwith',
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
    'bpe_piquage',
    'project_name',
    'rop_ref',
    'techno',
    'begin_client_wait',
    'client_wait_end',
    'mer_number',
    'equipement_number',
    'article_designation',
    'cable_capacity',
    'gc_length',
    'ml_length_extension_cable',
    'ml_length_racco_cable_private_domain',
    'ml_length_racco_cable_public_domain',
    'pmv_validation_date',
    'submission_date_doe',
    'enedis_validation_date',
    'orange_submission_date',
    'orange_validation_date',
    'pole_intervention',
    'orange_order_ref',
    'enedis_order_start_date',
    'orange_order_start_date',
    'planning_date',
    'effective_date',
    'fail_reason',
    'submission_date',
    'enedis_order_ref'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(name, type === 'checkbox' ? checked : value);
  };

  // Calcul de la version pour Route Optique
  const getVersionForRop = () => {
    if (!existingActions) return 'V1';
    const count = existingActions.filter(a => a.action_type === 'route_optique').length;
    return `V${count + 1}`;
  };

  const handleFileChange = (setter) => (e) => setter(e.target.files[0]);

  const isValidDateFormat = (date) => {
    if (!date) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  };

  const validateAndFormatDecimal2 = (value, fieldName) => {
    if (value === null || value === undefined || value === '') return '';
    let cleanStr = value.toString().trim().replace(',', '.');
    let num = parseFloat(cleanStr);
    if (isNaN(num)) throw new Error(`${fieldName} doit être un nombre valide`);
    const integerPart = Math.floor(num);
    if (integerPart > 7 || integerPart < 0) throw new Error(`${fieldName} doit avoir une partie entière comprise entre 0 et 7`);
    const decimalPart = (cleanStr.split('.')[1] || '');
    if (decimalPart.length > 2) throw new Error(`${fieldName} ne peut pas avoir plus de 2 décimales`);
    return num.toFixed(2);
  };

  const isValidComment = (comment, max = 250) => {
    if (!comment) return true;
    const len = comment.trim().length;
    return len >= 3 && len <= max;
  };

  const validateRequiredFields = () => {
    const required = ['admin_rds', 'admin_bca'];
    const missing = required.filter(f => !data[f] || data[f] === '');
    if (missing.length) {
      toast.error(`Champs obligatoires manquants: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  // Génération du CSV avec TOUS les champs
  const generateFullCsv = (specificHeaders, specificData) => {
    const finalHeaders = [...allFields];
    specificHeaders.forEach(h => {
      if (!finalHeaders.includes(h)) finalHeaders.push(h);
    });
    ['admin_rds', 'admin_bca', 'admin_prefix'].forEach(h => {
      if (!finalHeaders.includes(h)) finalHeaders.push(h);
    });

    const escapeCSV = (value, isComment = false) => {
      if (value == null) return '';
      let str = String(value);
      if (isComment) return `"${str.replace(/"/g, '""')}"`;
      if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const row = finalHeaders.map(header => {
      const isComment = header === 'comment';
      const value = specificData[header] !== undefined ? specificData[header] : '';
      return escapeCSV(value, isComment);
    });
    return `${finalHeaders.join(',')}\n${row.join(',')}`;
  };

  const cleanForFilename = (str) => {
    if (!str?.toString().trim()) return 'inconnu';
    return str.toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/(^-+|-+$)/g, '')
      .substring(0, 30);
  };

  useEffect(() => {
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateRequiredFields()) return;
    setIsSubmitting(true);
    abortControllerRef.current = new AbortController();
    const today = new Date();
    const formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}`;
    const adminRds = cleanForFilename(data.admin_rds);
    const adminBca = cleanForFilename(data.admin_bca);
    const adminPrefix = cleanForFilename(data.admin_prefix || 'RACCO');

    let prefix = '', specificHeaders = [], specificData = {}, activeTabLabel = '';
    try {
      switch (activeAction) {
        case ACTION_TYPES.PLANIFICATION:
          prefix = 'PLANIFRACCODATE';
          activeTabLabel = 'Planifier le raccordement';
          if (!data.planning_date) throw new Error('La date de planification est obligatoire');
          if (!isValidDateFormat(data.planning_date)) throw new Error('Format de date invalide');
          if (data.comment && !isValidComment(data.comment)) throw new Error('Commentaire invalide');
          specificHeaders = ['planning_date', 'comment', 'arc_ars_declaration_date', 'enedis_order_start_date',
            'orange_order_ref', 'orange_order_start_date', 'pmv_application_date', 'third_party_company_name',
            'third_party_order_start_date', 'enedis_order_ref'];
          specificData = {
            admin_rds: data.admin_rds, admin_bca: data.admin_bca, admin_prefix: 'PLANIFRACCODATE',
            planning_date: data.planning_date, comment: data.comment,
            arc_ars_declaration_date: data.arc_ars_declaration_date,
            enedis_order_start_date: data.enedis_order_start_date,
            orange_order_ref: data.orange_order_ref,
            orange_order_start_date: data.orange_order_start_date,
            pmv_application_date: data.pmv_application_date,
            third_party_company_name: data.third_party_company_name,
            third_party_order_start_date: data.third_party_order_start_date,
            enedis_order_ref: data.enedis_order_ref,
          };
          break;

        case ACTION_TYPES.IMPOSSIBILITE:
          prefix = 'PLANIFRACCODATEKO';
          activeTabLabel = 'Impossibilité';
          if (!data.fail_reason) throw new Error('Le motif d\'échec est obligatoire');
          if (data.comment && !isValidComment(data.comment)) throw new Error('Commentaire invalide');
          specificHeaders = ['fail_reason', 'comment', 'planning_date'];
          specificData = {
            admin_rds: data.admin_rds, admin_bca: data.admin_bca, admin_prefix: 'PLANIFRACCODATEKO',
            fail_reason: data.fail_reason, comment: data.comment, planning_date: data.planning_date
          };
          break;

       case ACTION_TYPES.LIVRAISON_CR:{
   prefix = 'CRIDOCCLI';
  activeTabLabel = 'Livré CR Client';
  if (!data.effective_date || !data.submission_date)
    throw new Error('Les dates effective et de soumission sont obligatoires');
  if (!isValidDateFormat(data.effective_date) || !isValidDateFormat(data.submission_date))
    throw new Error('Format de date invalide');
  if (data.comment && !isValidComment(data.comment))
    throw new Error('Commentaire invalide');

  // Validation et formatage des longueurs (propres à ce cas)
  let formattedGcLength = '', formattedMlExtension = '', formattedMlPrivate = '', formattedMlPublic = '';
  try {
    formattedGcLength = validateAndFormatDecimal2(data.gc_length, 'Longueur GC');
    formattedMlExtension = validateAndFormatDecimal2(data.ml_length_extension_cable, 'Longueur extension câble');
    formattedMlPrivate = validateAndFormatDecimal2(data.ml_length_racco_cable_private_domain, 'Longueur domaine privé');
    formattedMlPublic = validateAndFormatDecimal2(data.ml_length_racco_cable_public_domain, 'Longueur domaine public');
  } catch (err) { throw err; }

  specificHeaders = [
    'effective_date', 'submission_date',
    'cpe_installed', 'cpe_operator_number', 'client_cpe_serial',
    'cable_capacity',
    'gc_length',
    'ml_length_extension_cable',
    'ml_length_racco_cable_private_domain',
    'ml_length_racco_cable_public_domain',
    'fail_reason',
    'comment'
  ];
  specificData = {
    admin_rds: data.admin_rds,
    admin_bca: data.admin_bca,
    admin_prefix: 'CRIDOCCLI',
    effective_date: data.effective_date,
    submission_date: data.submission_date,
    cpe_installed: data.cpe_installed,
    cpe_operator_number: data.cpe_operator_number,
    client_cpe_serial: data.client_cpe_serial,
    cable_capacity: data.cable_capacity,
    gc_length: formattedGcLength,
    ml_length_extension_cable: formattedMlExtension,
    ml_length_racco_cable_private_domain: formattedMlPrivate,
    ml_length_racco_cable_public_domain: formattedMlPublic,
    fail_reason: data.fail_reason,
    comment: data.comment,
  };
  break;
       }
        case ACTION_TYPES.MODIFICATION_DATE:
          prefix = 'EDITPLANIFDATE';
          activeTabLabel = 'Edit Planif date';
          if (!data.new_planning_date) throw new Error('La nouvelle date de planification est obligatoire');
          if (!isValidDateFormat(data.new_planning_date)) throw new Error('Format de date invalide');
          if (data.comment && !isValidComment(data.comment)) throw new Error('Commentaire invalide');
          specificHeaders = ['planning_date', 'comment'];
          specificData = {
            admin_rds: data.admin_rds, admin_bca: data.admin_bca, admin_prefix: 'EDITPLANIFDATE',
            planning_date: data.new_planning_date, comment: data.comment,
          };
          break;

        case ACTION_TYPES.LIVRAISON_DOE:{
           prefix = 'DOEDOC';
  activeTabLabel = 'Livraison DOE';
  if (!cableShapeFile || !pmvClosureFile)
    throw new Error('Les fichiers Cable Shape et PMV Closure sont obligatoires');

  // Validation et formatage des longueurs (propres à ce cas)
  let formattedGcLength = '', formattedMlExtension = '', formattedMlPrivate = '', formattedMlPublic = '';
  try {
    formattedGcLength = validateAndFormatDecimal2(data.gc_length, 'Longueur GC');
    formattedMlExtension = validateAndFormatDecimal2(data.ml_length_extension_cable, 'Longueur extension câble');
    formattedMlPrivate = validateAndFormatDecimal2(data.ml_length_racco_cable_private_domain, 'Longueur domaine privé');
    formattedMlPublic = validateAndFormatDecimal2(data.ml_length_racco_cable_public_domain, 'Longueur domaine public');
  } catch (err) { throw err; }

  if (data.comment && !isValidComment(data.comment))
    throw new Error('Commentaire invalide');

  specificHeaders = [
    'cable_capacity',
    'gc_length',
    'ml_length_extension_cable',
    'ml_length_racco_cable_private_domain',
    'ml_length_racco_cable_public_domain',
    'pmv_validation_date',
    'submission_date',
    'enedis_order_ref',
    'comment',
    'orange_order_ref',
    'orange_order_start_date',
  ];
  specificData = {
    admin_rds: data.admin_rds,
    admin_bca: data.admin_bca,
    admin_prefix: 'DOEDOC',
    cable_capacity: data.cable_capacity,
    gc_length: formattedGcLength,
    ml_length_extension_cable: formattedMlExtension,
    ml_length_racco_cable_private_domain: formattedMlPrivate,
    ml_length_racco_cable_public_domain: formattedMlPublic,
    pmv_validation_date: data.pmv_validation_date,
    submission_date: data.submission_date_doe,
    enedis_order_ref: data.enedis_order_ref,
    orange_order_ref: data.orange_order_ref,
    orange_order_start_date: data.orange_order_start_date,
    comment: data.comment,
  };
  break;
        }
        case ACTION_TYPES.LIVRAISON_DFT:
          prefix = 'DFTDOC';
          activeTabLabel = 'Livraison DFT';
          if (!supplyFile1 && !supplyFile2) throw new Error('Au moins un fichier DFT doit être fourni');
          if (data.comment && !isValidComment(data.comment)) throw new Error('Commentaire invalide');
          specificHeaders = [

            'enedis_validation_date',
            'enedis_order_start_date', 
            'enedis_order_ref',
            'orange_order_ref',
            'orange_order_start_date',
            'orange_submission_date', 
            'orange_validation_date',
            'pole_intervention',
            'comment'
          ];
          specificData = {
            admin_rds: data.admin_rds,
            admin_bca: data.admin_bca,
            admin_prefix: adminPrefix,

            enedis_validation_date:data.enedis_validation_date,
            enedis_order_start_date: data.enedis_order_start_date,
            enedis_order_ref:data.enedis_order_ref,
            orange_order_ref:data.orange_order_ref,
            orange_order_start_date:data.orange_order_start_date,
            orange_submission_date:data.orange_submission_date,
            orange_validation_date:data.orange_validation_date,
            pole_intervention:data.pole_intervention, 
            comment: data.comment,
          };
          break;

        case ACTION_TYPES.ROUTE_OPTIQUE:
          prefix = 'ROUTEOPTIQUE';
          activeTabLabel = 'Route Optique';
          if (!ropFile) throw new Error('Le fichier ROP est obligatoire');
          if (data.comment && !isValidComment(data.comment)) throw new Error('Commentaire invalide');
          specificHeaders = ['comment'];
          specificData = {
            admin_rds: data.admin_rds,
            admin_bca: data.admin_bca,
            admin_prefix: 'ROUTEOPTIQUE',
            comment: data.comment,
          };
          break;

        default:
          throw new Error('Action non reconnue');
      }

      // Génération du CSV
      const csvContent = generateFullCsv(specificHeaders, specificData);
      const csvFilename = `${prefix}_${adminRds}_${adminBca}_${formattedDate}_${formattedTime}.csv`;
      const formData = new FormData();
      formData.append('filename', csvFilename);
      formData.append('content', csvContent);
      formData.append('activeTab', activeTabLabel);
      formData.append('admin_rds', data.admin_rds);
      formData.append('admin_bca', data.admin_bca);
      formData.append('admin_prefix', adminPrefix);

      // Gestion des fichiers
      if (activeAction === ACTION_TYPES.LIVRAISON_DOE) {
        if (cableShapeFile) {
          const ext = cableShapeFile.name.split('.').pop();
          const newFileName = `DOEDOC_${adminRds}_${formattedDate}.${ext}`;
          formData.append('cable_shape_bpe', new File([cableShapeFile], newFileName, { type: cableShapeFile.type }));
        }
        if (pmvClosureFile) {
          const ext = pmvClosureFile.name.split('.').pop();
          const newFileName = `DOEPMV_${adminRds}_${formattedDate}.${ext}`;
          formData.append('pmv_closure', new File([pmvClosureFile], newFileName, { type: pmvClosureFile.type }));
        }
      }
      if (activeAction === ACTION_TYPES.LIVRAISON_DFT) {
        if (supplyFile1) {
          const ext1 = supplyFile1.name.split('.').pop();
          const newName1 = `DFTGCB1_${adminRds}_${formattedDate}.${ext1}`;
          formData.append('supply_dft', new File([supplyFile1], newName1, { type: supplyFile1.type }));
        }
        if (supplyFile2) {
          const ext2 = supplyFile2.name.split('.').pop();
          const newName2 = `DFTGCB2_${adminRds}_${formattedDate}.${ext2}`;
          formData.append('supply', new File([supplyFile2], newName2, { type: supplyFile2.type }));
        }
      }
      if (activeAction === ACTION_TYPES.ROUTE_OPTIQUE) {
    if (ropFile) {
        const ext = ropFile.name.split('.').pop();
        const rds = order?.admin_rds || 'RDS';
        const refRop = order?.rop_ref || 'REF';
        const date = formattedDate;
        // Utiliser la version saisie par l'utilisateur
        let version = data.version?.trim() || 'V1';
        // Si l'utilisateur a saisi un nombre, on le préfixe par V
        if (/^\d+$/.test(version)) {
            version = 'V' + version;
        }
        const newFileName = `ROP_${rds}_${refRop}_${date}_${version}.${ext}`;
        formData.append('rop_travaux', new File([ropFile], newFileName, { type: ropFile.type }));
    }
    if (data.comment) formData.append('comment', data.comment);
      formData.append('version', data.version || getVersionForRop());
}
      // Champs supplémentaires pour certaines actions
      if (activeAction === ACTION_TYPES.PLANIFICATION) {
        if (data.planning_date) formData.append('planning_date', data.planning_date);
        if (data.comment) formData.append('comment', data.comment);
      }
      if (activeAction === ACTION_TYPES.IMPOSSIBILITE) {
        if (data.fail_reason) formData.append('fail_reason', data.fail_reason);
        if (data.planning_date) formData.append('planning_date', data.planning_date);
        if (data.comment) formData.append('comment', data.comment);
      }
      if (activeAction === ACTION_TYPES.MODIFICATION_DATE) {
        if (data.new_planning_date) formData.append('planning_date', data.new_planning_date);
        if (data.comment) formData.append('comment', data.comment);
      }

      await axios.post('/api/vt/upload-racco', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: abortControllerRef.current.signal,
      });
      toast.success('Action enregistrée avec succès', { duration: 3000 });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      if (axios.isCancel(error)) return;
      const msg = error.response?.data?.message || error.message || 'Erreur lors de l\'envoi';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  // ========== RENDU DES CHAMPS DU FORMULAIRE ==========
  function renderFormFields() {
    switch (activeAction) {
      case ACTION_TYPES.PLANIFICATION:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Date de planification" name="planning_date" type="date" required value={data.planning_date} onChange={handleChange} />
              <InputField label="Date déclaration ARC/ARS" name="arc_ars_declaration_date" type="date" value={data.arc_ars_declaration_date} onChange={handleChange} />
              <InputField label="Date dépôt étude ENEDIS" name="enedis_order_start_date" type="date" value={data.enedis_order_start_date} onChange={handleChange} />
              <InputField label="Référence commande Orange" name="orange_order_ref" placeholder="Ex: ORD-2024-001" value={data.orange_order_ref} onChange={handleChange} />
              <InputField label="Date soumission Orange" name="orange_order_start_date" type="date" value={data.orange_order_start_date} onChange={handleChange} />
              <InputField label="Date demande PMV" name="pmv_application_date" type="date" value={data.pmv_application_date} onChange={handleChange} />
              <InputField label="Raison sociale du tiers" name="third_party_company_name" value={data.third_party_company_name} onChange={handleChange} />
              <InputField label="Date soumission commande tiers" name="third_party_order_start_date" type="date" value={data.third_party_order_start_date} onChange={handleChange} />
              <InputField label="Référence commande Enedis" name="enedis_order_ref" type="date" value={data.enedis_order_ref} onChange={handleChange} />
            </div>
            <InputField label="Commentaire (3-250 caractères)" name="comment" type="textarea" value={data.comment} onChange={handleChange} />
          </div>
        );
      case ACTION_TYPES.IMPOSSIBILITE:
        return (
          <div className="space-y-4">
            <InputField label="Motif d'échec" name="fail_reason" type="select" required value={data.fail_reason} onChange={handleChange}>
              <option value="">-- Sélectionner --</option>
              <option value="Appel vers le client effectué, en attente de retour">Appel vers le client effectué, en attente de retour</option>
              <option value="Cas de force majeur">Cas de force majeur</option>
              <option value="Demande d'annulation de la commande à l'initiative du Client">Demande d'annulation</option>
              <option value="Demande d'arrêté de circulation ou permission de voirie en cours">Demande d'arrêté de circulation</option>
              <option value="Evènement public">Evènement public</option>
              <option value="Fermeture (annuelle) de l’entreprise ou exceptionnelle">Fermeture entreprise</option>
              <option value="Gel réseau">Gel réseau</option>
              <option value="Le Client est indisponible">Client indisponible</option>
              <option value="Le Client est injoignable">Client injoignable</option>
              <option value="Le Client ne sait pas">Client ne sait pas</option>
              <option value="Le Client ne veut pas">Client ne veut pas</option>
              <option value="Le contact Client a changé entre la VT et le raccordement">Contact client changé</option>
              <option value="Absence du guide d'installation">Absence du guide d'installation</option>
              <option value="Défaillance de l'équipement ou qui ne s'allume pas au 1er démarrage">Défaillance de l'équipement ou qui ne s'allume pas au 1er démarrage</option>
              <option value="Equipement non présent chez le Client">Equipement non présent chez le Client</option>
            </InputField>
            <InputField label="Date de planification" name="planning_date" type="date" value={data.planning_date} onChange={handleChange} />
            <InputField label="Commentaire (3-250 caractères)" name="comment" type="textarea" value={data.comment} onChange={handleChange} />
          </div>
        );
      case ACTION_TYPES.LIVRAISON_CR:
        return (
          <div className="max-w-6xl mx-auto p-4 space-y-8">
            {/* Section RDV */}
            <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputField label="Date effective de RDV" name="effective_date" type="date" required value={data.effective_date} onChange={handleChange} />
              <InputField label="Date de soumission" name="submission_date" type="date" required value={data.submission_date} onChange={handleChange} />
             
              </div>
            </section>
            {/* Section CPE */}
            <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="CPE client posé" name="cpe_installed" type="select" value={data.cpe_installed} onChange={handleChange}>
                  <option value="">-- Sélectionner --</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </InputField>
                <InputField label="N° décharge" name="cpe_operator_number" value={data.cpe_operator_number} onChange={handleChange} />
                <InputField label="N° série CPE client" name="client_cpe_serial" value={data.client_cpe_serial} onChange={handleChange} />
              </div>
            </section>
            {/* Section Câblage */}
            <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="Capacité du câble d'extension" name="cable_capacity" type="select" value={data.cable_capacity} onChange={handleChange}>
                  <option value="">Sélectionnez...</option>
                  {[12, 24, 36, 48, 72, 96, 144, 288, 432].map(v => <option key={v} value={v}>{v}</option>)}
                </InputField>
                {/* On retire gc_length etc. car non utilisés pour CR */}
                <InputField label="Longueur GC (m)" name="gc_length" type="number" step="0.01" placeholder="0.00" required value={data.gc_length} onChange={handleChange} />
              <InputField label="Longueur extension câble (m)" name="ml_length_extension_cable" type="number" step="0.01" placeholder="0.00" required value={data.ml_length_extension_cable} onChange={handleChange} />
              <InputField label="Longueur domaine privé (m)" name="ml_length_racco_cable_private_domain" type="number" step="0.01" placeholder="0.00" required value={data.ml_length_racco_cable_private_domain} onChange={handleChange} />
              <InputField label="Longueur domaine public (m)" name="ml_length_racco_cable_public_domain" type="number" step="0.01" placeholder="0.00" required value={data.ml_length_racco_cable_public_domain} onChange={handleChange} />
              </div>
            </section>
            {/* Motif d'échec si nécessaire */}
            {data.status === 'ECHEC' && (
              <section className="bg-red-50 border-l-4 border-red-500 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-red-200">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-xl font-semibold text-red-700">Motif d'échec</h3>
                </div>
                <InputField label="Motif d'échec" name="fail_reason" type="select" required value={data.fail_reason} onChange={handleChange}>
                  <option value="">-- Sélectionner --</option>
                  <option value="Appel vers le client effectué, en attente de retour">Appel vers le client effectué, en attente de retour</option>
                  <option value="Cas de force majeur">Cas de force majeur</option>
                  <option value="Demande d'annulation de la commande à l'initiative du Client">Demande d'annulation</option>
                  <option value="Demande d'arrêté de circulation ou permission de voirie en cours">Demande d'arrêté de circulation</option>
                  <option value="Evènement public">Evènement public</option>
                  <option value="Fermeture (annuelle) de l’entreprise ou exceptionnelle">Fermeture entreprise</option>
                  <option value="Gel réseau">Gel réseau</option>
                  <option value="Le Client est indisponible">Client indisponible</option>
                  <option value="Le Client est injoignable">Client injoignable</option>
                  <option value="Le Client ne sait pas">Client ne sait pas</option>
                  <option value="Le Client ne veut pas">Client ne veut pas</option>
                  <option value="Le contact Client a changé entre la VT et le raccordement">Contact client changé</option>
                  <option value="Equipement non présent chez le Client">Equipement non présent chez le Client</option>
                  <option value="Défaillance de l'équipement ou qui ne s'allume pas au 1er démarrage">Défaillance de l'équipement ou qui ne s'allume pas au 1er démarrage</option>
                  <option value="Absence du guide d'installation">Absence du guide d'installation</option>
                </InputField>
              </section>
            )}
            {/* Commentaire */}
            <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              
              <InputField label="Commentaire (3 à 250 caractères)" name="comment" type="textarea" value={data.comment} onChange={handleChange} />
            </section>
          </div>
        );
      case ACTION_TYPES.MODIFICATION_DATE:
        return (
          <div className="space-y-4">
            <InputField label="Nouvelle date de planification" name="new_planning_date" type="date" required value={data.new_planning_date} onChange={handleChange} />
            <InputField label="Motif de modification (3-250 caractères)" name="comment" type="textarea" value={data.comment} onChange={handleChange} />
          </div>
        );
      case ACTION_TYPES.LIVRAISON_DOE:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Capacité du câble d'extension" name="cable_capacity" type="select" value={data.cable_capacity} onChange={handleChange}>
                <option value="">Sélectionnez...</option>
                {[12, 24, 36, 48, 72, 96, 144, 288, 432].map(v => <option key={v} value={v}>{v}</option>)}
              </InputField>
              <InputField label="Longueur GC (m)" name="gc_length" type="number" step="0.01" placeholder="0.00" required value={data.gc_length} onChange={handleChange} />
              <InputField label="Longueur extension câble (m)" name="ml_length_extension_cable" type="number" step="0.01" placeholder="0.00" required value={data.ml_length_extension_cable} onChange={handleChange} />
              <InputField label="Longueur domaine privé (m)" name="ml_length_racco_cable_private_domain" type="number" step="0.01" placeholder="0.00" required value={data.ml_length_racco_cable_private_domain} onChange={handleChange} />
              <InputField label="Longueur domaine public (m)" name="ml_length_racco_cable_public_domain" type="number" step="0.01" placeholder="0.00" required value={data.ml_length_racco_cable_public_domain} onChange={handleChange} />
              <InputField label="Date validation PMV" name="pmv_validation_date" type="date" value={data.pmv_validation_date} onChange={handleChange} />
              <InputField label="Date de soumission" name="submission_date_doe" type="date" required value={data.submission_date_doe} onChange={handleChange} />
              <InputField label="Référence commande Enedis" name="enedis_order_ref" type="text" value={data.enedis_order_ref} onChange={handleChange} />
              <InputField label="Référence de la commande Orange" name="orange_order_ref" type="text" value={data.orange_order_ref} onChange={handleChange} />
              <InputField label="Date de soumission commande Orange" name="orange_order_start_date" type="date" value={data.orange_order_start_date} onChange={handleChange} />
            </div>
            <FileUpload label="Fichier Cable Shape BPE" onChange={handleFileChange(setCableShapeFile)} fileName={cableShapeFile?.name} required accept=".dbf,.shx,.shp,.dwg" />
            <FileUpload label="Fichier PMV Closure" onChange={handleFileChange(setPmvClosureFile)} fileName={pmvClosureFile?.name} required accept=".doc,.pdf,.docx" />
            <InputField label="Commentaire (3-250 caractères)" name="comment" type="textarea" value={data.comment} onChange={handleChange} />
          </div>
        );
        
      case ACTION_TYPES.LIVRAISON_DFT:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Date de soumission commande Enedis" name="enedis_order_start_date" type="date" value={data.enedis_order_start_date} onChange={handleChange} />
                  <InputField label="Date validation Enedis" name="enedis_validation_date" type="date" value={data.enedis_validation_date} onChange={handleChange} />
                  <InputField label="Référence commande Enedis" name="enedis_order_ref" type="text" value={data.enedis_order_ref} onChange={handleChange} />


                     <InputField label="Référence de la commande Orange" name="orange_order_ref" type="text" value={data.orange_order_ref} onChange={handleChange} />
                     <InputField label="Référence de la commande Orange" name="orange_order_start_date" type="date" value={data.orange_order_start_date} onChange={handleChange} />
                   <InputField label="Date validation DFT Orange (GCB2)" name="orange_validation_date" type="date" value={data.orange_validation_date} onChange={handleChange} />
                  <InputField label="Date dépôt DFT Orange (GCB1)" name="orange_submission_date" type="date" value={data.orange_submission_date} onChange={handleChange} />
          
              
      
              <InputField label="Intervention poteau Orange" name="pole_intervention" type="select" value={data.pole_intervention} onChange={handleChange}>
                <option value="">-- Sélectionner --</option>
                <option value="Remplacement">Remplacement</option>
                <option value="Renforcement">Renforcement</option>
                <option value="Création">Création</option>
              </InputField>
            </div>
            <FileUpload label="Fourniture du DFT GCB1 Orange" onChange={handleFileChange(setSupplyFile1)} fileName={supplyFile1?.name} accept=".zip" />
            <FileUpload label="Fourniture du GCB2 Orange" onChange={handleFileChange(setSupplyFile2)} fileName={supplyFile2?.name} accept=".zip" />
            <InputField label="Commentaire (3-250 caractères)" name="comment" type="textarea" value={data.comment} onChange={handleChange} />
          </div>
        );
      case ACTION_TYPES.ROUTE_OPTIQUE:
    return (
        <div className="space-y-4">
            {/* Champ Version */}
            <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
                    <span className="text-2xl">🔢</span>
                    <h3 className="text-xl font-semibold text-blue-700">Version du fichier ROP</h3>
                </div>
                <InputField
                    label="Version (ex: V1, V2, 1, 2...)"
                    name="version"
                    type="text"
                    placeholder="V1"
                    value={data.version || getVersionForRop()}
                    onChange={handleChange}
                    required
                />
                <p className="text-xs text-slate-500 mt-1">
                    Laissez vide pour utiliser la version auto-calculée (V{ (existingActions?.filter(a => a.action_type === 'route_optique').length || 0) + 1 })
                </p>
            </section>

            {/* Commentaire */}
            <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
                    <span className="text-2xl">💬</span>
                    <h3 className="text-xl font-semibold text-blue-700">Commentaire</h3>
                </div>
                <InputField
                    label="Commentaire (3 à 250 caractères)"
                    name="comment"
                    type="textarea"
                    value={data.comment}
                    onChange={handleChange}
                />
            </section>

            {/* Pièce jointe */}
            <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
                    <span className="text-2xl">📎</span>
                    <h3 className="text-xl font-semibold text-blue-700">Fichier ROP (ZIP)</h3>
                </div>
                <FileUpload
                    label="Sélectionner le fichier ZIP ROP"
                    onChange={handleFileChange(setRopFile)}
                    fileName={ropFile?.name}
                    required
                    accept=".zip"
                />
            </section>
        </div>
    );
      default:
        return null;
    }
  }

  // ========== RENDU FINAL ==========
  const activeConfigColor = actionConfig[activeAction].color;
  const colorGradient = {
    emerald: 'from-emerald-600 to-green-600',
    red: 'from-rose-500 to-red-600',
    teal: 'from-teal-600 to-cyan-600',
    amber: 'from-amber-500 to-orange-600',
    indigo: 'from-indigo-600 to-purple-600',
    slate: 'from-slate-600 to-gray-700',
    gold: 'from-yellow-500 to-amber-600',
  }[activeConfigColor];

  return (
    <div className="max-w-4xl mx-auto relative">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { background: '#1e293b', color: '#fff', borderRadius: '12px' },
          success: { style: { background: '#10b981' } },
          error: { style: { background: '#ef4444' } },
        }}
      />
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/40 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50/80 to-white px-6 py-5 border-b border-slate-200">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">
                Dépôt d'action raccordement
              </h2>
              <p className="text-sm text-slate-500 mt-1">Renseignez les informations et déposez les documents</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                RDS: {data.admin_rds || '—'}
              </span>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                BCA: {data.admin_bca || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/50 px-4">
          <nav className="flex flex-wrap gap-1" aria-label="Actions">
            {Object.entries(ACTION_TYPES).map(([key, value]) => {
              const cfg = actionConfig[value];
              const isActive = activeAction === value;
              const activeColorClass = {
                emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                red: 'bg-rose-100 text-rose-800 border-rose-300',
                teal: 'bg-teal-100 text-teal-800 border-teal-300',
                amber: 'bg-amber-100 text-amber-800 border-amber-300',
                indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                slate: 'bg-slate-100 text-slate-800 border-slate-300',
                gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
              }[cfg.color];
              return (
                <button
                  key={key}
                  onClick={() => setActiveAction(value)}
                  className={`px-5 py-2.5 text-sm font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
                    isActive
                      ? `${activeColorClass} border-current`
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                >
                  <span className="text-base">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ✅ Modification ici : suppression de max-h-[60vh] overflow-y-auto */}
        <form onSubmit={handleSubmit} className="p-6">
          {renderFormFields()}
          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 bg-gradient-to-r ${colorGradient}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi...
                </>
              ) : (
                actionConfig[activeAction].submitText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
