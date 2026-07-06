import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

const ACTION_TYPES = {
  PLANIFICATION: 'planification',
  IMPOSSIBILITE: 'impossibilite',
  MODIFICATION_DATE: 'modification_date',
  LIVRAISON_CRVT: 'livraison_crvt',
  ROUTE_OPTIQUE: 'route_optique'
};

const ACTION_CONFIG = {
  [ACTION_TYPES.PLANIFICATION]: {
    label: 'Planifier',
    color: 'blue',
    submitText: 'Planifier la VT',
    requiredFields: ['planning_date'],
  },
  [ACTION_TYPES.IMPOSSIBILITE]: {
    label: 'Impossibilité',
    color: 'red',
    submitText: 'Enregistrer l\'impossibilité',
    requiredFields: ['fail_reason'],
  },
  [ACTION_TYPES.MODIFICATION_DATE]: {
    label: 'Modifier date',
    color: 'yellow',
    submitText: 'Modifier la date',
    requiredFields: ['new_planning_date'],
  },
  [ACTION_TYPES.LIVRAISON_CRVT]: {
    label: 'Livrer CRVT',
    color: 'purple',
    submitText: 'Livrer le CRVT',
    requiredFields: ['effective_date', 'submission_date'],
  },
  [ACTION_TYPES.ROUTE_OPTIQUE]: {
    label: 'Route Optique',
    color: 'purple',
    submitText: 'Déposer la route optique',
    requiredFields: ['comment_route'],
  },
};

export default function DepotActionVTComplet({ order, onSuccess, onClose }) {
  const [activeAction, setActiveAction] = useState(ACTION_TYPES.PLANIFICATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState({
    rop: null,
    devis: null,
    route: null,
  });

  const allFields = [
    'admin_bca',
    'admin_prefix',
    'admin_rds',
    'arc_ars_declaration_date',
    'cable_capacity',
    'comment',
    'effective_date',
    'enedis_order_start_date',
    'enedis_validation_date',
    'fail_reason',
    'gc_length',
    'infra_to_be_created',
    'ml_length_extension_cable',
    'ml_length_racco_cable_private_domain',
    'ml_length_racco_cable_public_domain',
    'orange_order_ref',
    'orange_order_start_date',
    'orange_submission_date',
    'orange_validation_date',
    'planning_date',
    'pmv_application_date',
    'pmv_validation_date',
    'pole_intervention',
    'result_status',
    'submission_date',
    'third_party_company_name',
    'third_party_order_start_date',
    'cpe_installed',
    'cpe_operator_number',
    'client_cpe_serial'
  ];

  const { data, setData } = useForm({
    admin_rds: order?.admin_rds || '',
    admin_bca: order?.admin_bca || '',
    admin_prefix: order?.admin_prefix || '',
    admin_contract: order?.admin_contract || '',
    ref_rop: order?.ref_rop || '',
    planning_date: '',
    comment_planif: '',
    fail_reason: '',
    comment_imposs: '',
    new_planning_date: '',
    comment_modif: '',
    effective_date: '',
    result_status: 'Pas de blocage',
    comment_livraison: '',
    infra_to_be_created: false,
    submission_date: new Date().toISOString().split('T')[0],
    // Route Optique
    version: 'V1',          // version par défaut
    comment_route: '',      // commentaire spécifique
  });

  const handleFileChange = (e, type) => {
    setFiles(prev => ({ ...prev, [type]: e.target.files[0] }));
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

  const isValidDateFormat = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

  const isValidComment = (comment, max = 250) => {
    if (!comment) return true;
    const len = comment.trim().length;
    return len >= 3 && len <= max;
  };

  const cleanForFilename = (str) => {
    if (!str?.toString().trim()) return 'inconnu';
    return str
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/(^-+|-+$)/g, '')
      .substring(0, 30);
  };

  const generateCsv = (headers, dataMap) => {
    const requiredHeaders = ['admin_rds', 'admin_bca', 'admin_prefix'];
    const finalHeaders = [...headers];
    requiredHeaders.forEach(h => {
      if (!finalHeaders.includes(h)) finalHeaders.push(h);
    });
    allFields.forEach(f => {
      if (!finalHeaders.includes(f)) finalHeaders.push(f);
    });

    const escapeCSVValue = (value, isComment = false) => {
      if (value == null || value === undefined) return '';
      let str = String(value);
      if (isComment) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const commentFields = ['comment'];
    const row = finalHeaders.map(header => {
      const isComment = commentFields.includes(header);
      const value = dataMap[header] !== undefined ? dataMap[header] : '';
      return escapeCSVValue(value, isComment);
    });

    return `${finalHeaders.join(',')}\n${row.join(',')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateRequiredFields()) return;

    setIsSubmitting(true);

    const today = new Date();
    const formattedDate = today.toISOString().slice(0, 10).replace(/-/g, '');
    const formattedTime = today.toTimeString().slice(0, 5).replace(':', '');

    const adminRds = cleanForFilename(data.admin_rds);
    const adminBcaRef = cleanForFilename(data.admin_bca);

    let prefix = '';
    let csvHeaders = [];
    let csvData = {};
    let activeTabLabel = '';

    try {
      switch (activeAction) {
        case ACTION_TYPES.PLANIFICATION:
          prefix = 'PLANIFVTDATE';
          activeTabLabel = 'Confirmer la planification';
          if (!data.planning_date) throw new Error('La date de planification est obligatoire');
          if (!isValidDateFormat(data.planning_date)) throw new Error('Format de date invalide (YYYY-MM-DD)');
          if (data.comment_planif && !isValidComment(data.comment_planif)) throw new Error('Commentaire trop long (max 250 caractères)');

          csvHeaders = ['admin_rds', 'admin_bca', 'admin_prefix', 'planning_date', 'comment'];
          csvData = {
            admin_rds: data.admin_rds,
            admin_bca: data.admin_bca,
            admin_prefix: prefix,
            planning_date: data.planning_date,
            comment: data.comment_planif,
          };
          break;

        case ACTION_TYPES.IMPOSSIBILITE:
          prefix = 'PLANIFDATEVTKO';
          activeTabLabel = 'Impossibilité';
          if (!data.fail_reason) throw new Error('Le motif d\'échec est obligatoire');
          if (data.comment_imposs && !isValidComment(data.comment_imposs)) throw new Error('Commentaire trop long (max 250 caractères)');

          csvHeaders = ['admin_rds', 'admin_bca', 'admin_prefix', 'fail_reason', 'planning_date', 'comment'];
          csvData = {
            admin_rds: data.admin_rds,
            admin_bca: data.admin_bca,
            admin_prefix: prefix,
            fail_reason: data.fail_reason,
            planning_date: data.planning_date,
            comment: data.comment_imposs,
          };
          break;

        case ACTION_TYPES.MODIFICATION_DATE:
          prefix = 'EDITPLANIFDATE';
          activeTabLabel = 'Edit Planif date';
          if (!data.new_planning_date) throw new Error('La nouvelle date de planification est obligatoire');
          if (!isValidDateFormat(data.new_planning_date)) throw new Error('Format de date invalide (YYYY-MM-DD)');
          if (data.comment_modif && !isValidComment(data.comment_modif)) throw new Error('Commentaire trop long (max 250 caractères)');

          csvHeaders = ['admin_rds', 'admin_bca', 'admin_prefix', 'planning_date', 'comment'];
          csvData = {
            admin_rds: data.admin_rds,
            admin_bca: data.admin_bca,
            admin_prefix: prefix,
            planning_date: data.new_planning_date,
            comment: data.comment_modif,
          };
          break;

        case ACTION_TYPES.LIVRAISON_CRVT:
          prefix = 'CRVTCLI';
          activeTabLabel = 'Livré CRVT';
          if (!data.effective_date) throw new Error('La date effective est obligatoire');
          if (!data.submission_date) throw new Error('La date de soumission est obligatoire');
          if (!isValidDateFormat(data.effective_date) || !isValidDateFormat(data.submission_date))
            throw new Error('Formats de date invalides (YYYY-MM-DD)');
          if (!files.rop || !files.devis)
            throw new Error('Tous les fichiers (ROP, devis) sont obligatoires');

          csvHeaders = [
            'admin_rds', 'admin_bca', 'admin_prefix',
            'effective_date', 'submission_date', 'result_status',
            'infra_to_be_created', 'comment',
          ];
          csvData = {
            admin_rds: data.admin_rds,
            admin_bca: data.admin_bca,
            admin_prefix: prefix,
            effective_date: data.effective_date,
            submission_date: data.submission_date,
            result_status: data.result_status,
            infra_to_be_created: data.infra_to_be_created ? 'Oui' : 'Non',
            comment: data.comment_livraison,
          };
          break;

        case ACTION_TYPES.ROUTE_OPTIQUE:
          prefix = 'ROUTEOPTIQUE';
          activeTabLabel = 'Route Optique';
          if (!files.rop) throw new Error('Le fichier ROP est obligatoire');
          if (data.comment_route && !isValidComment(data.comment_route)) throw new Error('Commentaire invalide (3-250 caractères)');

          csvHeaders = ['admin_rds', 'admin_bca', 'admin_prefix', 'comment'];
          csvData = {
            admin_rds: data.admin_rds,
            admin_bca: data.admin_bca,
            admin_prefix: prefix,
            comment: data.comment_route || '',
          };
          break;

        default:
          throw new Error('Action inconnue');
      }

      const csvContent = generateCsv(csvHeaders, csvData);
      const csvFilename = `${prefix}_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.csv`;
      const zipFilename = `${prefix}_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.zip`;

      const zip = new JSZip();
      zip.file(csvFilename, csvContent);

      // Gestion des fichiers selon l'action
      if (activeAction === ACTION_TYPES.LIVRAISON_CRVT) {
        const getExt = (file) => file.name.split('.').pop();
        zip.file(`DEVIS_${adminRds}_${formattedDate}.${getExt(files.rop)}`, files.rop);
        zip.file(`CRVTCLIENT_${adminRds}_${formattedDate}.${getExt(files.devis)}`, files.devis);
      }

      if (activeAction === ACTION_TYPES.ROUTE_OPTIQUE) {
        const ext = files.rop.name.split('.').pop();
        // Référence ROP : on utilise admin_contract, sinon admin_prefix, sinon 'REF'
        const refRop = cleanForFilename(data.ref_rop || data.ref_rop || 'REF');
        // Version : soit celle saisie, soit V1 par défaut
        let version = data.version?.trim() || 'V1';
        if (/^\d+$/.test(version)) version = 'V' + version;
        const newName = `ROP_${adminRds}_${refRop}_${formattedDate}_${version}.${ext}`;
        zip.file(newName, files.rop);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const formData = new FormData();
      formData.append('zipFile', zipBlob, zipFilename);
      formData.append('activeTab', activeTabLabel);
      formData.append('admin_rds', data.admin_rds);
      formData.append('admin_bca', data.admin_bca);
      formData.append('admin_prefix', prefix);

      if (activeAction === ACTION_TYPES.MODIFICATION_DATE) {
        formData.append('planning_date', data.new_planning_date);
        formData.append('comment', data.comment_modif || '');
      }

      await axios.post('/api/vt/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Action enregistrée avec succès', { duration: 3000 });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Erreur lors de l\'envoi';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    const config = ACTION_CONFIG[activeAction];

    const commonFields = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">RDS</label>
          <input
            type="text"
            value={data.admin_rds}
            readOnly
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BCA</label>
          <input
            type="text"
            value={data.admin_bca}
            readOnly
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
          />
        </div>
      </div>
    );

    const renderRequiredStar = () => (
      <span className="text-red-500 ml-1">*</span>
    );

    switch (activeAction) {
      case ACTION_TYPES.PLANIFICATION:
        return (
          <>
            {commonFields}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de planification {renderRequiredStar()}
                </label>
                <input
                  type="date"
                  value={data.planning_date}
                  onChange={(e) => setData('planning_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (3-250 caractères)
                </label>
                <textarea
                  value={data.comment_planif}
                  onChange={(e) => setData('comment_planif', e.target.value)}
                  rows="3"
                  maxLength={250}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ajoutez un commentaire si nécessaire..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {data.comment_planif?.length || 0}/250 caractères
                </p>
              </div>
            </div>
          </>
        );

      case ACTION_TYPES.IMPOSSIBILITE:
        return (
          <>
            {commonFields}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif d'échec {renderRequiredStar()}
                </label>
                <select
                  value={data.fail_reason}
                  onChange={(e) => setData('fail_reason', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                >
                  <option value="">-- Sélectionner une raison --</option>
                  <option value="Appel vers le client effectué, en attente de retour">Appel vers le client effectué, en attente de retour</option>
                  <option value="Cas de force majeur">Cas de force majeur</option>
                  <option value="Demande d'annulation de la commande à l'initiative du Client">Demande d'annulation</option>
                  <option value="Evènement public">Evènement public</option>
                  <option value="Le Client est indisponible">Client indisponible</option>
                  <option value="Le Client est injoignable">Client injoignable</option>
                  <option value="Le Client ne sait pas">Client ne sait pas</option>
                  <option value="Le Client ne veut pas">Client ne veut pas</option>
                  <option value="Le contact Client est obsolète">Contact client obsolète</option>
                  <option value="Le Site Client est en construction">Site en construction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de planification {renderRequiredStar()}
                </label>
                <input
                  type="date"
                  value={data.planning_date}
                  onChange={(e) => setData('planning_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (3-250 caractères)
                </label>
                <textarea
                  value={data.comment_imposs}
                  onChange={(e) => setData('comment_imposs', e.target.value)}
                  rows="3"
                  maxLength={250}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  placeholder="Décrivez les raisons..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {data.comment_imposs?.length || 0}/250 caractères
                </p>
              </div>
            </div>
          </>
        );

      case ACTION_TYPES.MODIFICATION_DATE:
        return (
          <>
            {commonFields}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouvelle date de planification {renderRequiredStar()}
                </label>
                <input
                  type="date"
                  value={data.new_planning_date}
                  onChange={(e) => setData('new_planning_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif de modification (3-250 caractères)
                </label>
                <textarea
                  value={data.comment_modif}
                  onChange={(e) => setData('comment_modif', e.target.value)}
                  rows="3"
                  maxLength={250}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                  placeholder="Indiquez la raison du changement..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {data.comment_modif?.length || 0}/250 caractères
                </p>
              </div>
            </div>
          </>
        );

      case ACTION_TYPES.LIVRAISON_CRVT:
        return (
          <>
            {commonFields}
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date effective {renderRequiredStar()}
                  </label>
                  <input
                    type="date"
                    value={data.effective_date}
                    onChange={(e) => setData('effective_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de soumission {renderRequiredStar()}
                  </label>
                  <input
                    type="date"
                    value={data.submission_date}
                    onChange={(e) => setData('submission_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Résultat {renderRequiredStar()}
                </label>
                <select
                  value={data.result_status}
                  onChange={(e) => setData('result_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value="Blocage privé">Blocage privé</option>
                  <option value="Blocage public">Blocage public</option>
                  <option value="Blocage privé et public">Blocage privé et public</option>
                  <option value="Pas de blocage">Pas de blocage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Infrastructure à créer
                </label>
                <select
                  value={data.infra_to_be_created}
                  onChange={(e) => setData('infra_to_be_created', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value={false}>Non</option>
                  <option value={true}>Oui</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (max 500 caractères)
                </label>
                <textarea
                  value={data.comment_livraison}
                  onChange={(e) => setData('comment_livraison', e.target.value)}
                  rows="3"
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  placeholder="Détails de l'intervention..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {data.comment_livraison?.length || 0}/500 caractères
                </p>
              </div>

              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devis {renderRequiredStar()}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'rop')}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {files.rop && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      ✓ {files.rop.name}
                    </p>
                  )}
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CR VT Client {renderRequiredStar()}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'devis')}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {files.devis && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      ✓ {files.devis.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        );

      case ACTION_TYPES.ROUTE_OPTIQUE:
        return (
          <>
            {commonFields}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version du fichier ROP (ex: V1, V2, 1, 2...)
                </label>
                <input
                  type="text"
                  placeholder="V1"
                  value={data.version}
                  onChange={(e) => setData('version', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour utiliser V1 par défaut
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (3-250 caractères)
                </label>
                <textarea
                  value={data.comment_route}
                  onChange={(e) => setData('comment_route', e.target.value)}
                  rows="3"
                  maxLength={250}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  placeholder="Ajoutez un commentaire..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {data.comment_route?.length || 0}/250 caractères
                </p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier ROP (ZIP) {renderRequiredStar()}
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'rop')}
                  accept=".zip"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {files.rop && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    ✓ {files.rop.name}
                  </p>
                )}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const currentConfig = ACTION_CONFIG[activeAction];
  const buttonColor = {
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
  }[currentConfig?.color] || 'bg-gray-600';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with tabs */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 pt-4">
        <nav className="flex flex-wrap gap-2" aria-label="Actions">
          {Object.entries(ACTION_TYPES).map(([key, value]) => {
            const config = ACTION_CONFIG[value];
            const isActive = activeAction === value;
            const baseClasses = "px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200";
            const activeClasses = isActive
              ? `bg-white text-${config.color}-700 border-b-2 border-${config.color}-500 shadow-sm`
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100";
            return (
              <button
                key={key}
                onClick={() => setActiveAction(value)}
                className={`${baseClasses} ${activeClasses}`}
              >
                {config.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Form content */}
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          {renderFormFields()}

          <div className="mt-8 flex justify-end space-x-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg text-white font-medium ${buttonColor} disabled:opacity-50 transition transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              {isSubmitting ? 'Envoi en cours...' : currentConfig?.submitText || 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
