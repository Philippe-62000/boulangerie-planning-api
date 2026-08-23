/**
 * Corps utile d’un mail de commande (B&B, etc.) : on garde jusqu’à
 * « Cordialement / La réception » et on jette signature, logos, réseaux, URLs.
 */
function trimCommandeMailBody(text) {
  let t = String(text || '').replace(/\r\n/g, '\n');
  if (!t.trim()) return '';

  t = t.replace(/https?:\/\/mibc-[^\s)>\]]+/gi, '');
  t = t.replace(/https?:\/\/[^\s]*bit\.ly[^\s)>\]]*/gi, '');

  const reception = t.match(/([\s\S]*?\bLa r[ée]ception\.?)(?:\s*\n|$)/i);
  if (reception) {
    t = reception[1];
  } else {
    const cuts = [
      t.search(/\n\[image:/i),
      t.search(/\n\*Boulet Delphine\*/i),
      t.search(/\nBoulet Delphine\s*$/m)
    ].filter((i) => i > 80);
    if (cuts.length) t = t.slice(0, Math.min(...cuts));
  }

  t = t
    .split('\n')
    .filter((line) => {
      const s = line.trim();
      if (!s) return true;
      if (/^\[image:/i.test(s)) return false;
      if (/^https?:\/\//i.test(s)) return false;
      if (/mailinblack\.com/i.test(s)) return false;
      return true;
    })
    .join('\n');

  return t.replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { trimCommandeMailBody };
