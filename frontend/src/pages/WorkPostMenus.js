import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

function apiErrorMessage(error, fallback) {
  if (error?.response?.status === 404) {
    return 'Le réglage des menus n’est pas encore en ligne. Il faut déployer la mise à jour de l’API.';
  }
  return error?.response?.data?.error || fallback;
}

const WorkPostMenus = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [menuDraft, setMenuDraft] = useState({});
  const [itemDraft, setItemDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/work-posts/catalog');
      setRoles(Array.isArray(response.data?.roles) ? response.data.roles : []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Impossible de charger les menus.'));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (request) => {
    setSaving(true);
    setError('');
    try {
      const response = await request();
      setRoles(Array.isArray(response.data?.roles) ? response.data.roles : []);
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Enregistrement impossible.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const move = (payload) => run(() => api.post('/work-posts/catalog/move', payload));

  const saveEdit = async () => {
    if (!editing) return;
    let ok = false;
    if (editing.kind === 'role') {
      ok = await run(() => api.patch(`/work-posts/catalog/roles/${editing.roleId}`, { label: editing.label }));
    } else if (editing.kind === 'menu') {
      ok = await run(() => api.patch(
        `/work-posts/catalog/roles/${editing.roleId}/menus/${editing.menuId}`,
        { label: editing.label, hint: editing.hint }
      ));
    } else {
      ok = await run(() => api.patch(
        `/work-posts/catalog/roles/${editing.roleId}/menus/${editing.menuId}/items/${editing.itemId}`,
        {
          label: editing.label,
          detail: editing.detail,
          groupLabel: editing.groupLabel,
          weekly: editing.weekly
        }
      ));
    }
    if (ok) setEditing(null);
  };

  const addMenu = async (roleId) => {
    const label = String(menuDraft[roleId] || '').trim();
    if (!label) {
      setError('Indiquez le nom du nouveau menu.');
      return;
    }
    const ok = await run(() => api.post(`/work-posts/catalog/roles/${roleId}/menus`, { label }));
    if (ok) setMenuDraft((prev) => ({ ...prev, [roleId]: '' }));
  };

  const addItem = async (roleId, menuId) => {
    const key = `${roleId}/${menuId}`;
    const label = String(itemDraft[key] || '').trim();
    if (!label) {
      setError('Indiquez le texte de la nouvelle tâche.');
      return;
    }
    const ok = await run(() => api.post(
      `/work-posts/catalog/roles/${roleId}/menus/${menuId}/items`,
      { label }
    ));
    if (ok) setItemDraft((prev) => ({ ...prev, [key]: '' }));
  };

  const removeItem = (role, menu, item) => {
    if (!window.confirm(`Supprimer « ${item.label} » ? Elle disparaîtra de l’espace salarié.`)) return;
    run(() => api.delete(`/work-posts/catalog/roles/${role.id}/menus/${menu.id}/items/${item.id}`));
  };

  if (loading) return <p className="wpf-muted">Chargement des menus…</p>;

  return (
    <section className="wpf-editor">
      <div className="wpf-card">
        <h3>Menus et tâches</h3>
        <p className="wpf-muted">
          L’ordre ci-dessous est celui de l’espace salarié. Un menu ou une tâche masquée n’apparaît plus sur le téléphone.
        </p>
      </div>
      {error && <p className="wpf-banner is-error">{error}</p>}
      {roles.map((role, roleIndex) => (
        <article key={role.id} className={`wpf-editor-block ${role.visible ? '' : 'is-hidden'}`}>
          <div className="wpf-editor-row">
            <div className="wpf-order">
              <button type="button" disabled={saving || roleIndex === 0} onClick={() => move({ level: 'role', roleId: role.id, direction: 'up' })} aria-label="Monter le menu">↑</button>
              <button type="button" disabled={saving || roleIndex === roles.length - 1} onClick={() => move({ level: 'role', roleId: role.id, direction: 'down' })} aria-label="Descendre le menu">↓</button>
            </div>
            <button
              type="button"
              className={role.visible ? 'is-on' : ''}
              disabled={saving}
              onClick={() => run(() => api.patch(`/work-posts/catalog/roles/${role.id}`, { visible: !role.visible }))}
            >
              {role.visible ? 'Visible' : 'Masqué'}
            </button>
            {editing?.kind === 'role' && editing.roleId === role.id ? (
              <input value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} />
            ) : (
              <strong>{role.label}</strong>
            )}
            {editing?.kind === 'role' && editing.roleId === role.id ? (
              <>
                <button type="button" className="wpf-primary" disabled={saving} onClick={saveEdit}>Enregistrer</button>
                <button type="button" disabled={saving} onClick={() => setEditing(null)}>Annuler</button>
              </>
            ) : (
              <button type="button" disabled={saving} onClick={() => setEditing({ kind: 'role', roleId: role.id, label: role.label })}>Modifier</button>
            )}
          </div>

          {(role.menus || []).map((menu, menuIndex) => (
            <div key={menu.id} className={`wpf-editor-menu ${menu.visible ? '' : 'is-hidden'}`}>
              <div className="wpf-editor-row">
                <div className="wpf-order">
                  <button type="button" disabled={saving || menuIndex === 0} onClick={() => move({ level: 'menu', roleId: role.id, menuId: menu.id, direction: 'up' })} aria-label="Monter le sous-menu">↑</button>
                  <button type="button" disabled={saving || menuIndex === role.menus.length - 1} onClick={() => move({ level: 'menu', roleId: role.id, menuId: menu.id, direction: 'down' })} aria-label="Descendre le sous-menu">↓</button>
                </div>
                <button
                  type="button"
                  className={menu.visible ? 'is-on' : ''}
                  disabled={saving}
                  onClick={() => run(() => api.patch(`/work-posts/catalog/roles/${role.id}/menus/${menu.id}`, { visible: !menu.visible }))}
                >
                  {menu.visible ? 'Visible' : 'Masqué'}
                </button>
                {editing?.kind === 'menu' && editing.menuId === menu.id ? (
                  <>
                    <input value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} />
                    <input value={editing.hint} placeholder="Précision affichée au salarié" onChange={(event) => setEditing({ ...editing, hint: event.target.value })} />
                    <button type="button" className="wpf-primary" disabled={saving} onClick={saveEdit}>Enregistrer</button>
                    <button type="button" disabled={saving} onClick={() => setEditing(null)}>Annuler</button>
                  </>
                ) : (
                  <>
                    <strong>{menu.label}</strong>
                    {menu.hint ? <span>{menu.hint}</span> : null}
                    <button type="button" disabled={saving} onClick={() => setEditing({ kind: 'menu', roleId: role.id, menuId: menu.id, label: menu.label, hint: menu.hint || '' })}>Modifier</button>
                  </>
                )}
              </div>

              <div className="wpf-editor-items">
                {(menu.items || []).map((item, itemIndex) => (
                  <div key={item.id} className={`wpf-editor-item ${item.visible ? '' : 'is-hidden'}`}>
                    {editing?.kind === 'item' && editing.itemId === item.id ? (
                      <div className="wpf-editor-form">
                        <label>
                          Tâche
                          <input value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} />
                        </label>
                        <label>
                          Détail
                          <textarea value={editing.detail} onChange={(event) => setEditing({ ...editing, detail: event.target.value })} />
                        </label>
                        <label>
                          Intertitre
                          <input value={editing.groupLabel} onChange={(event) => setEditing({ ...editing, groupLabel: event.target.value })} />
                        </label>
                        <label className="wpf-check">
                          <input type="checkbox" checked={!!editing.weekly} onChange={(event) => setEditing({ ...editing, weekly: event.target.checked })} />
                          Peut être « pas aujourd’hui »
                        </label>
                        <div className="wpf-editor-row">
                          <button type="button" className="wpf-primary" disabled={saving} onClick={saveEdit}>Enregistrer</button>
                          <button type="button" disabled={saving} onClick={() => setEditing(null)}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="wpf-editor-row">
                        <div className="wpf-order">
                          <button type="button" disabled={saving || itemIndex === 0} onClick={() => move({ level: 'item', roleId: role.id, menuId: menu.id, itemId: item.id, direction: 'up' })} aria-label="Monter la tâche">↑</button>
                          <button type="button" disabled={saving || itemIndex === menu.items.length - 1} onClick={() => move({ level: 'item', roleId: role.id, menuId: menu.id, itemId: item.id, direction: 'down' })} aria-label="Descendre la tâche">↓</button>
                        </div>
                        <button
                          type="button"
                          className={item.visible ? 'is-on' : ''}
                          disabled={saving}
                          onClick={() => run(() => api.patch(`/work-posts/catalog/roles/${role.id}/menus/${menu.id}/items/${item.id}`, { visible: !item.visible }))}
                        >
                          {item.visible ? 'Visible' : 'Masqué'}
                        </button>
                        <div>
                          <strong>{item.label}</strong>
                          {item.detail ? <span>{item.detail}</span> : null}
                        </div>
                        <button type="button" disabled={saving} onClick={() => setEditing({
                          kind: 'item',
                          roleId: role.id,
                          menuId: menu.id,
                          itemId: item.id,
                          label: item.label,
                          detail: item.detail || '',
                          groupLabel: item.groupLabel || '',
                          weekly: !!item.weekly
                        })}
                        >
                          Modifier
                        </button>
                        <button type="button" className="is-danger" disabled={saving} onClick={() => removeItem(role, menu, item)}>Supprimer</button>
                      </div>
                    )}
                  </div>
                ))}
                {(menu.items || []).length === 0 && <p className="wpf-muted">Aucune tâche dans ce menu.</p>}
                <div className="wpf-editor-row">
                  <input
                    value={itemDraft[`${role.id}/${menu.id}`] || ''}
                    placeholder="Nouvelle tâche"
                    onChange={(event) => setItemDraft((prev) => ({ ...prev, [`${role.id}/${menu.id}`]: event.target.value }))}
                  />
                  <button type="button" className="wpf-primary" disabled={saving} onClick={() => addItem(role.id, menu.id)}>Ajouter la tâche</button>
                </div>
              </div>
            </div>
          ))}

          <div className="wpf-editor-row">
            <input
              value={menuDraft[role.id] || ''}
              placeholder="Nouveau menu"
              onChange={(event) => setMenuDraft((prev) => ({ ...prev, [role.id]: event.target.value }))}
            />
            <button type="button" disabled={saving} onClick={() => addMenu(role.id)}>Ajouter un menu</button>
          </div>
        </article>
      ))}
    </section>
  );
};

export default WorkPostMenus;
