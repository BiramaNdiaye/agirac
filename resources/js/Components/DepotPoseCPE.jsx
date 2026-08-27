// resources/js/Components/DepotPoseCPE.jsx
import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  Upload, 
  FileText, 
  Calendar,
  Clock,
  User,
  Package,
  Wifi,
  Smartphone,
  Monitor,
  Download,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';

export default function DepotPoseCPE({ order, onSuccess, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState({
    cpe_photo: null,
    installation_report: null,
    technical_sheet: null,
  });

  const { data, setData } = useForm({
    admin_rds: order?.admin_rds || '',
    admin_bca: order?.admin_bca || '',
    admin_prefix: order?.admin_prefix || '',
    cpe_installed: order?.cpe_installed || false,
    cpe_serial: order?.cpe_serial || '',
    cpe_model: order?.cpe_model || '',
    cpe_type: order?.cpe_type || 'router',
    installation_date: new Date().toISOString().split('T')[0],
    installation_time: new Date().toTimeString().slice(0, 5),
    technician_name: '',
    technician_id: '',
    client_signature: false,
    observations: '',
    wifi_ssid: '',
    wifi_password: '',
    connection_status: 'ok',
    signal_strength: 'good',
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 10MB');
        e.target.value = '';
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format de fichier non supporté. Utilisez JPG, PNG ou PDF');
        e.target.value = '';
        return;
      }

      setFiles(prev => ({ ...prev, [type]: file }));
      toast.success(`Fichier ${file.name} chargé avec succès`);
    }
  };

  const removeFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    toast.success('Fichier supprimé');
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

  const validateForm = () => {
    if (!data.installation_date) {
      toast.error('La date d\'installation est obligatoire');
      return false;
    }
    if (!data.technician_name) {
      toast.error('Le nom du technicien est obligatoire');
      return false;
    }
    if (!data.cpe_serial) {
      toast.error('Le numéro de série du CPE est obligatoire');
      return false;
    }
    if (!data.cpe_model) {
      toast.error('Le modèle du CPE est obligatoire');
      return false;
    }
    if (!files.cpe_photo) {
      toast.error('La photo du CPE installé est obligatoire');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const today = new Date();
      const formattedDate = today.toISOString().slice(0, 10).replace(/-/g, '');
      const formattedTime = today.toTimeString().slice(0, 5).replace(':', '');
      
      const adminRds = cleanForFilename(data.admin_rds);
      const adminBcaRef = cleanForFilename(data.admin_bca);
      const prefix = 'POSECPE';

      // Create CSV content
      const csvHeaders = [
        'admin_rds', 'admin_bca', 'admin_prefix',
        'cpe_installed', 'cpe_serial', 'cpe_model', 'cpe_type',
        'installation_date', 'installation_time',
        'technician_name', 'technician_id',
        'client_signature', 'observations',
        'wifi_ssid', 'wifi_password',
        'connection_status', 'signal_strength'
      ];

      const escapeCSVValue = (value) => {
        if (value == null || value === undefined) return '';
        let str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const row = csvHeaders.map(header => {
        const value = data[header] !== undefined ? data[header] : '';
        return escapeCSVValue(value);
      });

      const csvContent = `${csvHeaders.join(',')}\n${row.join(',')}`;
      const csvFilename = `${prefix}_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.csv`;
      const zipFilename = `${prefix}_${adminRds}_${adminBcaRef}_${formattedDate}_${formattedTime}.zip`;

      // Create ZIP
      const zip = new JSZip();
      zip.file(csvFilename, csvContent);

      // Add files to ZIP
      const getExt = (file) => file.name.split('.').pop();
      
      // CPE Photo
      if (files.cpe_photo) {
        const ext = getExt(files.cpe_photo);
        zip.file(`CPE_PHOTO_${adminRds}_${formattedDate}.${ext}`, files.cpe_photo);
      }

      // Installation Report
      if (files.installation_report) {
        const ext = getExt(files.installation_report);
        zip.file(`INSTALLATION_REPORT_${adminRds}_${formattedDate}.${ext}`, files.installation_report);
      }

      // Technical Sheet
      if (files.technical_sheet) {
        const ext = getExt(files.technical_sheet);
        zip.file(`TECHNICAL_SHEET_${adminRds}_${formattedDate}.${ext}`, files.technical_sheet);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const formData = new FormData();
      formData.append('zipFile', zipBlob, zipFilename);
      formData.append('type', 'pose_cpe');
      formData.append('admin_rds', data.admin_rds);
      formData.append('admin_bca', data.admin_bca);

      await axios.post('/api/pose-cpe/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Installation CPE enregistrée avec succès', { duration: 3000 });
      
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Dépot Pose CPE</h2>
              <p className="text-green-100 text-sm">
                {order?.admin_rds} - {order?.admin_bca}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations du CPE */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Informations du CPE
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPE Installé
            </label>
            <select
              value={data.cpe_installed}
              onChange={(e) => setData('cpe_installed', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            >
              <option value={false}>Non</option>
              <option value={true}>Oui</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de CPE
            </label>
            <select
              value={data.cpe_type}
              onChange={(e) => setData('cpe_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            >
              <option value="router">Routeur</option>
              <option value="switch">Switch</option>
              <option value="firewall">Firewall</option>
              <option value="access_point">Point d'accès</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modèle <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.cpe_model}
              onChange={(e) => setData('cpe_model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Ex: Cisco 1921, MikroTik RB750..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de série <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.cpe_serial}
              onChange={(e) => setData('cpe_serial', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition font-mono"
              placeholder="Ex: SN123456789"
            />
          </div>

          {/* Installation */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Installation
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'installation <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={data.installation_date}
              onChange={(e) => setData('installation_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure d'installation
            </label>
            <input
              type="time"
              value={data.installation_time}
              onChange={(e) => setData('installation_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>

          {/* Technicien */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Technicien
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du technicien <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.technician_name}
              onChange={(e) => setData('technician_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Nom complet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Technicien
            </label>
            <input
              type="text"
              value={data.technician_id}
              onChange={(e) => setData('technician_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Matricule ou ID"
            />
          </div>

          {/* WiFi */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-600" />
              Configuration WiFi
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SSID
            </label>
            <input
              type="text"
              value={data.wifi_ssid}
              onChange={(e) => setData('wifi_ssid', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Nom du réseau WiFi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe WiFi
            </label>
            <input
              type="text"
              value={data.wifi_password}
              onChange={(e) => setData('wifi_password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Mot de passe (min 8 caractères)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut de connexion
            </label>
            <select
              value={data.connection_status}
              onChange={(e) => setData('connection_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            >
              <option value="ok">OK - Connecté</option>
              <option value="partial">Partiel</option>
              <option value="ko">KO - Non connecté</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Force du signal
            </label>
            <select
              value={data.signal_strength}
              onChange={(e) => setData('signal_strength', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Bon</option>
              <option value="average">Moyen</option>
              <option value="poor">Faible</option>
            </select>
          </div>

          {/* Observations */}
          <div className="col-span-2 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observations
            </label>
            <textarea
              value={data.observations}
              onChange={(e) => setData('observations', e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Remarques, problèmes rencontrés, etc..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {data.observations?.length || 0}/500 caractères
            </p>
          </div>

          {/* Signature client */}
          <div className="col-span-2 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.client_signature}
                onChange={(e) => setData('client_signature', e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">
                Client a signé le procès-verbal d'installation
              </span>
            </label>
          </div>

          {/* Fichiers */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Documents
            </h3>
          </div>

          {/* Photo CPE */}
          <div className="col-span-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 transition">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo du CPE installé <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'cpe_photo')}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {files.cpe_photo && (
                  <button
                    type="button"
                    onClick={() => removeFile('cpe_photo')}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              {files.cpe_photo && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {files.cpe_photo.name}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Formats acceptés: JPG, PNG, PDF (max 10MB)
              </p>
            </div>
          </div>

          {/* Rapport d'installation */}
          <div className="col-span-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 transition">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rapport d'installation (optionnel)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'installation_report')}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {files.installation_report && (
                  <button
                    type="button"
                    onClick={() => removeFile('installation_report')}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              {files.installation_report && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {files.installation_report.name}
                </p>
              )}
            </div>
          </div>

          {/* Fiche technique */}
          <div className="col-span-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 transition">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiche technique (optionnel)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,.xls,.xlsx"
                  onChange={(e) => handleFileChange(e, 'technical_sheet')}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {files.technical_sheet && (
                  <button
                    type="button"
                    onClick={() => removeFile('technical_sheet')}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              {files.technical_sheet && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {files.technical_sheet.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Envoi en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Enregistrer l'installation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
