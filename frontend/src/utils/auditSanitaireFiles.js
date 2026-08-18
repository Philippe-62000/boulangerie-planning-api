import api from '../services/api';

export function auditSanitaireDriveHref(file) {
  if (file?.url) return file.url;
  if (file?.driveFileId) {
    return `https://drive.google.com/file/d/${file.driveFileId}/view`;
  }
  return '';
}

export async function openAuditSanitaireFile(alertId, file, index) {
  try {
    if (file?.nasStored && alertId != null && index != null) {
      const res = await api.get(`/audit-sanitaire/${alertId}/files/${index}/download`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const href = auditSanitaireDriveHref(file);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    alert('Fichier indisponible');
  } catch (err) {
    console.warn('Ouverture PDF Mérieux:', err.response?.status || err.message);
    alert(err.response?.data?.error || 'Impossible d’ouvrir le document');
  }
}
