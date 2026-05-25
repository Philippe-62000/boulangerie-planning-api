const API_BASE = 'https://horoscope-app-api.vercel.app/api/v1/get-horoscope';

const VALID = new Set([
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces'
]);

async function fetchHoroscope(sign) {
  const id = String(sign || '').toLowerCase();
  if (!VALID.has(id)) {
    const err = new Error('Signe invalide');
    err.status = 400;
    throw err;
  }
  const url = `${API_BASE}/${id}?day=TODAY`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    const err = new Error('Horoscope temporairement indisponible');
    err.status = 502;
    throw err;
  }
  const data = await res.json();
  return {
    sign: id,
    date: data.date || new Date().toISOString().slice(0, 10),
    horoscope: String(data.horoscope || data.sing || '').trim()
  };
}

module.exports = { fetchHoroscope, VALID };
