import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import { FiSearch, FiX, FiEye, FiZap, FiLink } from 'react-icons/fi';

export default function Index({ routeOptiques, filters }) {
  const { data, setData, get, processing } = useForm({
    admin_rds: filters.admin_rds || '',
    admin_bca: filters.admin_bca || '',
    type_fibre: filters.type_fibre || '',
    statut: filters.statut || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    get('/routeoptiques', { preserveState: true });
  };

  const resetFilters = () => {
    setData({
      admin_rds: '',
      admin_bca: '',
      type_fibre: '',
      statut: '',
      date_from: '',
      date_to: '',
    });
    get('/routeoptiques', { preserveState: true });
  };

  const getStatusBadge = (statut) => {
    const colors = {
      'actif': 'bg-emerald-100 text-emerald-800',
      'inactif': 'bg-slate-100 text-slate-800',
      'en_construction': 'bg-amber-100 text-amber-800',
      'reserve': 'bg-blue-100 text-blue-800',
    };
    const color = colors[statut?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{statut || 'N/A'}</span>;
  };

  return (
    <Main>
      <div className="max-w-full  mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <span className="bg-[#256F8C] text-white p-2 rounded-xl">
              <FiZap className="w-6 h-6" />
            </span>
            Routes Optiques
          </h1>
          <p className="text-slate-500 mt-1">Liste des routes optiques importées</p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin RDS</label>
                <input
                  type="text"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Rechercher par RDS"
                  value={data.admin_rds}
                  onChange={e => setData('admin_rds', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin BCA</label>
                <input
                  type="text"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Rechercher par BCA"
                  value={data.admin_bca}
                  onChange={e => setData('admin_bca', e.target.value)}
                />
              </div>
              {/* Vous pouvez réactiver les filtres si besoin */}
              {/*
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type fibre</label>
                <input
                  type="text"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Type fibre"
                  value={data.type_fibre}
                  onChange={e => setData('type_fibre', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <input
                  type="text"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Statut"
                  value={data.statut}
                  onChange={e => setData('statut', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date début</label>
                <input
                  type="date"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  value={data.date_from}
                  onChange={e => setData('date_from', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date fin</label>
                <input
                  type="date"
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  value={data.date_to}
                  onChange={e => setData('date_to', e.target.value)}
                />
              </div>
              */}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#256F8C] hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50"
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {routeOptiques.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.admin_rds}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.admin_bca}</td>

                    {/* Colonne "Lié à" */}
                    <td className="px-6 py-4 text-sm">
                      {item.raccordement_id ? (
                        <Link
                          href={`/raccordements/${item.raccordement_id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          
                          Raccordement 
                        </Link>
                      ) : item.visite_technique_id ? (
                        <Link
                          href={`/visites-techniques/${item.visite_technique_id}`}
                          className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
                        >
                          
                          Visite 
                        </Link>
                      ) : (
                        <span className="text-slate-400">Non lié</span>
                      )}
                    </td>

                    {/* Colonne Fichier ROP */}
                    <td className="px-6 py-4 text-sm">
                      {item.rop_zip_path ? (
                        <a
                          href={`/routeoptiques/${item.id}/download-rop`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                        >
                          Télécharger
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Colonne Actions
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href="#"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        Détail
                      </Link>
                    </td>*/}
                  </tr>
                ))}
                {routeOptiques.data.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Aucune route optique trouvée</p>
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
            Affichage de <span className="font-semibold">{routeOptiques.from}</span> à{' '}
            <span className="font-semibold">{routeOptiques.to}</span> sur{' '}
            <span className="font-semibold">{routeOptiques.total}</span>
          </div>
          <nav className="flex items-center gap-1">
            {routeOptiques.links.map((link, index) => (
              <Link
                key={index}
                href={link.url || '#'}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  link.active
                    ? 'bg-emerald-600 text-white font-semibold'
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
