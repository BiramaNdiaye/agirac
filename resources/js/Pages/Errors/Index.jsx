// resources/js/Pages/Error/Error.jsx

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import toast from 'react-hot-toast';

// ── Icons (inline SVG pour éviter les imports manquants) ──────────────────────

const IconChevronLeft  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>;
const IconChevronRight = ({ rotated }) => <svg className={`w-5 h-5 text-gray-400 transition-transform ${rotated ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>;
const IconEye          = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const IconEyeOff       = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>;
const IconDownload     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const IconWarning      = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>;
const IconDoc          = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>;
const IconTable        = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>;
const IconCode         = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${bytes.toFixed(2)} ${units[i]}`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Bandeau rouge listant les erreurs CSV brutes d'un fichier */
function CsvErrorBanner({ errors }) {
  const [open, setOpen] = useState(false);
  if (!errors || errors.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <IconWarning />
          {errors.length} erreur(s) détectée(s) dans ce fichier
        </span>
        <IconChevronRight rotated={open} />
      </button>

      {open && (
        <ul className="divide-y divide-red-100 px-4 pb-3">
          {errors.map((err, i) => (
            <li key={i} className="py-2">
              <span className="inline-block text-xs font-semibold text-red-400 mr-2">
                Ligne {err.line}
              </span>
              <span className="text-sm text-red-800 font-mono break-all">
                {err.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Tableau CSV paginé */
function CsvTable({ headers, rows, limit = 10 }) {
  if (!headers?.length) return <p className="text-gray-500 text-sm">Aucune donnée CSV</p>;
  const display = rows.slice(0, limit);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h || `Col. ${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {display.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50">
              {headers.map((h, ci) => (
                <td key={ci} className="px-3 py-2 text-sm text-gray-700">{row[h] ?? '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > limit && (
        <p className="text-xs text-gray-400 mt-2 px-1">
          … {rows.length - limit} ligne(s) supplémentaire(s) non affichée(s)
        </p>
      )}
    </div>
  );
}

/** Bloc d'un fichier extrait (CSV ou TXT) */
function FileBlock({ file, fileKey }) {
  const [open, setOpen]       = useState(false);
  const [viewMode, setMode]   = useState('table');

  const isCsv = !!file.headers;
  const hasCsvErrors = file.csv_errors?.length > 0;

  const FileIcon = isCsv ? IconTable : IconCode;
  const iconColor = isCsv ? 'text-green-500' : 'text-blue-500';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* En-tête cliquable */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className={iconColor}><FileIcon /></span>
          <div>
            <p className="font-medium text-gray-800 flex items-center gap-2">
              {file.name}
              {hasCsvErrors && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                  {file.csv_errors.length} erreur(s)
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
          </div>
        </div>
        <IconChevronRight rotated={open} />
      </div>

      {/* Contenu déplié */}
      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4">

          {/* ── Erreurs CSV brutes ── */}
          {isCsv && <CsvErrorBanner errors={file.csv_errors} />}

          {/* ── Données CSV ── */}
          {isCsv && (
            <div className="space-y-3">
              {/* Sélecteur de vue */}
              <div className="flex gap-2">
                {['table', 'json'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setMode(mode)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mode === 'table' ? 'Tableau' : 'JSON'}
                  </button>
                ))}
              </div>

              {viewMode === 'table' && <CsvTable headers={file.headers} rows={file.rows} />}
              {viewMode === 'json' && (
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(file.rows, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* ── Fichier texte simple ── */}
          {!isCsv && file.content && (
            <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">
              {file.content}
            </pre>
          )}

          {/* ── Binaire ── */}
          {!isCsv && !file.content && (
            <p className="text-sm text-gray-500">Type de fichier non pris en charge pour l'affichage</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Carte d'un ZIP entier */
function ZipCard({ zip, zipIndex, isNew = false }) {
  const [open, setOpen] = useState(false);

  const totalCsvErrors = zip.files?.reduce(
    (sum, f) => sum + (f.csv_errors?.length ?? 0), 0
  ) ?? 0;

  const hasAnyError = zip.error_text || totalCsvErrors > 0;

  const handleDownload = () => {
    router.visit(`/errors/download/${zip.zip_name}`, { method: 'get', preserveScroll: true });
    toast.success('Téléchargement lancé', {
      icon: '📥',
      style: { borderRadius: '10px', background: '#10b981', color: '#fff' },
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">

      {/* En-tête ZIP */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-red-100 rounded-lg text-red-500">
            <IconDoc />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-800">{zip.zip_name}</h3>
                {isNew && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full animate-pulse">
                    NOUVEAU
                  </span>
                )}
                {zip.admin_type && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {ADMIN_LABEL[zip.admin_type] ?? zip.admin_type}
                  </span>
                )}
                  {hasAnyError && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                    {totalCsvErrors > 0
                      ? `${totalCsvErrors} erreur(s) CSV`
                      : 'Erreur détectée'}
                  </span>
                )}
              </div>
            <p className="text-sm text-gray-500 mt-1">
              {zip.files?.length ?? 0} fichier(s) • {zip.source_path}
              {zip.last_modified && (
                <span className="ml-2 text-xs text-gray-400">
                  · {new Date(zip.last_modified * 1000).toLocaleString('fr-FR')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={e => { e.stopPropagation(); handleDownload(); }}
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            title="Télécharger le ZIP"
          >
            <IconDownload />
          </button>
          {open ? <IconEyeOff /> : <IconEye />}
        </div>
      </div>

      {/* Contenu déplié */}
      {open && (
        <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">

          {/* error.txt */}
          {zip.error_text && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5"><IconWarning /></span>
                <div>
                  <p className="font-semibold text-red-800 text-sm">error.txt</p>
                  <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap font-mono">
                    {zip.error_text}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Fichiers */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Contenu du ZIP</h4>
            {zip.files?.map((file, fi) => (
              <FileBlock
                key={fi}
                file={file}
                fileKey={`${zipIndex}-${fi}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons supplémentaires ─────────────────────────────────────────────────────

const IconSearch = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/></svg>;
const IconX      = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;

// ── Barre de recherche / filtres ──────────────────────────────────────────────

const ADMIN_TYPES = ['admin_rds', 'admin_bca'];

/**
 * Extrait le type d'admin depuis le nom du ZIP.
 * Ex: "admin_rds_20240101_export.zip" → "admin_rds"
 */
const getAdminType = (zipName) => {
  const lower = zipName.toLowerCase();
  return ADMIN_TYPES.find(t => lower.includes(t)) ?? null;
};

function SearchBar({ search, onSearch, activeFilter, onFilter }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-3">
      {/* Champ texte libre */}
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <IconSearch />
        </span>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Rechercher par nom de fichier…"
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 transition"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IconX />
          </button>
        )}
      </div>

      {/* Boutons filtres rapides */}
      <div className="flex gap-2">
        {ADMIN_TYPES.map(type => (
          <button
            key={type}
            onClick={() => onFilter(activeFilter === type ? null : type)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
              activeFilter === type
                ? 'bg-red-500 text-white border-red-500 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
            }`}
          >
            {type}
          </button>
        ))}

        {/* Réinitialiser si un filtre est actif */}
        {(search || activeFilter) && (
          <button
            onClick={() => { onSearch(''); onFilter(null); }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-500 hover:text-red-500 hover:border-red-300 transition-all duration-150"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

// ── Clé localStorage ─────────────────────────────────────────────────────────
const LS_KEY = 'error_seen_zips'; // Set de zip_name déjà vus

/** Récupère l'ensemble des noms déjà vus depuis localStorage */
const getSeenZips = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
};

/** Persiste l'ensemble des noms vus */
const saveSeenZips = (set) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {}
};

// ── Bandeau d'alerte nouveaux fichiers ────────────────────────────────────────

const ADMIN_LABEL = { admin_rds: 'RDS', admin_bca: 'BCA' };

function NewFilesAlert({ newFiles, onDismiss }) {
  if (!newFiles.length) return null;

  const byType = newFiles.reduce((acc, zip) => {
    const key = zip.admin_type ?? 'autre';
    acc[key] = (acc[key] ?? []);
    acc[key].push(zip.zip_name);
    return acc;
  }, {});

  return (
    <div className="mb-6 rounded-2xl border border-orange-300 bg-orange-50 shadow-md overflow-hidden">
      {/* Titre */}
      <div className="flex items-center justify-between px-5 py-3 bg-orange-100 border-b border-orange-200">
        <div className="flex items-center gap-2 text-orange-700 font-semibold">
          <IconWarning />
          {newFiles.length} nouveau{newFiles.length > 1 ? 'x' : ''} fichier{newFiles.length > 1 ? 's' : ''} d'erreur détecté{newFiles.length > 1 ? 's' : ''}
        </div>
        <button
          onClick={onDismiss}
          className="text-orange-400 hover:text-orange-700 transition-colors"
          title="Marquer tout comme vu"
        >
          <IconX />
        </button>
      </div>

      {/* Détail par type admin */}
      <div className="px-5 py-3 flex flex-wrap gap-4">
        {Object.entries(byType).map(([type, names]) => (
          <div key={type} className="flex-1 min-w-[180px]">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">
              {ADMIN_LABEL[type] ?? type} — {names.length} fichier{names.length > 1 ? 's' : ''}
            </p>
            <ul className="space-y-0.5">
              {names.map(name => (
                <li key={name} className="text-sm text-orange-800 font-mono truncate" title={name}>
                  • {name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="px-5 py-2 border-t border-orange-200 text-right">
        <button
          onClick={onDismiss}
          className="text-xs text-orange-500 hover:text-orange-700 underline transition-colors"
        >
          Marquer tous comme vus
        </button>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;

  const pages = Array.from({ length: total }, (_, i) => i + 1);

  // Fenêtre glissante : toujours afficher max 5 numéros de page
  const window = (() => {
    if (total <= 7) return pages;
    if (current <= 4) return [...pages.slice(0, 5), '…', total];
    if (current >= total - 3) return [1, '…', ...pages.slice(total - 5)];
    return [1, '…', current - 1, current, current + 1, '…', total];
  })();

  const btn = (label, page, active = false, disabled = false) => (
    <button
      key={label}
      onClick={() => !disabled && typeof page === 'number' && onChange(page)}
      disabled={disabled}
      className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all duration-150 border
        ${active
          ? 'bg-red-500 text-white border-red-500 shadow'
          : disabled
            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
            : typeof page !== 'number'
              ? 'bg-white text-gray-400 border-transparent cursor-default'
              : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Page <span className="font-medium text-gray-700">{current}</span> sur{' '}
        <span className="font-medium text-gray-700">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        {btn('←', current - 1, false, current === 1)}
        {window.map((p, i) =>
          p === '…'
            ? btn('…', '…', false, false)
            : btn(p, p, p === current, false)
        )}
        {btn('→', current + 1, false, current === total)}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function Error({ auth, zipFiles = [], totalFiles = 0 }) {
  const [search, setSearch]             = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [newFiles, setNewFiles]         = useState([]);
  const [page, setPage]                 = useState(1);

  // ── Détection des nouveaux fichiers au montage ────────────────────────────
  const { useEffect } = React;
  useEffect(() => {
    const seen    = getSeenZips();
    const unseen  = zipFiles.filter(z => !seen.has(z.zip_name));

    if (unseen.length > 0) {
      setNewFiles(unseen);
      toast(`🆕 ${unseen.length} nouveau${unseen.length > 1 ? 'x' : ''} fichier${unseen.length > 1 ? 's' : ''} d'erreur`, {
        style: { borderRadius: '10px', background: '#f97316', color: '#fff' },
        duration: 4000,
      });
    }

    const updated = new Set([...seen, ...zipFiles.map(z => z.zip_name)]);
    saveSeenZips(updated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissAlert = () => setNewFiles([]);

  // ── Tri par date décroissante ─────────────────────────────────────────────
  const sorted = [...zipFiles].sort((a, b) => (b.last_modified ?? 0) - (a.last_modified ?? 0));

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = sorted.filter(zip => {
    const name        = zip.zip_name.toLowerCase();
    const matchSearch = search === '' || name.includes(search.toLowerCase());
    const matchFilter = !activeFilter || name.includes(activeFilter);
    return matchSearch && matchFilter;
  });

  // Remettre à la page 1 quand le filtre change
  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleFilter = (v) => { setActiveFilter(v); setPage(1); };

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Main user={auth.user}>
      <Head title="Fichiers d'erreur" />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.visit('/dashboard')}
                className="group flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:shadow-lg hover:border-[#46BA68] transition-all duration-200"
              >
                <span className="mr-2 group-hover:-translate-x-1 transition-transform">
                  <IconChevronLeft />
                </span>
                Retour au dashboard
              </button>

              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    Fichiers d'erreur
                  </span>
                </h1>
                <p className="text-gray-600">Fichiers rejetés par le système de traitement</p>
              </div>

              <div className="w-32 flex justify-end">
                {newFiles.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm font-bold rounded-full shadow animate-pulse">
                    🆕 {newFiles.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alerte nouveaux fichiers */}
          <NewFilesAlert newFiles={newFiles} onDismiss={dismissAlert} />

          {/* Statistiques */}
          <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-lg border border-red-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-2xl text-red-500">
                  <IconWarning />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-700">{totalFiles} fichier(s) d'erreur</h2>
                  <p className="text-sm text-red-600 mt-1">Fichiers ZIP contenant des erreurs de traitement</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                Dernière mise à jour : {new Date().toLocaleString('fr-FR')}
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          {totalFiles > 0 && (
            <SearchBar
              search={search}
              onSearch={handleSearch}
              activeFilter={activeFilter}
              onFilter={handleFilter}
            />
          )}

          {/* Contenu */}
          {totalFiles === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p className="text-xl font-medium text-gray-700">Aucun fichier d'erreur</p>
                <p className="text-sm text-gray-400">Tous les fichiers ont été traités avec succès</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <p className="text-lg font-medium text-gray-500">Aucun résultat pour cette recherche</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeFilter
                  ? `Aucun fichier ZIP ne contient "${activeFilter}"${search ? ` et "${search}"` : ''}`
                  : `Aucun fichier ZIP ne correspond à "${search}"`}
              </p>
            </div>
          ) : (
            <>
              {/* Compteur */}
              <p className="text-sm text-gray-500 mb-3">
                {(search || activeFilter)
                  ? <>{filtered.length} résultat(s) sur {totalFiles}{activeFilter && <span className="ml-1 font-medium text-red-600">· {activeFilter}</span>} — </>
                  : null}
                Affichage {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>

              {/* Liste paginée */}
              <div className="space-y-4">
                {paginated.map((zip, i) => (
                  <ZipCard
                    key={zip.zip_name}
                    zip={zip}
                    zipIndex={(page - 1) * PAGE_SIZE + i}
                    isNew={newFiles.some(n => n.zip_name === zip.zip_name)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Pagination current={page} total={totalPages} onChange={setPage} />
            </>
          )}

        </div>
      </div>
    </Main>
  );
}
