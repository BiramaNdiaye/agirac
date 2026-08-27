// resources/js/Pages/OTPOSECPECVG/Show.jsx
import React, { useState } from 'react';
import { Head, Link, usePage } from "@inertiajs/react";
import Main from '@/Layouts/GuestLayout';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Building, 
  User, 
  Phone, 
  Mail,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Wifi,
  Monitor,
  HardDrive,
  Server,
  Printer,
  Copy,
  Share2,
  MoreVertical
} from 'lucide-react';
import DepotPoseCPE from '@/Components/DepotPoseCPE';
import DepotActionVTComplet from '@/Components/DepotActionVTComplet';

export default function Show({ otposecpecvg }) {
  const [showPoseCPEModal, setShowPoseCPEModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { props } = usePage();
  const { auth } = props;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'planifié': { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      'en_cours': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'impossible': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'livré': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'modifié': { color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
    };
    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = statusInfo.icon;
    return (
      <span className={`px-3 py-1 inline-flex items-center gap-1.5 text-sm font-medium rounded-full ${statusInfo.color}`}>
        <Icon className="w-4 h-4" />
        {status || 'En attente'}
      </span>
    );
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 mt-1">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value || '—'}</p>
      </div>
    </div>
  );

  const ActionCard = ({ title, icon: Icon, description, onClick, color = 'blue' }) => (
    <button
      onClick={onClick}
      className="group relative p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 text-left w-full"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-${color}-50 group-hover:bg-${color}-100 transition`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
      </div>
    </button>
  );

  return (
    <Main>
      <Head title={`OTPOSECPECVG - ${otposecpecvg.admin_rds}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href={route('otposecpecvg.index')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
                    {otposecpecvg.admin_rds}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{otposecpecvg.admin_bca}</span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {otposecpecvg.operator_name || 'Opérateur inconnu'}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {otposecpecvg.address_site_a_town || 'Ville inconnue'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(otposecpecvg.status)}
              <button
                onClick={() => setShowActionModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
              >
                <MoreVertical className="w-4 h-4" />
                Actions
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Détails
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'actions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actions
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'historique'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historique
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations principales */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Informations générales
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow
                      label="RDS"
                      value={otposecpecvg.admin_rds}
                      icon={FileText}
                    />
                    <InfoRow
                      label="BCA"
                      value={otposecpecvg.admin_bca}
                      icon={FileText}
                    />
                    <InfoRow
                      label="Préfixe"
                      value={otposecpecvg.admin_prefix}
                      icon={FileText}
                    />
                    <InfoRow
                      label="Opérateur"
                      value={otposecpecvg.operator_name}
                      icon={Building}
                    />
                    <InfoRow
                      label="Ville"
                      value={otposecpecvg.address_site_a_town}
                      icon={MapPin}
                    />
                    <InfoRow
                      label="Adresse"
                      value={otposecpecvg.address_site_a_street}
                      icon={MapPin}
                    />
                    <InfoRow
                      label="Code postal"
                      value={otposecpecvg.address_site_a_zip}
                      icon={MapPin}
                    />
                    <InfoRow
                      label="Statut"
                      value={otposecpecvg.status || 'En attente'}
                      icon={AlertCircle}
                    />
                  </div>
                </div>
              </div>

              {/* Informations techniques */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-600" />
                    Informations techniques
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow
                      label="Capacité câble"
                      value={otposecpecvg.cable_capacity}
                      icon={HardDrive}
                    />
                    <InfoRow
                      label="Longueur GC"
                      value={otposecpecvg.gc_length}
                      icon={Monitor}
                    />
                    <InfoRow
                      label="Infrastructure à créer"
                      value={otposecpecvg.infra_to_be_created ? 'Oui' : 'Non'}
                      icon={Building}
                    />
                    <InfoRow
                      label="Pôle d'intervention"
                      value={otposecpecvg.pole_intervention}
                      icon={MapPin}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions rapides */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Actions rapides
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <ActionCard
                    title="Pose CPE"
                    description="Enregistrer l'installation du CPE"
                    icon={Monitor}
                    onClick={() => setShowPoseCPEModal(true)}
                    color="green"
                  />
                  <ActionCard
                    title="Planifier la VT"
                    description="Planifier la visite technique"
                    icon={Calendar}
                    onClick={() => setShowActionModal(true)}
                    color="blue"
                  />
                  <ActionCard
                    title="Route Optique"
                    description="Déposer la route optique"
                    icon={Wifi}
                    onClick={() => setShowActionModal(true)}
                    color="purple"
                  />
                </div>
              </div>

              {/* Informations CPE */}
              {otposecpecvg.cpe_installed && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50/30">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      CPE Installé
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <InfoRow
                        label="Modèle"
                        value={otposecpecvg.cpe_model}
                        icon={Monitor}
                      />
                      <InfoRow
                        label="Numéro de série"
                        value={otposecpecvg.cpe_serial}
                        icon={Package}
                      />
                      <InfoRow
                        label="Date d'installation"
                        value={formatDate(otposecpecvg.installation_date)}
                        icon={Calendar}
                      />
                      <InfoRow
                        label="Technicien"
                        value={otposecpecvg.technician_name}
                        icon={User}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              title="Planifier la VT"
              description="Planifier la visite technique"
              icon={Calendar}
              onClick={() => setShowActionModal(true)}
              color="blue"
            />
            <ActionCard
              title="Impossibilité"
              description="Signaler une impossibilité"
              icon={XCircle}
              onClick={() => setShowActionModal(true)}
              color="red"
            />
            <ActionCard
              title="Modifier la date"
              description="Modifier la date de planification"
              icon={Edit}
              onClick={() => setShowActionModal(true)}
              color="yellow"
            />
            <ActionCard
              title="Livrer CRVT"
              description="Livrer le CRVT client"
              icon={Printer}
              onClick={() => setShowActionModal(true)}
              color="purple"
            />
            <ActionCard
              title="Route Optique"
              description="Déposer la route optique"
              icon={Wifi}
              onClick={() => setShowActionModal(true)}
              color="green"
            />
            <ActionCard
              title="Pose CPE"
              description="Installer le CPE"
              icon={Monitor}
              onClick={() => setShowPoseCPEModal(true)}
              color="emerald"
            />
          </div>
        )}

        {activeTab === 'historique' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Historique des actions
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-100 rounded-full p-4">
                    <Clock className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <p className="text-gray-500">
                  Aucun historique disponible pour cet enregistrement
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Pose CPE */}
      {showPoseCPEModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
              onClick={() => setShowPoseCPEModal(false)}
            ></div>

            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <DepotPoseCPE
                order={otposecpecvg}
                onSuccess={() => {
                  setShowPoseCPEModal(false);
                  // Refresh page or update data
                  window.location.reload();
                }}
                onClose={() => setShowPoseCPEModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Actions VT */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
              onClick={() => setShowActionModal(false)}
            ></div>

            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <DepotActionVTComplet
                order={otposecpecvg}
                onSuccess={() => {
                  setShowActionModal(false);
                  window.location.reload();
                }}
                onClose={() => setShowActionModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </Main>
  );
}
