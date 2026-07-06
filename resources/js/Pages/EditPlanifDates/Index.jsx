// resources/js/Pages/EditPlanifDates/Index.jsx

import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import { FiSearch, FiX, FiEye, FiCalendar, FiDownload } from 'react-icons/fi';

export default function Index({ editPlanifDates, filters }) {
  const { data, setData, get, processing } = useForm({
    admin_rds: filters.admin_rds || '',
    admin_bca: filters.admin_bca || '',
    planning_date: filters.planning_date || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    get('/edit-planif-dates', { preserveState: true });
  };

  const resetFilters = () => {
    setData({
      admin_rds: '',
      admin_bca: '',
      planning_date: '',
      date_from: '',
      date_to: '',
    });
    get('/edit-planif-dates', { preserveState: true });
  };

  return (
    <Main>
      <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <span className="bg-[#21637F] text-white p-2 rounded-xl">
              <FiCalendar className="w-6 h-6" />
            </span>
            Modifications de dates planifiées
          </h1>
          <p className="text-slate-500 mt-1">Liste des modifications de date de planification</p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin RDS</label>
                <input
                  type="text"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Rechercher par RDS"
                  value={data.admin_rds}
                  onChange={e => setData('admin_rds', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin BCA</label>
                <input
                  type="text"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Rechercher par BCA"
                  value={data.admin_bca}
                  onChange={e => setData('admin_bca', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date planifiée</label>
                <input
                  type="date"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={data.planning_date}
                  onChange={e => setData('planning_date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Importé depuis</label>
                <input
                  type="date"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={data.date_from}
                  onChange={e => setData('date_from', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Importé jusqu'à</label>
                <input
                  type="date"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={data.date_to}
                  onChange={e => setData('date_to', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#21637F] hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50"
              >
                <FiSearch className="w-5 h-5" />
                Filtrer
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl shadow-sm transition-all"
              >
                <FiX className="w-5 h-5" />
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin RDS</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin BCA</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nouvelle date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                 
                  
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {editPlanifDates.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.admin_rds}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.admin_bca}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                      {item.planning_date ? new Date(item.planning_date).toLocaleDateString('fr-FR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.raccordement_id ? (
                        <Link
                          href={`/raccordements/${item.raccordement_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Raccordement 
                        </Link>
                      ) : item.visite_technique_id ? (
                        <Link
                          href={`/visite-techniques/${item.visite_technique_id}`}
                          className="text-emerald-600 hover:underline"
                        >
                          Visite 
                        </Link>
                      ) : (
                        <span className="text-slate-400">Non lié</span>
                      )}
                    </td>
                    {/*
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/edit-planif-dates/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        Détail
                      </Link>
                    </td>
                    */}
                  </tr>
                ))}
                {editPlanifDates.data.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                      <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Aucune modification de date trouvée</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            Affichage de <span className="font-semibold">{editPlanifDates.from}</span> à{' '}
            <span className="font-semibold">{editPlanifDates.to}</span> sur{' '}
            <span className="font-semibold">{editPlanifDates.total}</span>
          </div>
          <nav className="flex items-center gap-1">
            {editPlanifDates.links.map((link, index) => (
              <Link
                key={index}
                href={link.url || '#'}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  link.active
                    ? 'bg-[#21637F] text-white font-semibold'
                    : link.url
                    ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'text-slate-400 cursor-not-allowed bg-slate-50'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
                preserveState
              />
            ))}
          </nav>
        </div>
      </div>
    </Main>
  );
}
