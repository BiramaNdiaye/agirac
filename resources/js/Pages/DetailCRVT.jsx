import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function DetailCRVT({ order, auth }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data, setData } = useForm({
    address_site_a_name: order?.address_site_a_name || '',
    address_site_a_postal: order?.address_site_a_postal || '',
    address_site_a_street: order?.address_site_a_street || '',
    address_site_a_town: order?.address_site_a_town || '',
    address_site_a_x: order?.address_site_a_x || '',
    address_site_a_y: order?.address_site_a_y || '',
    admin_bca_reference: order?.admin_bca_reference || '',
    admin_order_date: order?.admin_order_date || '',
    admin_prefix: order?.admin_prefix || '',
    admin_rds: order?.admin_rds || '',
    bandwith: order?.bandwith || '',
    bca_sending_date: order?.bca_sending_date || '',
    building_code: order?.building_code || '',
    client_directive_access: order?.client_directive_access || '',
    client_directive_intervention: order?.client_directive_intervention || '',
    client_directive_planning: order?.client_directive_planning || '',
    contact_on_site_firstname: order?.contact_on_site_firstname || '',
    contact_on_site_lastname: order?.contact_on_site_lastname || '',
    contact_on_site_mail: order?.contact_on_site_mail || '',
    contact_on_site_phone: order?.contact_on_site_phone || '',
    covage_contact_firstname: order?.covage_contact_firstname || '',
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
    vt_comment: order?.vt_comment || '',
    vt_fail_comment: order?.vt_fail_comment || '',
    vt_fail_reason: order?.vt_fail_reason || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const headers = Object.keys(data);
      const row = headers.map(header => {
        const value = data[header] || '';
        const escaped = value.toString().replace(/"/g, '""');
        return `"${escaped}"`;
      });
      const csvContent = `${headers.join(',')}\n${row.join(',')}`;

      const filename = `${data.admin_rds || 'inconnu'}_${data.admin_bca_reference || 'inconnu'}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await axios.post('/api/vt/upload-csv', {
        filename,
        content: csvContent,
      });
      
      toast.success('Fichier CSV exporté avec succès !');
      setMessage('Fichier CSV exporté avec succès !');
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de l'export.");
      setMessage("Une erreur est survenue lors de l'export.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return (
    <Main user={auth.user}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">Commande non trouvée</h3>
          <p className="text-red-600 mt-2">Veuillez vérifier les informations de la commande.</p>
        </div>
      </div>
    </Main>
  );

  // Sections configurables avec les couleurs principales
  const sections = [
    {
      title: "📍 Adresse du site",
      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
      color: "blue",
      fields: [
        ['address_site_a_name', 'Nom du site'],
        ['address_site_a_postal', 'Code postal'],
        ['address_site_a_town', 'Ville'],
        ['address_site_a_street', 'Rue', 'textarea'],
        ['address_site_a_x', 'Coordonnée X (Lambert)'],
        ['address_site_a_y', 'Coordonnée Y (Lambert)'],
        ['building_code', 'Code bâtiment']
      ],
      cols: 2
    },
    {
      title: "👤 Informations client",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0z M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      color: "green",
      fields: [
        ['operator_name', 'Nom opérateur'],
        ['operator_client_ref', 'Référence client opérateur'],
        ['project_name', 'Nom du projet'],
        ['contact_on_site_firstname', 'Prénom contact sur site'],
        ['contact_on_site_lastname', 'Nom contact sur site'],
        ['contact_on_site_mail', 'Email contact', 'email'],
        ['contact_on_site_phone', 'Téléphone contact', 'tel'],
        ['client_directive_access', 'Directive accès'],
        ['client_directive_intervention', 'Directive intervention'],
        ['client_directive_planning', 'Directive planning']
      ],
      cols: 2
    },
    {
      title: "🏢 Informations Covage",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      color: "purple",
      fields: [
        ['admin_bca_reference', 'Référence BCA'],
        ['admin_rds', 'RDS'],
        ['admin_prefix', 'Préfixe administratif'],
        ['rop_ref', 'Référence ROP'],
        ['oi_reference', 'Référence OI'],
        ['covage_contact_name', 'Nom contact Covage'],
        ['covage_contact_mail', 'Email contact Covage', 'email'],
        ['covage_contact_phone', 'Téléphone contact Covage', 'tel'],
        ['admin_order_date', 'Date commande (administratif)', 'date'],
        ['bca_sending_date', "Date d'envoi BCA", 'date']
      ],
      cols: 2
    },
    {
      title: "🌐 Réseaux et technologie",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      color: "orange",
      fields: [
        ['network', 'Réseau'],
        ['techno', 'Technologie'],
        ['offer', 'Offre'],
        ['bandwith', 'Bande passante (Mbps)'],
        ['pop_name', 'Nom POP'],
        ['nro_name', 'Nom NRO'],
        ['nro_port', 'Port NRO'],
        ['order_date', 'Date de commande', 'date']
      ],
      cols: 2
    },
    {
      title: "💬 Commentaires et résultats",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
      color: "red",
      fields: [
        ['vt_comment', 'Commentaire visite technique', 'textarea'],
        ['vt_fail_comment', "Commentaire d'échec", 'textarea'],
        ['vt_fail_reason', 'Raison d\'échec']
      ],
      cols: 1
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: 'bg-green-100 text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
        icon: 'bg-purple-100 text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        icon: 'bg-orange-100 text-orange-600',
        button: 'bg-orange-600 hover:bg-orange-700'
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: 'bg-red-100 text-red-600',
        button: 'bg-red-600 hover:bg-red-700'
      }
    };
    return colors[color] || colors.blue;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  return (
    <Main user={auth.user}>
      <Head title="CRVT - Visite Technique" />
      
      <div className="min-h-screen bg-gradient-to-br from-[#F5F7F9] via-white to-[#F5F7F9] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto space-y-6">
          {/* Header avec titre et bouton retour */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button
              onClick={() => router.visit('/dashboard')}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#515E65] hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow hover:border-[#46BA68]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au tableau de bord
            </button>

            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#46BA68] to-[#515E65] bg-clip-text text-transparent">
                Compte-Rendu Visite Technique
              </h1>
              <p className="mt-2 text-[#515E65]">Consultez et exportez les détails de la visite technique</p>
            </div>

            <div className="w-24 hidden sm:block"></div>
          </div>

          {/* Bannière d'information avec couleurs principales */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#46BA68]/10 to-[#515E65]/10 backdrop-blur-sm border border-[#46BA68]/20 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-[#46BA68]/5 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#46BA68]/20 rounded-2xl">
                      <svg className="w-8 h-8 text-[#46BA68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#515E65]">Référence BCA</p>
                      <h2 className="text-2xl font-bold text-gray-900">{data.admin_bca_reference || 'Non spécifié'}</h2>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-[#515E65]">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      RDS: {data.admin_rds || '-'}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-[#515E65]">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Préfixe: {data.admin_prefix || '-'}
                    </span>
                  </div>
                </div>
                
                {data.vt_fail_reason && (
                  <div className="bg-red-100 border-l-4 border-red-500 rounded-lg p-4 shadow-sm animate-pulse-slow">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-red-800">Motif d'échec</p>
                        <p className="text-red-700 text-sm">{data.vt_fail_reason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formulaire principal avec cartes modernes */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {sections.map((section, index) => {
              const colors = getColorClasses(section.color);
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100">
                  <div className={`px-6 py-4 ${colors.bg} border-b ${colors.border}`}>
                    <h3 className={`text-lg font-semibold ${colors.text} flex items-center`}>
                      <span className={`p-2 rounded-xl mr-3 ${colors.icon}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                        </svg>
                      </span>
                      {section.title}
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className={`grid grid-cols-1 ${section.cols === 2 ? 'md:grid-cols-2' : ''} gap-6`}>
                      {section.fields.map(([field, label, type = 'text']) => (
                        <div key={field} className="group">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {label}
                          </label>
                          {type === 'textarea' ? (
                            <textarea
                              value={data[field] || '-'}
                              onChange={e => setData(field, e.target.value)}
                              rows={3}
                              readOnly
                              className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-4 bg-gray-50 text-gray-800 cursor-default focus:outline-none focus:ring-2 focus:ring-[#46BA68] focus:border-transparent transition-all duration-200 resize-none"
                            />
                          ) : type === 'date' ? (
                            <input
                              type="text"
                              value={formatDate(data[field])}
                              onChange={e => setData(field, e.target.value)}
                              readOnly
                              className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-4 bg-gray-50 text-gray-800 cursor-default focus:outline-none focus:ring-2 focus:ring-[#46BA68] focus:border-transparent transition-all duration-200 font-mono"
                            />
                          ) : (
                            <input
                              type={type}
                              value={data[field] || '-'}
                              onChange={e => setData(field, e.target.value)}
                              readOnly
                              className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-4 bg-gray-50 text-gray-800 cursor-default focus:outline-none focus:ring-2 focus:ring-[#46BA68] focus:border-transparent transition-all duration-200"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bouton d'exportation avec couleurs principales */}
            <div className="sticky bottom-6 z-10">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Informations de la commande :</span> {data.admin_bca_reference || 'Non spécifié'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      L'export générera un fichier CSV contenant toutes les informations ci-dessus
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-white transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#46BA68] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      isSubmitting ? 'bg-gray-400' : 'bg-gradient-to-r from-[#46BA68] to-[#3a9a54] hover:from-[#3a9a54] hover:to-[#2d8f40]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Export en cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Exporter en CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Message de statut avec animation */}
          {message && (
            <div className={`fixed bottom-24 right-6 z-20 transform transition-all duration-500 animate-slide-up ${
              message.includes('succès') 
                ? 'bg-[#46BA68] text-white' 
                : 'bg-red-500 text-white'
            } rounded-lg shadow-xl p-4 flex items-center space-x-3`}>
              {message.includes('succès') ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </Main>
  );
}
