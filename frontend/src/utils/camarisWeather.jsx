/** Longuenesse — Open-Meteo (sans clé API) */
const LAT = 50.733;
const LON = 2.283;

const WMO = {
  sun: [0, 1],
  cloud: [2, 3],
  fog: [45, 48],
  drizzle: [51, 55, 56, 57],
  rain: [61, 63, 65, 66, 67, 80, 81, 82],
  snow: [71, 73, 75, 77, 85, 86],
  storm: [95, 96, 99]
};

const kindFromCode = (code) => {
  const c = Number(code);
  if (WMO.sun.includes(c)) return 'sun';
  if (WMO.storm.includes(c)) return 'storm';
  if (WMO.snow.includes(c)) return 'snow';
  if (WMO.rain.includes(c) || WMO.drizzle.includes(c)) return 'rain';
  if (WMO.fog.includes(c)) return 'cloud';
  if (WMO.cloud.includes(c)) return 'cloud';
  return 'cloud';
};

const phraseFor = (kind, tempC, isSunday = false) => {
  const t = tempC != null ? Number(tempC) : null;
  if (isSunday) {
    if (kind === 'rain' || kind === 'storm' || kind === 'drizzle') {
      return "Il va pleuvoir aujourd'hui : stand fermé le dimanche, retrouvez-nous dès lundi.";
    }
    if (kind === 'snow') {
      return "Il fait froid et l'ambiance est hivernale : stand fermé le dimanche, à bientôt en semaine.";
    }
    if (t != null && t >= 26) {
      return "Il va faire chaud aujourd'hui : stand fermé le dimanche, pensez à vous hydrater.";
    }
    if (t != null && t <= 8) {
      return "Il va faire froid aujourd'hui : stand fermé le dimanche, nos sandwichs chauds vous attendent en semaine.";
    }
    if (kind === 'sun') {
      return 'Beau temps : le stand Camaris reprend du lundi au samedi.';
    }
    return 'Temps variable : stand fermé le dimanche, animations possibles en semaine.';
  }
  if (kind === 'rain' || kind === 'storm' || kind === 'drizzle') {
    return "Il va pleuvoir aujourd'hui : venez vous réconforter à notre stand !";
  }
  if (kind === 'snow') {
    return "Il fait froid et l'ambiance est hivernale : nos viennoiseries chaudes vous attendent.";
  }
  if (t != null && t >= 26) {
    return "Il va faire chaud aujourd'hui : passez vous hydrater à notre stand !";
  }
  if (t != null && t <= 8) {
    return "Il va faire froid aujourd'hui : nous vous proposons nos sandwichs chauds.";
  }
  if (kind === 'sun') {
    return 'Beau temps : profitez de nos produits frais du jour en boutique.';
  }
  return 'Temps variable : passez nous voir pour une pause gourmande.';
};

export async function fetchCamarisWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Europe%2FParis`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Météo indisponible');
  const data = await res.json();
  const cur = data?.current;
  const kind = kindFromCode(cur?.weather_code);
  const isSunday = new Date().getDay() === 0;
  return {
    kind,
    temperature: cur?.temperature_2m ?? null,
    phrase: phraseFor(kind, cur?.temperature_2m, isSunday)
  };
}

export const WEATHER_ICONS = {
  sun: (
    <svg viewBox="0 0 64 64" className="camaris-weather-svg" aria-hidden="true">
      <circle cx="32" cy="32" r="14" fill="#f4b400" />
      <g stroke="#f4b400" strokeWidth="3" strokeLinecap="round">
        <line x1="32" y1="6" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="58" />
        <line x1="6" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="58" y2="32" />
        <line x1="13" y1="13" x2="19" y2="19" />
        <line x1="45" y1="45" x2="51" y2="51" />
        <line x1="13" y1="51" x2="19" y2="45" />
        <line x1="45" y1="19" x2="51" y2="13" />
      </g>
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 64 64" className="camaris-weather-svg" aria-hidden="true">
      <ellipse cx="28" cy="36" rx="18" ry="12" fill="#b0bec5" />
      <ellipse cx="42" cy="32" rx="16" ry="11" fill="#cfd8dc" />
    </svg>
  ),
  rain: (
    <svg viewBox="0 0 64 64" className="camaris-weather-svg" aria-hidden="true">
      <ellipse cx="28" cy="30" rx="18" ry="12" fill="#90a4ae" />
      <ellipse cx="42" cy="26" rx="16" ry="11" fill="#b0bec5" />
      <g stroke="#4fc3f7" strokeWidth="3" strokeLinecap="round">
        <line x1="22" y1="44" x2="18" y2="54" />
        <line x1="32" y1="44" x2="28" y2="54" />
        <line x1="42" y1="44" x2="38" y2="54" />
      </g>
    </svg>
  ),
  snow: (
    <svg viewBox="0 0 64 64" className="camaris-weather-svg" aria-hidden="true">
      <ellipse cx="30" cy="28" rx="17" ry="11" fill="#cfd8dc" />
      <text x="32" y="52" textAnchor="middle" fontSize="22" fill="#81d4fa">
        ❄
      </text>
    </svg>
  ),
  storm: (
    <svg viewBox="0 0 64 64" className="camaris-weather-svg" aria-hidden="true">
      <ellipse cx="30" cy="28" rx="17" ry="11" fill="#78909c" />
      <polygon points="34,38 28,50 32,50 26,58 38,44 33,44 40,38" fill="#ffc107" />
    </svg>
  ),
  drizzle: (
    <svg viewBox="0 0 64 64" className="camaris-weather-svg" aria-hidden="true">
      <ellipse cx="30" cy="28" rx="17" ry="11" fill="#b0bec5" />
      <g stroke="#81d4fa" strokeWidth="2" strokeLinecap="round">
        <line x1="24" y1="42" x2="22" y2="48" />
        <line x1="34" y1="42" x2="32" y2="48" />
      </g>
    </svg>
  )
};
