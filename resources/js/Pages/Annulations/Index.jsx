import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import { FiSearch, FiX, FiEye, FiCalendar, FiFile, FiLink } from 'react-icons/fi';

export default function Index({ annulations, filters }) {
  const { data, setData, get, processing } = useForm({
    admin_rds: filters.admin_rds || '',
    admin_bca: filters.admin_bca || '',
    cancellation_date: filters.cancellation_date || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    type: filters.type || '', // Ajout du type
  });

  const hasActiveFilters = Object.values(data).some((v) => v !== '');

  const handleSubmit = (e) => {
    e.preventDefault();
    get('/annulations', { preserveState: true });
  };

  const resetFilters = () => {
    setData({
      admin_rds: '',
      admin_bca: '',
      cancellation_date: '',
      date_from: '',
      date_to: '',
      type: '',
    });
    get('/annulations', { preserveState: true });
  };

  return (
    <Main>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-full">

          {/* En-tête */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#236884] px-6 py-6 shadow-lg shadow-indigo-900/10 sm:px-8">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/15">
                <FiCalendar size={20} className="text-indigo-300" />
              </span>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  Commandes annulées
                </h1>
                <p className="text-sm text-indigo-200">Suivi des annulations</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-right backdrop-blur-sm">
              <div className="text-2xl font-bold leading-none text-white">{annulations.total}</div>
              <div className="text-[11px] uppercase tracking-wide text-indigo-200">au total</div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
                <div>
                  <label htmlFor="admin_rds" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Admin RDS
                  </label>
                  <input
                    id="admin_rds"
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={data.admin_rds}
                    onChange={(e) => setData('admin_rds', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="admin_bca" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Admin BCA
                  </label>
                  <input
                    id="admin_bca"
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={data.admin_bca}
                    onChange={(e) => setData('admin_bca', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="date_from" className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <FiCalendar size={11} /> Depuis
                  </label>
                  <input
                    id="date_from"
                    type="date"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={data.date_from}
                    onChange={(e) => setData('date_from', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="date_to" className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <FiCalendar size={11} /> Jusqu'à
                  </label>
                  <input
                    id="date_to"
                    type="date"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={data.date_to}
                    onChange={(e) => setData('date_to', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Type
                  </label>
                  <select
                    id="type"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={data.type}
                    onChange={(e) => setData('type', e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="visite_technique">Visite technique</option>
                    <option value="raccordement">Raccordement</option>
                  </select>
                </div>
                <div className="flex items-end justify-end gap-2 sm:col-span-2 md:col-span-1 lg:col-span-1">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <FiX size={14} /> Effacer
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#236884] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-[#236884] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiSearch size={14} /> Filtrer
                  </button>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Filtres actifs
                </div>
              )}
            </form>
          </div>

          {/* Tableau */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">Admin RDS</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">Admin BCA</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">Contrat</th>
                   
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">Date annulation</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">Type</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {annulations.data.map((annulation) => (
                    <tr key={annulation.id} className="transition hover:bg-slate-50">
                      
                      <td className="px-5 py-3.5">
                        {annulation.admin_rds ? (
                          <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {annulation.admin_rds}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {annulation.admin_bca ? (
                          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {annulation.admin_bca}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {annulation.admin_contract || <span className="text-slate-300">—</span>}
                      </td>
                      
                      <td className="px-5 py-3.5">
                        {annulation.cancellation_date ? (
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <FiCalendar size={13} className="text-slate-400" />
                            {new Date(annulation.cancellation_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-300">N/A</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {annulation.type_lie === 'visite_technique' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            <FiFile size={12} /> VT
                          </span>
                        )}
                        {annulation.type_lie === 'raccordement' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                            <FiLink size={12} /> Racco
                          </span>
                        )}
                        {!annulation.type_lie && <span className="text-slate-300">—</span>}
                      </td>
                     
                    </tr>
                  ))}
                </tbody>
              </table>

              {annulations.data.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <FiCalendar size={28} className="text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">Aucune annulation trouvée</p>
                  <p className="text-xs text-slate-400">Essayez d'ajuster vos filtres</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              Affichage de <strong className="text-slate-700">{annulations.from}</strong> à{' '}
              <strong className="text-slate-700">{annulations.to}</strong> sur{' '}
              <strong className="text-slate-700">{annulations.total}</strong>
            </div>
            <nav className="flex items-center gap-1">
              {annulations.links.map((link, index) => (
                <Link
                  key={index}
                  href={link.url || '#'}
                  preserveState
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                    link.active
                      ? 'border-indigo-600 bg-[#25708E] text-white'
                      : link.url
                      ? 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      : 'pointer-events-none border-slate-100 text-slate-300'
                  }`}
                />
              ))}
            </nav>
          </div>

        </div>
      </div>
    </Main>
  );
}
