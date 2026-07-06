import React from 'react';
import { Link } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import { 
  FiArrowLeft, 
  FiInfo, 
  FiTag, 
  FiHash, 
  FiCalendar, 
  FiFile, 
  FiClock, 
  FiUsers,
  FiCode,
  FiDatabase,
  FiXCircle,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';

export default function Show({ annulation }) {
  // Badge de version active
  const versionBadge = annulation.is_current_version ? (
    <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
      <FiCheckCircle className="w-3 h-3" /> Active
    </span>
  ) : (
    <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
      Archive
    </span>
  );

  // Icône pour la raison d'échec
  const failReasonIcon = annulation.fail_reason ? 
    <FiAlertCircle className="w-4 h-4 text-rose-500" /> : 
    <FiInfo className="w-4 h-4 text-slate-400" />;

  return (
    <Main>
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* En-tête avec retour */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/annulations"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-rose-600 font-medium transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              Retour
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-r from-rose-600 to-red-600 text-white p-2 rounded-xl">
                <FiXCircle className="w-6 h-6" />
              </span>
              Annulation #{annulation.id}
              {versionBadge}
            </h1>
          </div>
          <div className="text-sm text-slate-500">
            Importée le {new Date(annulation.imported_at).toLocaleString('fr-FR')}
          </div>
        </div>

        {/* Grille d'informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Carte : Identifiants */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-4 mb-4">
              <FiUsers className="w-5 h-5 text-rose-600" />
              Identifiants
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FiHash className="w-4 h-4" /> ID
                </dt>
                <dd className="text-sm font-semibold text-slate-800">{annulation.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FiTag className="w-4 h-4" /> Admin RDS
                </dt>
                <dd className="text-sm font-semibold text-slate-800">{annulation.admin_rds}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FiTag className="w-4 h-4" /> Admin BCA
                </dt>
                <dd className="text-sm font-semibold text-slate-800">{annulation.admin_bca}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FiFile className="w-4 h-4" /> Contrat
                </dt>
                <dd className="text-sm font-semibold text-slate-800">{annulation.admin_contract}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FiCode className="w-4 h-4" /> Préfixe
                </dt>
                <dd className="text-sm font-semibold text-slate-800">{annulation.admin_prefix}</dd>
              </div>
            </dl>
          </div>

          {/* Carte : Détails de l'annulation */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-4 mb-4">
              <FiXCircle className="w-5 h-5 text-rose-600" />
              Détails de l'annulation
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" /> Date d'annulation
                </dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {annulation.cancellation_date 
                    ? new Date(annulation.cancellation_date).toLocaleDateString('fr-FR')
                    : 'N/A'
                  }
                </dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  {failReasonIcon} Raison d'échec
                </dt>
                <dd className="text-sm font-semibold text-slate-800 text-right max-w-[60%] break-words">
                  {annulation.fail_reason ?? 'Non renseignée'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Carte : Informations fichier source */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-4 mb-4">
              <FiFile className="w-5 h-5 text-rose-600" />
              Informations fichier source
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Fichier source</dt>
                <dd className="text-sm font-semibold text-slate-800 truncate" title={annulation.source_file}>
                  {annulation.source_file}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" /> Date fichier
                </dt>
                <dd className="text-sm font-semibold text-slate-800">{annulation.file_date ?? 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FiClock className="w-4 h-4" /> Heure fichier
                </dt>
                <dd className="text-sm font-semibold text-slate-800">{annulation.file_time ?? 'N/A'}</dd>
              </div>
            </div>
          </div>

          {/* Carte : Dates système */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-4 mb-4">
              <FiClock className="w-5 h-5 text-rose-600" />
              Dates système
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Importé le</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {new Date(annulation.imported_at).toLocaleString('fr-FR')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Créé le</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {new Date(annulation.created_at).toLocaleString('fr-FR')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Mis à jour le</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {new Date(annulation.updated_at).toLocaleString('fr-FR')}
                </dd>
              </div>
            </div>
          </div>

        </div>

        {/* Bouton retour */}
        <div className="mt-8">
          <Link
            href="/annulations"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-md shadow-rose-500/30 transition-all transform hover:scale-[1.02]"
          >
            <FiArrowLeft className="w-5 h-5" />
            Retour à la liste des annulations
          </Link>
        </div>
      </div>
    </Main>
  );
}
