import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

 const allFields = [
  'admin_bca',
  'admin_prefix',
  'admin_rds',
  'arc_ars_declaration_date',
  'cable_capacity',
  'comment',
  'effective_date',
  'enedis_order_start_date',
  'enedis_validation_date',
  'fail_reason',
  'gc_length',
  'infra_to_be_created',
  'ml_length_extension_cable',
  'ml_length_racco_cable_private_domain',
  'ml_length_racco_cable_public_domain',
  'orange_order_ref',
  'orange_order_start_date',
  'orange_submission_date',
  'orange_validation_date',
  'planning_date',
  'pmv_application_date',
  'pmv_validation_date',
  'pole_intervention',
  'result_status',
  'submission_date',
  'third_party_company_name',
  'third_party_order_start_date',
  'cpe_installed',
  'cpe_operator_number',
  'client_cpe_serial'
];

export default function SendCommentForm({ commande, commandeType, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData } = useForm({ comment: '' });

    const escapeCsvValue = (value, isComment = false) => {
        if (value == null) return '';
        let str = String(value);
        if (isComment) {
            str = str.replace(/"/g, '""');
            return `"${str}"`;
        }
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const generateCsv = (adminRds, adminBca, commentText) => {
        let headers = [...allFields];
        if (!headers.includes('admin_rds')) headers.push('admin_rds');
        if (!headers.includes('admin_bca')) headers.push('admin_bca');
        if (!headers.includes('admin_prefix')) headers.push('admin_prefix');
        headers.push('comment');

        const row = headers.map(header => {
            if (header === 'admin_rds') return adminRds;
            if (header === 'admin_bca') return adminBca;
            if (header === 'admin_prefix') return 'COMMENT';
            if (header === 'comment') return escapeCsvValue(commentText, true);
            return '';
        });

        return headers.join(',') + '\n' + row.join(',');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!data.comment.trim()) {
            toast.error('Le commentaire ne peut pas être vide');
            return;
        }
        setIsSubmitting(true);

        const adminRds = commande.admin_rds;
        const adminBca = commande.admin_bca;
        const now = new Date();
        const formattedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const formattedTime = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

        const csvContent = generateCsv(adminRds, adminBca, data.comment);
        const csvFilename = `COMMENT_${adminRds}_${adminBca}_${formattedDate}_${formattedTime}.csv`;
        const zipFilename = csvFilename.replace('.csv', '.zip');

        const zip = new JSZip();
        zip.file(csvFilename, csvContent);
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        const formData = new FormData();
        formData.append('zipFile', zipBlob, zipFilename);
        formData.append('activeTab', 'Commentaire');
        formData.append('admin_rds', adminRds);
        formData.append('admin_bca', adminBca);
        formData.append('admin_prefix', 'COMMENT');

        try {
            await axios.post('/api/vt/upload-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Commentaire envoyé avec succès', { duration: 3000 });
            setData('comment', '');
            setTimeout(() => {
                if (onSuccess) onSuccess();
                else router.reload();
            }, 1500);
        } catch (error) {
            console.error(error);
            toast.error('Erreur lors de l’envoi du commentaire');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
                value={data.comment}
                onChange={(e) => setData('comment', e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Saisissez votre commentaire..."
                required
            />
            <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
                {isSubmitting ? 'Envoi...' : 'Envoyer le commentaire'}
            </button>
        </form>
    );
}
