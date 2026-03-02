const { google } = require('googleapis');
const GoogleOAuthToken = require('../models/GoogleOAuthToken');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
];

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
    const redirectTo = req.query.return_url || req.query.returnUrl || buildFrontendUrl('/lon/commandes-en-ligne');
    const sep = redirectTo.includes('?') ? '&' : '?';
    res.redirect(`${redirectTo}${sep}google_error=${encodeURIComponent(error.message)}`);
  }
}

async function handleCallback(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.redirect(buildFrontendUrl('/lon/commandes-en-ligne?google_error=no_code'));
    }
    let city = 'longuenesse';
    let returnUrl = '';
    try {
      const decoded = JSON.parse(Buffer.from(state || '{}', 'base64').toString());
      city = decoded.city || city;
      returnUrl = decoded.returnUrl || decoded.return_url || '';
    } catch (_) {}
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error('Google n\'a pas fourni de refresh token. Réessayez en vous déconnectant puis en vous reconnectant.');
    }
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    oauth2Client.setCredentials(tokens);
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data?.email || '';
    await GoogleOAuthToken.findOneAndUpdate(
      { city },
      {
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token || '',
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        email
      },
      { upsert: true, new: true }
    );
    const redirectTo = returnUrl || buildFrontendUrl('/lon/commandes-en-ligne?google_connected=1');
    res.redirect(redirectTo);
  } catch (error) {
    console.error('Erreur handleCallback:', error);
    res.redirect(buildFrontendUrl(`/lon/commandes-en-ligne?google_error=${encodeURIComponent(error.message)}`));
  }
}

async function getAuthStatus(req, res) {
  try {
    const city = (req.query.city || 'longuenesse').toLowerCase();
    const token = await GoogleOAuthToken.findOne({ city });
    res.json({
      success: true,
      connected: !!token?.refreshToken,
      email: token?.email || ''
    });
  } catch (error) {
    console.error('Erreur getAuthStatus:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function disconnect(req, res) {
  try {
    const city = (req.query.city || req.body?.city || 'longuenesse').toLowerCase();
    await GoogleOAuthToken.deleteOne({ city });
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
