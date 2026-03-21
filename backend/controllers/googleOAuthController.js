const { google } = require('googleapis');
const GoogleOAuthToken = require('../models/GoogleOAuthToken');

/**
 * Accès Google Sheets (lecture + écriture) + profil email.
 * `spreadsheets.readonly` peut provoquer « insufficient authentication scopes » selon les tokens
 * ou la config GCP ; le scope complet `spreadsheets` est requis pour l’API Sheets v4.
 * Après changement de scopes : déconnecter puis reconnecter Google sur la page Commandes.
 */
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
];

function commandesEnLignePath(city) {
  const c = (city || 'longuenesse').toLowerCase();
  return c === 'arras' ? '/plan/commandes-en-ligne' : '/lon/commandes-en-ligne';
}

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Connexion Google non configurée. L\'administrateur doit ajouter GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans les variables d\'environnement Render. Voir backend/GOOGLE_OAUTH_SETUP.md');
  }
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_OAUTH_REDIRECT_URI || `${(process.env.API_BASE_URL || 'https://boulangerie-planning-api-3.onrender.com')}/api/online-orders/auth/google/callback`
  );
}

function buildFrontendUrl(path) {
  const base = process.env.FRONTEND_URL || 'https://www.filmara.fr';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
}

async function initiateAuth(req, res) {
  try {
    const city = (req.query.city || 'longuenesse').toLowerCase();
    const returnUrl = req.query.return_url || req.query.returnUrl || '';
    const oauth2Client = getOAuth2Client();
    const state = Buffer.from(JSON.stringify({ city, returnUrl })).toString('base64');
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state
    });
    res.redirect(authUrl);
  } catch (error) {
    console.error('Erreur initiateAuth:', error);
    const city = (req.query.city || 'longuenesse').toLowerCase();
    const redirectTo = req.query.return_url || req.query.returnUrl || buildFrontendUrl(commandesEnLignePath(city));
    const sep = redirectTo.includes('?') ? '&' : '?';
    res.redirect(`${redirectTo}${sep}google_error=${encodeURIComponent(error.message)}`);
  }
}

async function handleCallback(req, res) {
  try {
    const { code, state } = req.query;
    let city = 'longuenesse';
    let returnUrl = '';
    try {
      const decoded = JSON.parse(Buffer.from(state || '{}', 'base64').toString());
      city = decoded.city || city;
      returnUrl = decoded.returnUrl || decoded.return_url || '';
    } catch (_) {}
    if (!code) {
      return res.redirect(buildFrontendUrl(`${commandesEnLignePath(city)}?google_error=no_code`));
    }
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error('Google n\'a pas fourni de refresh token. Réessayez en vous déconnectant puis en vous reconnectant.');
    }
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    oauth2Client.setCredentials(tokens);
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data?.email || '';
    const grantedScopes = typeof tokens.scope === 'string' ? tokens.scope : '';
    console.log('✅ Google OAuth connecté:', { city, email, scopes: grantedScopes });
    if (grantedScopes && !grantedScopes.includes('spreadsheets')) {
      console.warn('⚠️ Le jeton Google ne contient pas le scope spreadsheets — reconnectez-vous ou vérifiez l’écran de consentement OAuth (GCP).');
    }
    await GoogleOAuthToken.findOneAndUpdate(
      { city },
      {
        refreshToken: tokens.refresh_token,
        accessToken: '',
        expiryDate: null,
        email,
        grantedScopes
      },
      { upsert: true, new: true }
    );
    const redirectTo = returnUrl || buildFrontendUrl(`${commandesEnLignePath(city)}?google_connected=1`);
    res.redirect(redirectTo);
  } catch (error) {
    console.error('Erreur handleCallback:', error);
    let cityErr = 'longuenesse';
    try {
      const decoded = JSON.parse(Buffer.from(req.query.state || '{}', 'base64').toString());
      cityErr = decoded.city || cityErr;
    } catch (_) {}
    res.redirect(buildFrontendUrl(`${commandesEnLignePath(cityErr)}?google_error=${encodeURIComponent(error.message)}`));
  }
}

async function getAuthStatus(req, res) {
  try {
    const token =
      (await GoogleOAuthToken.findOne({ city: 'longuenesse' })) ||
      (await GoogleOAuthToken.findOne({ city: 'arras' }));
    res.json({
      success: true,
      connected: !!token?.refreshToken,
      email: token?.email || '',
      grantedScopes: token?.grantedScopes || ''
    });
  } catch (error) {
    console.error('Erreur getAuthStatus:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function disconnect(req, res) {
  try {
    // Un seul compte Google pour l’école : supprimer longuenesse + arras (évite jetons obsolètes après changements de routes)
    const result = await GoogleOAuthToken.deleteMany({ city: { $in: ['longuenesse', 'arras'] } });
    console.log(`🗑️ Google OAuth déconnecté (${result.deletedCount} entrée(s))`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur disconnect:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  initiateAuth,
  handleCallback,
  getAuthStatus,
  disconnect,
  getOAuth2Client
};
