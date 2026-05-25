/** Traduction EN→FR via MyMemory (gratuit, sans clé). */
async function translateToFrench(text) {
  const en = String(text || '').trim();
  if (!en) return en;
  if (/[àâäéèêëïîôùûüçœæ]/i.test(en) && !/\b(the|you|your|today|will|may)\b/i.test(en)) {
    return en;
  }

  const chunks = [];
  let rest = en;
  const max = 450;
  while (rest.length > 0) {
    let piece = rest.slice(0, max);
    if (rest.length > max) {
      const cut = piece.lastIndexOf('. ');
      if (cut > 80) piece = piece.slice(0, cut + 1);
    }
    chunks.push(piece);
    rest = rest.slice(piece.length).trimStart();
  }

  const out = [];
  for (const piece of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(piece)}&langpair=en|fr`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return en;
    const json = await res.json();
    const tr = json?.responseData?.translatedText;
    if (!tr || json.responseStatus === 429) return en;
    out.push(tr);
  }
  return out.join(' ').trim() || en;
}

module.exports = { translateToFrench };
