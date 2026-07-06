import React, { useState, useRef, useEffect } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import Main from '@/Layouts/GuestLayout';
import toast from 'react-hot-toast';

// #236A87 = bleu pétrole  (bulles droite / avatar Application)
// #E4EEF2 = bleu très clair (bulles gauche / fonds)

const MAIN   = '#236A87';
const LIGHT  = '#E4EEF2';
const DARK1  = '#1a5470';
const DARK2  = '#194f66';
const MID    = '#2e8aad';

// Auteurs non-Application : déclinaisons de #236A87
const AUTHOR_COLORS = [
    { hex: MAIN,  text: '#ffffff', timeColor: 'rgba(255,255,255,0.65)', avatarBg: LIGHT,  avatarText: MAIN  },
    { hex: DARK1, text: '#ffffff', timeColor: 'rgba(255,255,255,0.65)', avatarBg: '#d0e5ee', avatarText: DARK1 },
    { hex: MID,   text: '#ffffff', timeColor: 'rgba(255,255,255,0.65)', avatarBg: LIGHT,  avatarText: MID   },
    { hex: DARK2, text: '#ffffff', timeColor: 'rgba(255,255,255,0.65)', avatarBg: '#c8dde6', avatarText: DARK2 },
];

// Application : bulle claire gauche
const APP_COLOR = {
    hex: LIGHT,
    text: MAIN,
    timeColor: `${MAIN}99`,
    avatarBg: MAIN,
    avatarText: '#ffffff',
};

export default function Show({ commentaire, reponses }) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const { data, setData, post, processing, reset } = useForm({ contenu: '' });
    const threadRef = useRef(null);

    const allMessages = [
        { ...commentaire, est_principal: true },
        ...reponses,
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const authorColorMap = {};
    let colorIdx = 0;
    allMessages.forEach((msg) => {
        if (msg.auteur !== 'Application' && !authorColorMap[msg.auteur]) {
            authorColorMap[msg.auteur] = AUTHOR_COLORS[colorIdx % AUTHOR_COLORS.length];
            colorIdx++;
        }
    });

    const getColor = (auteur) =>
        auteur === 'Application' ? APP_COLOR : (authorColorMap[auteur] || AUTHOR_COLORS[0]);

    const isMe = (auteur) => auteur !== 'Application';

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatHour = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDayLabel = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (d.toDateString() === yesterday.toDateString()) return 'Hier';
        return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const getTypeLabel = (type) =>
        type === 'visite_technique' ? 'Visite technique' : 'Raccordement';

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('commentaires.reply', commentaire.id), {
            onSuccess: () => {
                reset();
                setShowReplyForm(false);
                toast.success('Message envoyé avec succès', {
                    duration: 4000,
                    icon: '',
                    style: { background: '#10b981', color: '#fff' }
                });
                // Recharger la page pour afficher le nouveau message (si nécessaire)
                router.reload({ only: ['commentaire', 'reponses'] });
            },
            onError: (errors) => {
                const errorMsg = errors.contenu?.[0] || 'Une erreur est survenue';
                toast.error(errorMsg, { duration: 4000 });
            }
        });
    };

    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, []);

    return (
        <Main>
            <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f0f4f6' }}>
                <div className="max-w-full mx-auto flex flex-col gap-4">

                    {/* Retour */}
                    <Link
                        href={route('commentaires.index')}
                        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
                        style={{ color: MAIN }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Retour à la liste
                    </Link>

                    {/* Fenêtre de chat */}
                    <div className="rounded-2xl overflow-hidden shadow-lg flex flex-col" style={{ border: `1px solid ${LIGHT}` }}>

                        {/* Barre de titre */}
                        <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: MAIN }}>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.81)' }}
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm leading-tight">
                                        {commentaire.rds} · {commentaire.bca}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                            style={{ backgroundColor: LIGHT, color: MAIN }}
                                        >
                                            {getTypeLabel(commentaire.commande_type)}
                                        </span>
                                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                            {allMessages.length} message{allMessages.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {commentaire.lu_at ? (
                                <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: 'rgba(228,238,242,0.2)', color: LIGHT, border: `1px solid rgba(228,238,242,0.35)` }}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Lu
                                </span>
                            ) : (
                                <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: 'rgba(255,200,100,0.2)', color: '#ffe0a0', border: '1px solid rgba(255,200,100,0.3)' }}
                                >
                                    Non lu
                                </span>
                            )}
                        </div>

                        {/* Fond du chat */}
                        <div
                            ref={threadRef}
                            className="flex flex-col gap-1 px-4 py-4 overflow-y-auto"
                            style={{
                                minHeight: '420px',
                                maxHeight: '520px',
                                backgroundColor: '#dce8ed',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23236A87' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                        >
                            {allMessages.map((msg, idx) => {
                                const me = isMe(msg.auteur);
                                const color = getColor(msg.auteur);
                                const initials = getInitials(msg.auteur);
                                const prevMsg = allMessages[idx - 1];

                                const showDay =
                                    idx === 0 ||
                                    new Date(msg.created_at).toDateString() !==
                                        new Date(prevMsg.created_at).toDateString();

                                const sameAuthorAsPrev = !showDay && prevMsg && prevMsg.auteur === msg.auteur;
                                const showTail = !sameAuthorAsPrev;

                                return (
                                    <React.Fragment key={msg.id}>
                                        {/* Séparateur de jour */}
                                        {showDay && (
                                            <div className="flex justify-center my-3">
                                                <span
                                                    className="text-xs px-3 py-1 rounded-full shadow-sm"
                                                    style={{ backgroundColor: LIGHT, color: MAIN }}
                                                >
                                                    {formatDayLabel(msg.created_at)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Ligne du message */}
                                        <div
                                            className={`flex items-end gap-2 ${me ? 'flex-row-reverse' : 'flex-row'} ${sameAuthorAsPrev ? 'mt-0.5' : 'mt-3'}`}
                                        >
                                            {/* Avatar */}
                                            <div className="w-7 flex-shrink-0 flex items-end justify-center mb-0.5">
                                                {showTail && (
                                                    <div
                                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                                                        style={{ backgroundColor: color.avatarBg, color: color.avatarText }}
                                                    >
                                                        {initials}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bulle */}
                                            <div className={`relative max-w-[72%] flex flex-col ${me ? 'items-end' : 'items-start'}`}>
                                                {/* Nom auteur (gauche uniquement, premier d'une série) */}
                                                {showTail && !me && (
                                                    <span
                                                        className="text-[11px] font-semibold mb-0.5 px-1"
                                                        style={{ color: MAIN }}
                                                    >
                                                        {msg.auteur || 'Covage'}
                                                    </span>
                                                )}

                                                <div
                                                    className="relative px-3 py-2 shadow-sm"
                                                    style={{
                                                        backgroundColor: color.hex,
                                                        color: color.text,
                                                        borderRadius: me
                                                            ? showTail ? '18px 4px 18px 18px' : '18px 4px 18px 18px'
                                                            : showTail ? '4px 18px 18px 18px' : '4px 18px 18px 18px',
                                                        border: !me ? `1px solid ${MAIN}22` : 'none',
                                                    }}
                                                >
                                                    {/* Queue SVG */}
                                                    {showTail && (
                                                        me ? (
                                                            <svg
                                                                style={{ position: 'absolute', right: -7, bottom: 0, width: 10, height: 10, color: color.hex }}
                                                                viewBox="0 0 10 10" fill="currentColor"
                                                            >
                                                                <path d="M0 10 L10 10 L10 0 Z" />
                                                            </svg>
                                                        ) : (
                                                            <svg
                                                                style={{ position: 'absolute', left: -7, bottom: 0, width: 10, height: 10, color: color.hex }}
                                                                viewBox="0 0 10 10" fill="currentColor"
                                                            >
                                                                <path d="M10 10 L0 10 L0 0 Z" />
                                                            </svg>
                                                        )
                                                    )}

                                                    {/* Texte */}
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words m-0">
                                                        {msg.contenu}
                                                    </p>

                                                    {/* Heure + coche */}
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, marginTop: 4 }}>
                                                        <span style={{ fontSize: 10, color: color.timeColor }}>
                                                            {formatHour(msg.created_at)}
                                                        </span>
                                                        {me && (
                                                            <svg style={{ width: 14, height: 14, color: color.timeColor }} fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Barre de saisie */}
                        <div className="px-3 py-2 border-t" style={{ backgroundColor: LIGHT, borderColor: `${MAIN}22` }}>
                            {showReplyForm ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1 bg-white rounded-2xl px-4 py-2 shadow-sm" style={{ border: `1px solid ${MAIN}33` }}>
                                            <textarea
                                                value={data.contenu}
                                                onChange={(e) => setData('contenu', e.target.value)}
                                                rows="2"
                                                className="w-full text-sm resize-none focus:outline-none bg-transparent"
                                                style={{ color: MAIN }}
                                                placeholder="Saisissez un message..."
                                                required
                                                minLength={3}
                                                maxLength={250}
                                                autoFocus
                                            />
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px]" style={{ color: `${MAIN}80` }}>
                                                    {data.contenu.length}/250
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => { reset(); setShowReplyForm(false); }}
                                                    className="text-[11px] transition"
                                                    style={{ color: `${MAIN}99` }}
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing || data.contenu.length < 3}
                                            className="w-11 h-11 rounded-full flex items-center justify-center transition shadow-sm flex-shrink-0 disabled:opacity-40"
                                            style={{ backgroundColor: MAIN }}
                                        >
                                            {processing ? (
                                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-white" style={{ transform: 'translateX(1px)' }} fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowReplyForm(true)}
                                    className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 text-sm text-left transition shadow-sm"
                                    style={{ border: `1px solid ${MAIN}22`, color: `${MAIN}80` }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `${MAIN}80` }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Répondre à cette discussion...
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </Main>
    );
}
