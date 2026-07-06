// resources/js/Pages/DetailComment.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Main  from '@/Layouts/GuestLayout';
import axios from 'axios';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

// Icônes personnalisées
const Icons = {
  back: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  send: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  comment: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  history: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  user: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  calendar: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  building: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  location: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  network: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  equipment: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  attachment: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  document: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

export default function DetailComment({ 
  auth, 
  order, 
  vtData,           // NOUVEAU: données OTPLANIFVTDATE
  vtFileInfo,       // NOUVEAU: infos du fichier VT
  commentData,      // NOUVEAU: données COMMENT (alias)
  commentFileInfo,  // NOUVEAU: infos du fichier COMMENT
  filename, 
  fileInfo, 
  commentHistory = [], 
  allVersions = [],
  hasVtData = false,
  vtFilename = null
}) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localCommentHistory, setLocalCommentHistory] = useState([]);
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [showVtData, setShowVtData] = useState(true); // NOUVEAU: afficher les données VT
  const messagesEndRef = useRef(null);
  
  const currentUser = auth?.user?.name || auth?.user?.email || 'Utilisateur';
  
  // Utiliser commentData ou order pour les données du commentaire
  const activeOrder = commentData || order;
  
  const { data, setData } = useForm({
    address_site_a_name: activeOrder?.address_site_a_name || '',
    address_site_a_postal: activeOrder?.address_site_a_postal || '',
    address_site_a_street: activeOrder?.address_site_a_street || '',
    address_site_a_town: activeOrder?.address_site_a_town || '',
    address_site_a_x: activeOrder?.address_site_a_x || '',
    address_site_a_y: activeOrder?.address_site_a_y || '',
    insee_code: activeOrder?.insee_code || '',
    admin_bca: activeOrder?.admin_bca || '',
    admin_prefix: activeOrder?.admin_prefix || '',
    admin_contract: activeOrder?.admin_contract || '',
    admin_rds: activeOrder?.admin_rds || '',
    bandwith: activeOrder?.bandwith || '',
    bpe_piquage: activeOrder?.bpe_piquage || '',
    bca_sending_date: activeOrder?.bca_sending_date || '',
    building_code: activeOrder?.building_code || '',
    client_directive_access: activeOrder?.client_directive_access || '',
    client_directive_intervention: activeOrder?.client_directive_intervention || '',
    client_directive_planning: activeOrder?.client_directive_planning || '',
    contact_on_site_firstname: activeOrder?.contact_on_site_firstname || '',
    contact_on_site_lastname: activeOrder?.contact_on_site_lastname || '',
    contact_on_site_mail: activeOrder?.contact_on_site_mail || '',
    contact_on_site_phone: activeOrder?.contact_on_site_phone || '',
    covage_contact_name: activeOrder?.covage_contact_name || '',
    covage_contact_mail: activeOrder?.covage_contact_mail || '',
    covage_contact_phone: activeOrder?.covage_contact_phone || '',
    network: activeOrder?.network || '',
    nro_name: activeOrder?.nro_name || '',
    nro_port: activeOrder?.nro_port || '',
    offer: activeOrder?.offer || '',
    oi_reference: activeOrder?.oi_reference || '',
    operator_client_ref: activeOrder?.operator_client_ref || '',
    operator_name: activeOrder?.operator_name || '',
    order_date: activeOrder?.order_date || '',
    pop_name: activeOrder?.pop_name || '',
    project_name: activeOrder?.project_name || '',
    rop_ref: activeOrder?.rop_ref || '',
    techno: activeOrder?.techno || '',
    equipement_number: activeOrder?.equipement_number || '',
    mer_number: activeOrder?.mer_number || '',
    client_wait_end: activeOrder?.client_wait_end || '',
    begin_client_wait: activeOrder?.begin_client_wait || '',
    article_designation: activeOrder?.article_designation || '',
    // Données VT pour information
    vt_planning_date: vtData?.planning_date || '',
    vt_comment: vtData?.comment || '',
    vt_result_status: vtData?.result_status || '',
    user_comment: '',
   // user_comment_date: new Date().toISOString().slice(0, 16),
  });

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localCommentHistory]);

  // Combiner l'historique de la base de données avec les versions CSV
  useEffect(() => {
    const allComments = [...commentHistory];
    
    if (allVersions && allVersions.length > 0) {
      allVersions.forEach(version => {
        const existing = allComments.find(c => c.filename === version.filename);
        if (!existing) {
          allComments.push({
            id: version.filename,
            bca: activeOrder?.admin_bca,
            rds: activeOrder?.admin_rds,
            content: version.order?.comment || version.order?.user_comment || 'Version du fichier',
            author: 'Système',
            created_at: version.datetime || `${version.formatted_date} ${version.formatted_time || ''}`,
            formatted_date: version.formatted_date,
            formatted_time: version.formatted_time,
            filename: version.filename,
            is_from_csv: true,
            is_system: true
          });
        }
      });
    }
    
    // Trier par date croissante (du plus ancien au plus récent)
    allComments.sort((a, b) => {
      const dateA = a.created_at || `${a.formatted_date} ${a.formatted_time}`;
      const dateB = b.created_at || `${b.formatted_date} ${b.formatted_time}`;
      return new Date(dateA) - new Date(dateB);
    });
    
    setLocalCommentHistory(allComments);
  }, [commentHistory, allVersions, activeOrder]);

  const fetchCommentHistory = async () => {
    try {
      const bca = activeOrder?.admin_bca;
      const rds = activeOrder?.admin_rds;
      
      if (!bca || !rds) return;
      
      const response = await axios.get(`/api/comments/history/${bca}/${rds}`);
      if (response.data.success) {
        const allComments = [...response.data.comments];
        
        if (allVersions && allVersions.length > 0) {
          allVersions.forEach(version => {
            const existing = allComments.find(c => c.filename === version.filename);
            if (!existing) {
              allComments.push({
                id: version.filename,
                bca: activeOrder?.admin_bca,
                rds: activeOrder?.admin_rds,
                content: version.order?.comment || version.order?.user_comment || 'Version du fichier',
                author: 'Système',
                created_at: version.datetime || `${version.formatted_date} ${version.formatted_time || ''}`,
                formatted_date: version.formatted_date,
                formatted_time: version.formatted_time,
                filename: version.filename,
                is_from_csv: true,
                is_system: true
              });
            }
          });
        }
        
        allComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setLocalCommentHistory(allComments);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(name, value);
  };

  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    if (name === 'user_comment') {
      setCommentText(value);
      setData('user_comment', value);
    } 
  };

  const isValidDateFormat = (dateString) => {
    if (!dateString || dateString === '') return true;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const isValidComment = (comment) => {
    if (!comment || comment === '') return true;
    const length = comment.trim().length;
    return length >= 3 && length <= 250;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!data.admin_bca) {
      toast.error('La référence BCA est obligatoire');
      setIsSubmitting(false);
      return;
    }
    if (!data.admin_rds) {
      toast.error('La référence RDS est obligatoire');
      setIsSubmitting(false);
      return;
    }

    const currentComment = data.user_comment || commentText;
    if (!currentComment || currentComment.trim() === '') {
      toast.error('Veuillez saisir un commentaire avant d\'envoyer');
      setIsSubmitting(false);
      return;
    }

    if (!isValidComment(currentComment)) {
      toast.error('Le commentaire doit contenir entre 3 et 250 caractères');
      setIsSubmitting(false);
      return;
    }

    const dateFields = [
      'order_date',
      'bca_sending_date',
      'begin_client_wait',
      'client_wait_end',
     // 'user_comment_date'
    ];

    for (const field of dateFields) {
      const value = data[field];
      if (value && !isValidDateFormat(value)) {
        const fieldLabel = field.replace(/_/g, ' ').toUpperCase();
        toast.error(`Le champ "${fieldLabel}" doit être au format YYYY-MM-DD`);
        setIsSubmitting(false);
        return;
      }
    }

    const today = new Date();
    const formattedDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('');
    const formattedTime = [
      String(today.getHours()).padStart(2, '0'),
      String(today.getMinutes()).padStart(2, '0')
    ].join('');

    const readOnlyFields = [
      'address_site_a_name', 'address_site_a_postal', 'address_site_a_street',
      'address_site_a_town', 'address_site_a_x', 'address_site_a_y',
      'bandwith', 'bca_sending_date', 'building_code', 'admin_contract', 'admin_prefix',
      'admin_rds', 'client_directive_access', 'client_directive_intervention',
      'client_directive_planning', 'contact_on_site_firstname',
      'contact_on_site_lastname', 'contact_on_site_mail', 'contact_on_site_phone',
      'covage_contact_name', 'covage_contact_mail', 'covage_contact_phone',
      'network', 'nro_name', 'nro_port', 'offer', 'oi_reference',
      'operator_client_ref', 'operator_name', 'order_date', 'bpe_piquage',
      'project_name', 'rop_ref', 'techno', 'equipement_number', 'mer_number',
      'client_wait_end', 'begin_client_wait', 'insee_code', 'article_designation'
    ];

    const allData = {
      ...data,
      user_comment: currentComment,
     // user_comment_date: data.user_comment_date,
      admin_bca: activeOrder?.admin_bca,
      admin_rds: activeOrder?.admin_rds,
      comment_author: currentUser
    };

    const allFields = Object.keys(allData);
    const headers = allFields.filter(field => {
      const value = allData[field];
      return (
        !readOnlyFields.includes(field) &&
        value !== undefined &&
        value !== null &&
        value !== ''
      );
    });

    const escapeCSVValue = (value, isCommentField) => {
      if (value == null) return '';
      let str = String(value);
      
      if (isCommentField) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }
      
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const commentFields = ['user_comment', 'comment'];
    
    const row = headers.map(header => {
      const isComment = commentFields.includes(header);
      const value = allData[header];
      return escapeCSVValue(value, isComment);
    });

    const csvContent = `${headers.join(',')}\n${row.join(',')}`;

    const filenameBase = `COMMENT_${data.admin_rds || 'inconnu'}_${data.admin_bca || 'inconnu'}_${formattedDate}_${formattedTime}`;
    const csvFilename = `${filenameBase}.csv`;
    const zipFilename = `${filenameBase}.zip`;

    try {
      const zip = new JSZip();
      zip.file(csvFilename, csvContent);
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const formData = new FormData();
      formData.append('file', zipBlob, zipFilename);
      formData.append('comment', currentComment);
      formData.append('bca_reference', data.admin_bca);
      formData.append('rds_reference', data.admin_rds);
      formData.append('author', currentUser);

      await axios.post('/api/comments/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Commentaire envoyé avec succès !');
      
      setCommentText('');
      setData('user_comment', '');
      setMessage('Commentaire envoyé avec succès !');
      
      await fetchCommentHistory();
      
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de l'envoi.");
      setMessage("Une erreur est survenue lors de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeOrder) {
    return (
      <Main user={auth.user}>
        <div className="min-h-screen bg-gradient-to-br from-[#F5F7F9] to-white flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Commande non trouvée</h2>
              <p className="text-gray-600">La commande que vous recherchez n'existe pas.</p>
            </div>
          </div>
        </div>
      </Main>
    );
  }

  // Sections d'informations
  const sections = [
    {
      title: "Adresse du site",
      icon: Icons.location,
      color: "blue",
      fields: [
        { name: 'address_site_a_name', label: 'Nom du site' },
        { name: 'address_site_a_postal', label: 'Code postal' },
        { name: 'address_site_a_street', label: 'Rue' },
        { name: 'address_site_a_town', label: 'Ville' },
        { name: 'address_site_a_x', label: 'Coordonnée X' },
        { name: 'address_site_a_y', label: 'Coordonnée Y' },
        { name: 'building_code', label: 'Code bâtiment' },
        { name: 'insee_code', label: 'Code INSEE' }
      ]
    },
    {
      title: "👤 Informations client",
      icon: Icons.user,
      color: "green",
      fields: [
        { name: 'operator_name', label: 'Nom opérateur' },
        { name: 'operator_client_ref', label: 'Réf. client opérateur' },
        { name: 'project_name', label: 'Nom du projet' },
        { name: 'contact_on_site_firstname', label: 'Prénom contact' },
        { name: 'contact_on_site_lastname', label: 'Nom contact' },
        { name: 'contact_on_site_mail', label: 'Email contact' },
        { name: 'contact_on_site_phone', label: 'Téléphone contact' }
      ]
    },
    {
      title: "Informations Covage",
      icon: Icons.building,
      color: "purple",
      fields: [
        { name: 'covage_contact_name', label: 'Nom contact' },
        { name: 'covage_contact_mail', label: 'Email contact' },
        { name: 'covage_contact_phone', label: 'Téléphone contact' },
        { name: 'admin_bca', label: 'Référence BCA' },
        { name: 'admin_prefix', label: 'Préfixe administratif' },
        { name: 'admin_rds', label: 'RDS' },
        { name: 'rop_ref', label: 'Réf. ROP' },
        { name: 'oi_reference', label: 'Référence OI' },
        { name: 'bca_sending_date', label: "Date d'envoi BCA", type: 'date' }
      ]
    },
    {
      title: "Réseaux et technologie",
      icon: Icons.network,
      color: "orange",
      fields: [
        { name: 'network', label: 'Réseau' },
        { name: 'techno', label: 'Technologie' },
        { name: 'offer', label: 'Offre' },
        { name: 'bandwith', label: 'Bande passante' },
        { name: 'pop_name', label: 'Nom POP' },
        { name: 'nro_name', label: 'Nom NRO' },
        { name: 'nro_port', label: 'Port NRO' },
        { name: 'order_date', label: 'Date de commande', type: 'date' }
      ]
    },
    {
      title: "Équipement",
      icon: Icons.equipment,
      color: "red",
      fields: [
        { name: 'equipement_number', label: "Numéro d'équipement" },
        { name: 'mer_number', label: 'Numéro MER' },
        { name: 'article_designation', label: 'Désignation article' },
        { name: 'bpe_piquage', label: 'BPE Piquage' }
      ]
    },
    {
      title: "📅 Dates d'attente client",
      icon: Icons.calendar,
      color: "amber",
      fields: [
        { name: 'begin_client_wait', label: 'Début attente client', type: 'date' },
        { name: 'client_wait_end', label: 'Fin attente client', type: 'date' }
      ]
    }
  ];

  // Section spécifique pour les données VT (OTPLANIFVTDATE)
  const vtSection = {
    title: "📋 Données Visite Technique (OTPLANIFVTDATE)",
    icon: Icons.document,
    color: "teal",
    fields: [
      { name: 'vt_planning_date', label: 'Date planifiée', type: 'date' },
      { name: 'vt_comment', label: 'Commentaire VT', type: 'textarea' },
      { name: 'vt_result_status', label: 'Résultat VT' }
    ]
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', iconBg: 'bg-blue-100' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', iconBg: 'bg-green-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', iconBg: 'bg-purple-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', iconBg: 'bg-orange-100' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', iconBg: 'bg-red-100' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', iconBg: 'bg-amber-100' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', iconBg: 'bg-teal-100' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <Main user={auth.user}>
      <Head title="Commentaires - Visite Technique" />
      
      <div className="min-h-screen bg-gradient-to-br from-[#F5F7F9] via-white to-[#F5F7F9] py-8">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8 animate-slideDown">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.visit('/dashboard')}
                className="group flex items-center px-4 py-2 bg-white border border-gray-200 text-[#515E65] rounded-xl hover:shadow-lg hover:border-[#46BA68] transition-all duration-200"
              >
                <Icons.back className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Retour
              </button>

              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-[#46BA68] to-[#515E65] bg-clip-text text-transparent">
                    Échange de Commentaires
                  </span>
                </h1>
                <p className="text-[#515E65]">Consultez l'historique et ajoutez vos observations</p>
              </div>

              <div className="w-24"></div>
            </div>
          </div>

          {/* Bannière d'information avec les deux fichiers */}
          <div className="mb-8 animate-slideIn">
            <div className="relative overflow-hidden bg-gradient-to-r from-[#46BA68] to-[#515E65] rounded-2xl shadow-xl">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icons.building className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-semibold">
                        Référence BCA: <span className="font-bold text-yellow-300">{data.admin_bca}</span>
                      </h2>
                    </div>
                    <p className="text-white/80 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                      RDS: {data.admin_rds}
                    </p>
                    
                    {/* Fichiers associés */}
                    <div className="mt-3 flex flex-wrap gap-3">
                      {filename && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
                          <span className="font-mono">📄 COMMENT: {filename}</span>
                          {commentFileInfo?.formatted_date && (
                            <span className="ml-2 text-xs opacity-80">
                              ({commentFileInfo.formatted_date} {commentFileInfo.formatted_time ? `à ${commentFileInfo.formatted_time}` : ''})
                            </span>
                          )}
                        </div>
                      )}
                      {hasVtData && vtFilename && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
                          <span className="font-mono">📋 OTPLANIFVTDATE: {vtFilename}</span>
                          {vtFileInfo?.formatted_date && (
                            <span className="ml-2 text-xs opacity-80">
                              ({vtFileInfo.formatted_date} {vtFileInfo.formatted_time ? `à ${vtFileInfo.formatted_time}` : ''})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {allVersions && allVersions.length > 1 && (
                      <div className="mt-2 flex items-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-1 w-fit">
                        <Icons.history className="w-4 h-4" />
                        <span>{allVersions.length} version(s) de ce fichier</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Icons.history className="w-5 h-5" />
                      <span className="text-sm">{localCommentHistory.length} commentaire(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Données VT (OTPLANIFVTDATE) - NOUVEAU BLOC */}
          {hasVtData && vtData && (
            <div className="mb-8 animate-slideIn">
              <div className="bg-white rounded-2xl shadow-lg border border-teal-100 overflow-hidden">
                <div 
                  className="px-6 py-4 bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 flex items-center justify-between cursor-pointer"
                  onClick={() => setShowVtData(!showVtData)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Icons.document className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#515E65]">
                      {vtSection.title}
                    </h3>
                    {vtFileInfo?.formatted_date && (
                      <span className="text-xs text-gray-400">
                        {vtFileInfo.formatted_date} {vtFileInfo.formatted_time ? `à ${vtFileInfo.formatted_time}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-teal-600">
                      {showVtData ? '▼' : '▶'} Afficher/Masquer
                    </span>
                  </div>
                </div>
                
                {showVtData && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-teal-50/50 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Date planifiée
                      </label>
                      <div className="text-sm font-medium text-gray-800">
                        {vtData.planning_date ? formatDate(vtData.planning_date) : '-'}
                      </div>
                    </div>
                    <div className="bg-teal-50/50 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Résultat VT
                      </label>
                      <div className="text-sm font-medium text-gray-800">
                        {vtData.result_status || '-'}
                      </div>
                    </div>
                    <div className="bg-teal-50/50 rounded-lg p-3 col-span-1 md:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Commentaire VT
                      </label>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {vtData.comment || '-'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Zone de messagerie (inchangée) */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#46BA68]/10 rounded-lg">
                    <Icons.comment className="w-5 h-5 text-[#46BA68]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#515E65]">
                    Conversation
                  </h3>
                  <span className="px-2 py-1 text-xs bg-gray-200 text-[#515E65] rounded-full">
                    {localCommentHistory.length} message(s)
                  </span>
                </div>
              </div>
              
              <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
                {localCommentHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Icons.comment className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Aucun message</p>
                    <p className="text-sm text-gray-400 mt-1">Soyez le premier à envoyer un message</p>
                  </div>
                ) : (
                  localCommentHistory.map((comment, index) => {
                    const isCurrentUser = comment.author === currentUser;
                    const isSystem = comment.is_system;
                    const showDateSeparator = index === 0 || 
                      formatDateOnly(comment.created_at) !== formatDateOnly(localCommentHistory[index - 1]?.created_at);
                    
                    return (
                      <div key={comment.id || index}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <span className="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                              {formatDateOnly(comment.created_at)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-slideIn`}>
                          <div className={`flex max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-3' : 'mr-3'}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                isSystem 
                                  ? 'bg-gray-400' 
                                  : isCurrentUser 
                                    ? 'bg-gradient-to-r from-[#46BA68] to-[#3a9a54]' 
                                    : 'bg-gradient-to-r from-[#515E65] to-[#3a4a55]'
                              }`}>
                                {comment.author?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            </div>
                            
                            <div className={`relative ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                              <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                isSystem
                                  ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                  : isCurrentUser
                                    ? 'bg-[#46BA68] text-white rounded-br-none'
                                    : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'
                              }`}>
                                <p className="text-sm font-medium mb-1">
                                  {comment.author}
                                  {isSystem && <span className="text-xs ml-2 opacity-70">(automatique)</span>}
                                </p>
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {comment.content}
                                </p>
                                {comment.filename && (
                                  <div className="mt-2 flex items-center gap-1 text-xs opacity-75">
                                    <Icons.attachment className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">{comment.filename}</span>
                                  </div>
                                )}
                              </div>
                              <div className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                                {formatTimeOnly(comment.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Formulaire d'envoi de commentaire (inchangé) */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#46BA68] to-[#3a9a54] flex items-center justify-center text-white font-bold">
                      {currentUser.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      name="user_comment"
                      value={commentText}
                      onChange={handleCommentChange}
                      rows="2"
                      maxLength={250}
                      minLength={3}
                      placeholder="Écrivez votre message (3 à 250 caractères)..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#46BA68] focus:border-transparent transition resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && commentText.trim().length >= 3 && commentText.trim().length <= 250) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-400">
                        {commentText.trim().length}/250 caractères | Appuyez sur Entrée pour envoyer
                      </p>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !commentText.trim() || commentText.trim().length < 3 || commentText.trim().length > 250}
                        className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-[#46BA68] to-[#3a9a54] text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icons.send className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Envoi...' : 'Envoyer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Affichage des versions (optionnel) */}
          {showAllVersions && allVersions && allVersions.length > 1 && (
            <div className="mb-8 animate-slideIn">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-[#515E65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#515E65]">
                      Toutes les versions du fichier
                    </h3>
                    <span className="px-2 py-1 text-xs bg-gray-200 text-[#515E65] rounded-full">
                      {allVersions.length} version(s)
                    </span>
                    <button
                      onClick={() => setShowAllVersions(false)}
                      className="ml-auto text-sm text-gray-400 hover:text-gray-600"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allVersions.map((version, idx) => (
                      <div 
                        key={idx} 
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-[#46BA68] cursor-pointer"
                        onClick={() => {
                          router.visit(`/orders/${version.order.admin_bca}/${version.order.admin_rds}/${version.prefix}/${version.date}`);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">
                            {version.prefix}
                          </span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 text-xs bg-[#46BA68]/20 text-[#46BA68] rounded-full">
                              Dernière
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-mono text-gray-700 truncate">
                          {version.filename}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {version.formatted_date} {version.formatted_time ? `à ${version.formatted_time}` : ''}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {version.order?.comment || version.order?.user_comment || 'Aucun commentaire'}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <span className="text-xs text-[#46BA68] hover:text-[#3a9a54]">
                            Voir cette version →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton pour afficher les versions */}
          {allVersions && allVersions.length > 1 && !showAllVersions && (
            <div className="mb-8 text-center">
              <button
                onClick={() => setShowAllVersions(true)}
                className="text-sm text-[#46BA68] hover:text-[#3a9a54] flex items-center gap-1 mx-auto"
              >
                <Icons.history className="w-4 h-4" />
                Afficher les {allVersions.length} versions du fichier
              </button>
            </div>
          )}

          {/* Détails de la commande (accordéon) */}
          <details className="mb-8 animate-slideIn">
            <summary className="cursor-pointer text-sm font-medium text-[#515E65] hover:text-[#46BA68] transition-colors">
              📋 Voir les détails de la commande
            </summary>
            <div className="mt-4 space-y-4">
              {sections.map((section, idx) => {
                const colors = getColorClasses(section.color);
                return (
                  <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 overflow-hidden">
                    <div className={`px-4 py-3 ${colors.bg} border-b ${colors.border}`}>
                      <div className="flex items-center gap-2">
                        <section.icon className={`w-4 h-4 ${colors.text}`} />
                        <h4 className="font-medium text-gray-700">{section.title}</h4>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.fields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={field.type === 'date' ? formatDate(data[field.name]) : data[field.name] || '-'}
                            readOnly
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>

          {/* Message de statut */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-xl animate-slideUp ${
                message.includes('succès')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {message.includes('succès') ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
        .animate-slideIn { animation: slideIn 0.5s ease-out forwards; opacity: 0; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
      `}</style>
    </Main>
  );
}
