/**
 * Service Positive : appel Gemini Vision pour compter les produits d'une photo.
 *
 * Adapté du script CLI standalone `C:\stock-vision\count-stock.js` mais en CommonJS
 * pour s'intégrer au backend Express. Pas de stockage des photos : tout passe en mémoire.
 *
 * Variables d'environnement :
 *   - GEMINI_API_KEY (obligatoire) : clé API Gemini
 *   - GEMINI_MODEL (optionnel)     : modèle, par défaut 'gemini-2.5-flash'
 */

const { GoogleGenAI } = require('@google/genai');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let cachedClient = null;
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY manquant côté serveur. Configurer la variable sur Render.');
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

const BASE_SYSTEM_PROMPT = `Tu es un assistant d'inventaire pour une boulangerie.
À partir d'UNE photo d'un stock (frigo, étagère, réserve, livraison), tu identifies chaque
produit visible et tu comptes son exemplaire.

Règles strictes :
- Tu ne dois RIEN inventer. Si tu n'es pas sûr d'un produit, mets-le dans "incertains".
- Tu comptes les pots, packs, plaquettes, boîtes, briques EMPILÉS ou alignés, même partiellement visibles.
- Tu lis les étiquettes (marque + grammage si visibles) pour identifier précisément.
- Tu ne comptes PAS le mobilier (grille, étagère, frigo, films plastique vides).
- Si plusieurs produits différents : un objet par ligne dans "products".

Réponds UNIQUEMENT par un JSON valide, sans markdown, sans commentaire avant/après,
au format strict suivant :

{
  "products": [
    { "name": "Mascarpone Quality 500g", "count": 6, "confidence": "haute" }
  ],
  "incertains": [
    { "description": "paquet rectangulaire vert (beurre ?)", "count": 1 }
  ],
  "remarques": "texte libre court (lumière, occlusion, etc.) ou chaîne vide"
}

Les niveaux de confidence autorisés : "haute" | "moyenne" | "basse".`;

function buildCatalogPromptSection(catalog) {
  if (!catalog || (!catalog.products?.length && !catalog.excluded?.length)) return '';
  const lines = ['', '────────────────────', 'CATALOGUE DE RÉFÉRENCE (priorité absolue)'];

  if (catalog.products?.length) {
    lines.push('');
    lines.push('Voici les produits attendus dans cet inventaire. Quand tu reconnais l\'un');
    lines.push('d\'eux, utilise EXACTEMENT le nom canonique de cette liste, même si l\'étiquette');
    lines.push('comporte des variations mineures de formulation :');
    for (const p of catalog.products) {
      const aliases = (p.aliases || []).filter((a) => a !== p.canonical);
      const aliasStr = aliases.length ? ` (peut aussi apparaître comme : ${aliases.join(' / ')})` : '';
      lines.push(`  - ${p.canonical}${aliasStr}`);
    }
  }

  if (catalog.excluded?.length) {
    lines.push('');
    lines.push('PRODUITS À IGNORER (ne PAS compter, ne PAS lister) :');
    for (const e of catalog.excluded) {
      lines.push(`  - ${e}`);
    }
  }

  lines.push('');
  lines.push('Si tu vois un produit qui N\'EST PAS dans le catalogue ci-dessus et qui n\'est');
  lines.push('PAS dans la liste à ignorer, tu peux le lister dans "products" mais préfixe son');
  lines.push('nom avec "[NOUVEAU] " pour qu\'on puisse l\'identifier facilement.');
  return lines.join('\n');
}

function parseJsonResponse(rawText) {
  let txt = (rawText || '').trim();
  if (txt.startsWith('```')) {
    txt = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }
  try {
    return JSON.parse(txt);
  } catch (err) {
    return { _parseError: err.message, _raw: rawText, products: [], incertains: [], remarques: '' };
  }
}

function isRetriableError(err) {
  const msg = err && err.message ? err.message : String(err);
  return /\b(503|429|500)\b/.test(msg) || /UNAVAILABLE|RESOURCE_EXHAUSTED|INTERNAL|overloaded|high demand/i.test(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeProductsWithCatalog(products, catalog) {
  let normalizedCount = 0;
  const out = [];
  for (const p of products || []) {
    if (!p || !p.name) continue;
    const lower = String(p.name).toLowerCase();
    let canonical = null;
    for (const prod of catalog.products || []) {
      if ((prod.aliases || []).some((a) => String(a).toLowerCase() === lower)) {
        canonical = prod.canonical;
        break;
      }
    }
    if (canonical && canonical !== p.name) {
      normalizedCount++;
      out.push({ ...p, name: canonical, originalName: p.name });
    } else {
      out.push(p);
    }
  }
  return { products: out, normalizedCount };
}

async function callGeminiOnce(imagePart, userText, systemPrompt) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [imagePart, { text: userText }] }],
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  });
  return response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function buildImagePart(buffer, mimeType) {
  if (!buffer || !buffer.length) throw new Error('Photo vide');
  if (!mimeType || !mimeType.startsWith('image/')) {
    throw new Error(`Type MIME non supporté : ${mimeType}`);
  }
  return { inlineData: { mimeType, data: buffer.toString('base64') } };
}

/**
 * Analyse une photo unique.
 * @param {Object} param
 * @param {Buffer} param.buffer    contenu binaire de la photo
 * @param {string} param.mimeType  ex 'image/jpeg'
 * @param {string} [param.lieu]    contexte (frigo, réserve...)
 * @param {string} [param.note]    note opérateur
 * @param {Object} [param.catalog] catalogue { products: [...], excluded: [...] }
 */
async function analyzeOne({ buffer, mimeType, lieu = '', note = '', catalog = null }) {
  const imagePart = buildImagePart(buffer, mimeType);
  const contextLines = [];
  if (lieu) contextLines.push(`Lieu / contexte : ${lieu}`);
  if (note) contextLines.push(`Note opérateur : ${note}`);
  const userText = contextLines.length
    ? `Contexte additionnel :\n${contextLines.join('\n')}\n\nAnalyse la photo et réponds en JSON.`
    : 'Analyse la photo et réponds en JSON.';

  const systemPrompt = BASE_SYSTEM_PROMPT + buildCatalogPromptSection(catalog);
  const maxAttempts = 4;
  const delaysMs = [5000, 15000, 30000, 60000];
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const text = await callGeminiOnce(imagePart, userText, systemPrompt);
      const parsed = parseJsonResponse(text);
      if (catalog && Array.isArray(parsed.products)) {
        const { products, normalizedCount } = normalizeProductsWithCatalog(parsed.products, catalog);
        parsed.products = products;
        if (normalizedCount) parsed._normalizedCount = normalizedCount;
      }
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isRetriableError(err)) {
        const wait = delaysMs[attempt - 1];
        console.log(`[positive] ↻ Gemini indisponible (tentative ${attempt}/${maxAttempts}), retry dans ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Analyse plusieurs photos séquentiellement, avec petite pause anti-rate-limit,
 * et calcule les totaux consolidés.
 */
async function analyzeMany({ files, lieu = '', note = '', catalog = null }) {
  const photos = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    try {
      const result = await analyzeOne({
        buffer: f.buffer,
        mimeType: f.mimetype,
        lieu,
        note,
        catalog
      });
      photos.push({
        fileName: f.originalname || `photo_${i + 1}`,
        products: Array.isArray(result.products) ? result.products : [],
        incertains: Array.isArray(result.incertains) ? result.incertains : [],
        remarques: result.remarques || (result._parseError ? `Parse error: ${result._parseError}` : ''),
        error: ''
      });
    } catch (err) {
      photos.push({
        fileName: f.originalname || `photo_${i + 1}`,
        products: [],
        incertains: [],
        remarques: '',
        error: err.message || String(err)
      });
    }
    if (i < files.length - 1) await sleep(2000);
  }

  // Totaux consolidés (clé = nom retourné, qui est canonique si catalogue actif)
  const totalsMap = new Map();
  for (const p of photos) {
    for (const line of p.products) {
      if (!line || !line.name) continue;
      const key = line.name;
      totalsMap.set(key, (totalsMap.get(key) || 0) + (Number(line.count) || 0));
    }
  }
  const totals = [...totalsMap.entries()]
    .map(([name, count]) => ({
      name: name.startsWith('[NOUVEAU] ') ? name.slice('[NOUVEAU] '.length) : name,
      count,
      isNewLabel: name.startsWith('[NOUVEAU] ')
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { photos, totals };
}

module.exports = {
  analyzeOne,
  analyzeMany,
  // exporté pour les tests éventuels
  _internal: { parseJsonResponse, normalizeProductsWithCatalog, buildCatalogPromptSection }
};
