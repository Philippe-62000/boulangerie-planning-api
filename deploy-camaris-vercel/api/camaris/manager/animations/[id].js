const { connectDB } = require('../../../../lib/mongodb');
const { saveManagerAnimation, deleteManagerAnimation } = require('../../../../lib/camarisService');
const { authenticateCamarisManager } = require('../../../../lib/auth');
const { setCors, handleOptions, parseBody } = require('../../../../lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const id = req.query?.id;
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID animation requis' });
  }

  try {
    await connectDB();
    const manager = await authenticateCamarisManager(req);

    if (req.method === 'PUT') {
      const data = await saveManagerAnimation(manager, parseBody(req), id);
      return res.status(200).json({ success: true, data });
    }
    if (req.method === 'DELETE') {
      await deleteManagerAnimation(id);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  } catch (e) {
    console.error('camaris/manager/animations/[id]', e);
    const status = e.status || 500;
    return res.status(status).json({ success: false, error: e.message || 'Erreur animation' });
  }
};
