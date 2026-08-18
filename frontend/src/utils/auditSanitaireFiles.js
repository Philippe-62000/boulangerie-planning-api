import api from '../services/api';

function triggerFileDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'document.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function readBlobError(err) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed.error || parsed.message || text;
    } catch {
      return err.message;
    }
  }
  return err?.response?.data?.error || err?.message || 'Impossible d’ouvrir le document';
}

/**
 * Toujours passer par l’API (NAS). Après await, window.open est souvent bloqué
 * sur le tableau de bord : on force un téléchargement, comme dans le menu Mérieux.
 */
export async function openAuditSanitaireFile(alertId, file, index) {
  try {
    if (alertId == null || index == null) {
      alert('Fichier indisponible');
      return;
    }
    const res = await api.get(`/audit-sanitaire/${alertId}/files/${index}/download`, {
      responseType: 'blob'
    });
    const type = res.headers['content-type'] || '';
    if (type.includes('application/json')) {
      const text = await res.data.text();
      let msg = 'Fichier indisponible';
      try {
        msg = JSON.parse(text).error || msg;
      } catch {
        /* ignore */
      }
      alert(msg);
      return;
    }
    const blob = new Blob([res.data], { type: 'application/pdf' });
    triggerFileDownload(blob, file?.name || 'document.pdf');
  } catch (err) {
    console.warn('Ouverture PDF Mérieux:', err.response?.status || err.message);
    alert(await readBlobError(err));
  }
}
