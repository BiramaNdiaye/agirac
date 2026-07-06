// resources/js/Components/CommentSection.jsx
import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';

export default function CommentSection({ commentaires, commandeId, commandeType, stats }) {
    const [replyTo, setReplyTo] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        contenu: '',
        reponse_a_id: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const routeName = commandeType === 'visite_technique'
            ? 'visites-techniques.commentaire.ajouter'
            : 'raccordements.commentaire.ajouter';
        post(route(routeName, commandeId), {
            onSuccess: () => {
                reset();
                setReplyTo(null);
                setShowForm(false);
            },
        });
    };

    const handleReply = (id) => {
        setReplyTo(id);
        setData('reponse_a_id', id);
        setShowForm(true);
    };

    // Sécurité : commentaires doit être un tableau
    const commentsList = Array.isArray(commentaires) ? commentaires : [];


   

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                     Commentaires
                    
                </h2>
                
            </div>

            {showForm && (
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    {replyTo && (
                        <div className="mb-2 text-sm text-gray-600">
                            Réponse au commentaire #{replyTo}
                            <button onClick={() => { setReplyTo(null); setData('reponse_a_id', null); }} className="ml-2 text-red-500">
                                Annuler
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={data.contenu}
                            onChange={(e) => setData('contenu', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Votre commentaire..."
                            required
                        />
                        <div className="flex justify-end mt-2 gap-2">
                            <button type="button" onClick={() => { setShowForm(false); setReplyTo(null); reset(); }} className="px-3 py-1 bg-gray-300 rounded">
                                Annuler
                            </button>
                            <button type="submit" disabled={processing} className="px-3 py-1 bg-blue-600 text-white rounded">
                                {processing ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {commentsList.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun commentaire.</p>
            ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {commentsList.map((c) => (
                        <div key={c.id} className="border-l-4 border-gray-200 pl-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    
                                    <span className="font-medium">{c.auteur}</span>
                                    
                                </div>
                                <span className="text-xs text-gray-500">{c.file_date || c.created_at}</span>
                            </div>
                            <p className="text-gray-700 mt-2">{c.contenu}</p>
                            
                            {c.reponses && c.reponses.length > 0 && (
                                <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-100 pl-3">
                                    {c.reponses.map((r) => (
                                        <div key={r.id} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">📝</span>
                                                    <span className="font-medium text-sm">{r.auteur}</span>
                                                    
                                                </div>
                                                <span className="text-xs text-gray-500">{r.file_date || r.created_at}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-1">{r.contenu}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
