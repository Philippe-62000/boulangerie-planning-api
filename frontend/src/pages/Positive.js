import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import './Positive.css';

const NEW_PREFIX = '[NOUVEAU] ';

function cleanDisplayName(name) {
  return name.startsWith(NEW_PREFIX) ? name.slice(NEW_PREFIX.length) : name;
}

export default function Positive() {
  // Onglet actif (MVP commit 1 : seulement 'scan')
  const [activeTab] = useState('scan');

  // Catalogue chargé au montage
  const [catalog, setCatalog] = useState({ products: [], excluded: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Sélection de photos
  const [files, setFiles] = useState([]); // [{ file, previewUrl }]
  const fileInputRef = useRef(null);

  // Contexte
  const [lieu, setLieu] = useState('');
  const [note, setNote] = useState('');

  // Scan en cours / résultats
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { photos, totals, scanId }
  const [error, setError] = useState('');

  // Modifications en attente sur le catalogue (depuis la vue résultats)
  // pendingExclude: Set<string>, pendingRenames: Map<oldName, newName>, pendingKeeps: Set<string>
  const [pendingExclude, setPendingExclude] = useState(new Set());
  const [pendingRenames, setPendingRenames] = useState(new Map());
  const [pendingKeeps, setPendingKeeps] = useState(new Set());
  const [savingCatalog, setSavingCatalog] = useState(false);

  // ─── Chargement du catalogue ───
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const res = await api.get('/positive/catalog');
      if (res.data?.success) {
        setCatalog({
          products: res.data.catalog.products || [],
          excluded: res.data.catalog.excluded || []
        });
      }
    } catch (err) {
      console.error('Erreur chargement catalogue:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // ─── Gestion fichiers ───
  const handleFilesSelected = (eventOrFileList) => {
    const list = eventOrFileList?.target?.files || eventOrFileList;
    if (!list) return;
    const arr = Array.from(list).slice(0, 10 - files.length);
    const enriched = arr.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles((prev) => {
      const combined = [...prev, ...enriched];
      return combined.slice(0, 10);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Lancer le scan ───
  const handleScan = async () => {
    setError('');
    setScanResult(null);
    setPendingExclude(new Set());
    setPendingRenames(new Map());
    setPendingKeeps(new Set());

    if (!files.length) {
      setError('Sélectionne au moins une photo.');
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f.file));
    if (lieu) formData.append('lieu', lieu);
    if (note) formData.append('note', note);

    setScanning(true);
    try {
      const res = await api.post('/positive/scan', formData);
      if (res.data?.success) {
        setScanResult({
          scanId: res.data.scanId,
          photos: res.data.photos || [],
          totals: res.data.totals || []
        });
      } else {
        setError(res.data?.error || 'Erreur inconnue');
      }
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      if (status === 429) {
        setError(`⏳ Quota atteint : ${msg}`);
      } else {
        setError(`❌ ${msg || 'Erreur lors du scan'}`);
      }
    } finally {
      setScanning(false);
    }
  };

  // ─── Actions sur produits détectés ───
  const togglePendingExclude = (name) => {
    setPendingExclude((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setPendingRenames((prev) => {
      const next = new Map(prev);
      next.delete(name);
      return next;
    });
    setPendingKeeps((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const togglePendingKeep = (name) => {
    setPendingKeeps((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setPendingExclude((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const promptRename = (name) => {
    const cleanName = cleanDisplayName(name);
    const newName = window.prompt(
      'Nom canonique pour ce produit dans le catalogue :',
      cleanName
    );
    if (newName && newName.trim()) {
      setPendingRenames((prev) => {
        const next = new Map(prev);
        next.set(name, newName.trim());
        return next;
      });
      setPendingExclude((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
      setPendingKeeps((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  // ─── Sauvegarde des modifications dans le catalogue ───
  const hasPendingChanges =
    pendingExclude.size > 0 || pendingRenames.size > 0 || pendingKeeps.size > 0;

  const saveCatalogChanges = async () => {
    if (!hasPendingChanges) return;
    setSavingCatalog(true);
    try {
      // Construire nouveau catalogue à partir du précédent + pending
      const newProducts = [...catalog.products.map((p) => ({ ...p, aliases: [...p.aliases] }))];
      const newExcluded = [...catalog.excluded];

      // Renommages : créer ou compléter une entrée canonical avec l'ancien nom en alias
      for (const [oldName, newCanonical] of pendingRenames.entries()) {
        const cleanOld = cleanDisplayName(oldName);
        const existing = newProducts.find(
          (p) => p.canonical.toLowerCase() === newCanonical.toLowerCase()
        );
        if (existing) {
          if (!existing.aliases.some((a) => a.toLowerCase() === cleanOld.toLowerCase())) {
            existing.aliases.push(cleanOld);
          }
        } else {
          newProducts.push({
            canonical: newCanonical,
            aliases: [newCanonical, cleanOld].filter(
              (v, i, a) => a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i
            ),
            category: '',
            notes: ''
          });
        }
      }

      // Garder : ajouter en tant que produit canonique tel quel
      for (const name of pendingKeeps) {
        const cleanName = cleanDisplayName(name);
        const existing = newProducts.find(
          (p) => p.canonical.toLowerCase() === cleanName.toLowerCase()
        );
        if (!existing) {
          newProducts.push({
            canonical: cleanName,
            aliases: [cleanName],
            category: '',
            notes: ''
          });
        }
      }

      // Exclusions
      for (const name of pendingExclude) {
        const cleanName = cleanDisplayName(name);
        if (!newExcluded.some((e) => e.toLowerCase() === cleanName.toLowerCase())) {
          newExcluded.push(cleanName);
        }
      }

      const res = await api.put('/positive/catalog', {
        products: newProducts,
        excluded: newExcluded
      });
      if (res.data?.success) {
        setCatalog({
          products: res.data.catalog.products,
          excluded: res.data.catalog.excluded
        });
        setPendingExclude(new Set());
        setPendingRenames(new Map());
        setPendingKeeps(new Set());
        alert('✅ Catalogue mis à jour.');
      } else {
        alert('❌ ' + (res.data?.error || 'Erreur'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingCatalog(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setFiles([]);
    setLieu('');
    setNote('');
    setPendingExclude(new Set());
    setPendingRenames(new Map());
    setPendingKeeps(new Set());
    setError('');
  };

  // ─── Rendu ───
  return (
    <div className="positive-page">
      <div className="positive-header">
        <h1>📷 Positive — Comptage IA</h1>
        <p className="positive-subtitle">
          Analyse de photos pour compter les produits en stock (frigo, étagère, livraison).
        </p>
      </div>

      <div className="positive-tabs">
        <button className={`tab ${activeTab === 'scan' ? 'active' : ''}`}>📸 Scan</button>
        <button className="tab disabled" disabled title="Disponible bientôt">
          📚 Catalogue ({catalog.products.length})
        </button>
        <button className="tab disabled" disabled title="Disponible bientôt">
          🕒 Historique
        </button>
      </div>

      {/* ───── ONGLET SCAN ───── */}
      {activeTab === 'scan' && (
        <div className="positive-content">
          {catalogLoading ? (
            <div className="positive-info">Chargement du catalogue…</div>
          ) : (
            <div className="positive-info">
              📚 Catalogue : <strong>{catalog.products.length}</strong> produits actifs,{' '}
              <strong>{catalog.excluded.length}</strong> exclus.
            </div>
          )}

          {!scanResult && (
            <>
              {/* Sélection photos */}
              <div className="positive-section">
                <h3>1. Photos à analyser</h3>
                <div className="positive-upload-buttons">
                  <label className="positive-btn positive-btn-primary">
                    📁 Sélectionner des photos
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFilesSelected}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <label className="positive-btn positive-btn-secondary">
                    📷 Prendre une photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleFilesSelected}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <p className="positive-hint">Maximum 10 photos, 12 Mo par photo.</p>

                {files.length > 0 && (
                  <div className="positive-thumbnails">
                    {files.map((f, i) => (
                      <div key={i} className="positive-thumb">
                        <img src={f.previewUrl} alt={`photo ${i + 1}`} />
                        <button
                          className="positive-thumb-remove"
                          onClick={() => removeFile(i)}
                          title="Retirer"
                        >
                          ×
                        </button>
                        <div className="positive-thumb-name">
                          {f.file.name.length > 18
                            ? f.file.name.slice(0, 15) + '…'
                            : f.file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contexte */}
              <div className="positive-section">
                <h3>2. Contexte (optionnel)</h3>
                <div className="positive-field">
                  <label>Lieu</label>
                  <input
                    type="text"
                    value={lieu}
                    onChange={(e) => setLieu(e.target.value)}
                    placeholder="Ex : Frigo principal, Réserve farines…"
                    maxLength={200}
                  />
                </div>
                <div className="positive-field">
                  <label>Note opérateur</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex : Livraison du lundi, après inventaire…"
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Bouton scan */}
              <div className="positive-actions">
                <button
                  className="positive-btn positive-btn-primary positive-btn-large"
                  onClick={handleScan}
                  disabled={scanning || !files.length}
                >
                  {scanning ? '⏳ Analyse en cours…' : `🔍 Analyser ${files.length} photo${files.length > 1 ? 's' : ''}`}
                </button>
              </div>

              {error && <div className="positive-error">{error}</div>}
              {scanning && (
                <div className="positive-info">
                  L'analyse peut prendre 5 à 30 secondes par photo selon la charge de Gemini.
                  En cas de surcharge, le serveur retente automatiquement.
                </div>
              )}
            </>
          )}

          {/* ───── RÉSULTATS ───── */}
          {scanResult && (
            <div className="positive-results">
              <div className="positive-results-header">
                <h2>📊 Résultats</h2>
                <button className="positive-btn positive-btn-secondary" onClick={resetScan}>
                  ↻ Nouveau scan
                </button>
              </div>

              {/* Tableau consolidé */}
              <div className="positive-section">
                <h3>Total consolidé</h3>
                <table className="positive-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th className="num">Quantité</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResult.totals.map((line) => {
                      const fullName = line.isNewLabel ? NEW_PREFIX + line.name : line.name;
                      const isExcluded = pendingExclude.has(fullName);
                      const renamedTo = pendingRenames.get(fullName);
                      const isKept = pendingKeeps.has(fullName);
                      const classification = line.isNewLabel ? 'new' : 'known';

                      return (
                        <tr
                          key={fullName}
                          className={`row-${classification} ${isExcluded ? 'row-excluded' : ''} ${
                            renamedTo ? 'row-renamed' : ''
                          } ${isKept ? 'row-kept' : ''}`}
                        >
                          <td>
                            {line.isNewLabel && <span className="badge badge-new">NOUVEAU</span>}
                            <span className={isExcluded ? 'strikethrough' : ''}>{line.name}</span>
                            {renamedTo && (
                              <span className="rename-hint"> → {renamedTo}</span>
                            )}
                          </td>
                          <td className="num">{line.count}</td>
                          <td className="actions">
                            {classification === 'new' && !isExcluded && !renamedTo && (
                              <button
                                className={`mini-btn ${isKept ? 'active' : ''}`}
                                onClick={() => togglePendingKeep(fullName)}
                                title="Ajouter au catalogue tel quel"
                              >
                                ✓ Garder
                              </button>
                            )}
                            {!isExcluded && (
                              <button
                                className={`mini-btn ${renamedTo ? 'active' : ''}`}
                                onClick={() => promptRename(fullName)}
                                title="Renommer (nom canonique)"
                              >
                                ✏️ Renommer
                              </button>
                            )}
                            <button
                              className={`mini-btn mini-btn-danger ${isExcluded ? 'active' : ''}`}
                              onClick={() => togglePendingExclude(fullName)}
                              title="Exclure du catalogue (ne plus compter)"
                            >
                              🚫 Exclure
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bouton sauvegarde catalogue */}
              {hasPendingChanges && (
                <div className="positive-actions positive-actions-save">
                  <div className="positive-pending-summary">
                    Modifications en attente :
                    {pendingKeeps.size > 0 && <> ✓ {pendingKeeps.size} ajouts</>}
                    {pendingRenames.size > 0 && <> ✏️ {pendingRenames.size} renommages</>}
                    {pendingExclude.size > 0 && <> 🚫 {pendingExclude.size} exclusions</>}
                  </div>
                  <button
                    className="positive-btn positive-btn-primary"
                    onClick={saveCatalogChanges}
                    disabled={savingCatalog}
                  >
                    {savingCatalog ? '💾 Sauvegarde…' : '💾 Enregistrer dans le catalogue'}
                  </button>
                </div>
              )}

              {/* Détail par photo */}
              <div className="positive-section">
                <h3>Détail par photo</h3>
                {scanResult.photos.map((photo, idx) => (
                  <div key={idx} className="positive-photo-detail">
                    <div className="positive-photo-title">
                      📸 {photo.fileName || `Photo ${idx + 1}`}
                    </div>
                    {photo.error ? (
                      <div className="positive-error">❌ {photo.error}</div>
                    ) : (
                      <>
                        {photo.products.length > 0 ? (
                          <ul className="positive-product-list">
                            {photo.products.map((p, i) => (
                              <li key={i} className={p.name?.startsWith(NEW_PREFIX) ? 'new' : ''}>
                                {p.count} × {cleanDisplayName(p.name)}
                                {p.confidence && (
                                  <span className="conf"> [{p.confidence}]</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="positive-hint">Aucun produit détecté.</p>
                        )}
                        {photo.incertains?.length > 0 && (
                          <div className="positive-incertains">
                            <strong>Incertains :</strong>
                            <ul>
                              {photo.incertains.map((i, k) => (
                                <li key={k}>? {i.count} × {i.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {photo.remarques && (
                          <div className="positive-remark">ℹ️ {photo.remarques}</div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
