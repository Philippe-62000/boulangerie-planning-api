const Employee = require('../models/Employee');
const VehicleTrip = require('../models/VehicleTrip');
const VehicleConfig = require('../models/VehicleConfig');

const getSite = (req) => {
  const s = (req.query.site || req.body.site || 'longuenesse').toLowerCase();
  return s === 'arras' ? 'arras' : 'longuenesse';
};

const daysBetween = (a, b) => Math.ceil((b - a) / (86400000));

exports.listDrivers = async (req, res) => {
  try {
    const drivers = await Employee.find({
      isActive: true,
      autoriseConduiteVehicule: true
    })
      .select('name')
      .sort({ name: 1 });
    res.json({ success: true, data: drivers });
  } catch (e) {
    console.error('vehicle listDrivers', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const site = getSite(req);
    let cfg = await VehicleConfig.findOne({ site });
    if (!cfg) {
      cfg = await VehicleConfig.create({ site });
    }
    res.json({ success: true, data: cfg });
  } catch (e) {
    console.error('vehicle getConfig', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.putConfig = async (req, res) => {
  try {
    const site = getSite(req);
    const {
      controleTechniqueDate,
      dateRenouvellement,
      prochaineRevisionKm,
      prochaineRevisionDate,
      rappelKmAvantRevision,
      rappelJoursAvantRevision,
      rappelJoursAvantCT,
      rappelJoursAvantRenouvellement
    } = req.body;

    const patch = {};
    if (controleTechniqueDate !== undefined) {
      patch.controleTechniqueDate = controleTechniqueDate ? new Date(controleTechniqueDate) : null;
    }
    if (dateRenouvellement !== undefined) {
      patch.dateRenouvellement = dateRenouvellement ? new Date(dateRenouvellement) : null;
    }
    if (prochaineRevisionKm !== undefined) {
      patch.prochaineRevisionKm =
        prochaineRevisionKm === null || prochaineRevisionKm === ''
          ? null
          : Number(prochaineRevisionKm);
    }
    if (prochaineRevisionDate !== undefined) {
      patch.prochaineRevisionDate = prochaineRevisionDate ? new Date(prochaineRevisionDate) : null;
    }
    if (rappelKmAvantRevision !== undefined) patch.rappelKmAvantRevision = Number(rappelKmAvantRevision) || 500;
    if (rappelJoursAvantRevision !== undefined) patch.rappelJoursAvantRevision = Number(rappelJoursAvantRevision) || 30;
    if (rappelJoursAvantCT !== undefined) patch.rappelJoursAvantCT = Number(rappelJoursAvantCT) || 30;
    if (rappelJoursAvantRenouvellement !== undefined) {
      patch.rappelJoursAvantRenouvellement = Number(rappelJoursAvantRenouvellement) || 30;
    }

    const cfg = await VehicleConfig.findOneAndUpdate(
      { site },
      { $set: patch },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: cfg });
  } catch (e) {
    console.error('vehicle putConfig', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.listTrips = async (req, res) => {
  try {
    const site = getSite(req);
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const trips = await VehicleTrip.find({ site })
      .populate('driverId', 'name')
      .populate('pleinParEmployeeId', 'name')
      .sort({ dateDepart: -1 })
      .limit(limit);
    res.json({ success: true, data: trips });
  } catch (e) {
    console.error('vehicle listTrips', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.startTrip = async (req, res) => {
  try {
    const site = getSite(req);
    const {
      driverId,
      kmDepart,
      etatInterieur,
      etatExterieur,
      remarquesDepart
    } = req.body;

    if (!driverId || kmDepart === undefined || kmDepart === null) {
      return res.status(400).json({ success: false, error: 'Conducteur et km départ requis' });
    }
    const ei = Number(etatInterieur);
    const ee = Number(etatExterieur);
    if (ei < 1 || ei > 5 || ee < 1 || ee > 5) {
      return res.status(400).json({ success: false, error: 'États intérieur/extérieur : 1 à 5' });
    }

    const driver = await Employee.findOne({
      _id: driverId,
      isActive: true,
      autoriseConduiteVehicule: true
    });
    if (!driver) {
      return res.status(400).json({ success: false, error: 'Conducteur non autorisé' });
    }

    const km = Number(kmDepart);
    if (Number.isNaN(km) || km < 0) {
      return res.status(400).json({ success: false, error: 'Km départ invalide' });
    }

    const trip = await VehicleTrip.create({
      site,
      driverId,
      kmDepart: km,
      etatInterieur: ei,
      etatExterieur: ee,
      remarquesDepart: remarquesDepart != null ? String(remarquesDepart).slice(0, 2000) : ''
    });

    const populated = await VehicleTrip.findById(trip._id)
      .populate('driverId', 'name')
      .populate('pleinParEmployeeId', 'name')
      .lean();

    res.json({ success: true, data: populated });
  } catch (e) {
    console.error('vehicle startTrip', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.completeReturn = async (req, res) => {
  try {
    const site = getSite(req);
    const { id } = req.params;
    const {
      destination,
      kmRetour,
      problemeVoyantMoteur,
      problemeAutre,
      problemeRemarque,
      todoLaveGlace,
      todoPneu,
      todoRevision,
      todoPlein,
      pleinEffectue,
      pleinParEmployeeId
    } = req.body;

    const trip = await VehicleTrip.findOne({ _id: id, site });
    if (!trip) return res.status(404).json({ success: false, error: 'Trajet introuvable' });
    if (trip.status !== 'en_cours') {
      return res.status(400).json({ success: false, error: 'Ce trajet est déjà terminé' });
    }

    const kr = Number(kmRetour);
    if (Number.isNaN(kr) || kr < trip.kmDepart) {
      return res.status(400).json({
        success: false,
        error: 'Km retour invalide (doit être ≥ km départ)'
      });
    }

    trip.destination = destination != null ? String(destination).slice(0, 500) : '';
    trip.kmRetour = kr;
    trip.dateRetour = new Date();
    trip.dateDepart = trip.dateDepart || trip.createdAt;
    trip.problemeVoyantMoteur = Boolean(problemeVoyantMoteur);
    trip.problemeAutre = Boolean(problemeAutre);
    trip.problemeRemarque = problemeRemarque != null ? String(problemeRemarque).slice(0, 2000) : '';
    trip.todoLaveGlace = Boolean(todoLaveGlace);
    trip.todoPneu = Boolean(todoPneu);
    trip.todoRevision = Boolean(todoRevision);
    trip.todoPlein = Boolean(todoPlein);

    if (pleinEffectue) {
      let pleinPar = pleinParEmployeeId || trip.driverId;
      const emp = await Employee.findOne({
        _id: pleinPar,
        isActive: true,
        autoriseConduiteVehicule: true
      });
      if (!emp) {
        return res.status(400).json({ success: false, error: 'Personne « plein » invalide' });
      }
      trip.pleinEffectue = true;
      trip.pleinDate = new Date();
      trip.pleinKm = kr;
      trip.pleinParEmployeeId = pleinPar;
    } else {
      trip.pleinEffectue = false;
      trip.pleinDate = null;
      trip.pleinKm = null;
      trip.pleinParEmployeeId = null;
    }

    trip.status = 'termine';
    await trip.save();

    const populated = await VehicleTrip.findById(trip._id)
      .populate('driverId', 'name')
      .populate('pleinParEmployeeId', 'name')
      .lean();

    res.json({ success: true, data: populated });
  } catch (e) {
    console.error('vehicle completeReturn', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const site = getSite(req);
    const cfg = await VehicleConfig.findOne({ site });
    const termine = await VehicleTrip.find({ site, status: 'termine' }).lean();

    let totalKm = 0;
    termine.forEach((t) => {
      if (t.kmRetour != null && t.kmDepart != null) {
        totalKm += t.kmRetour - t.kmDepart;
      }
    });

    const pleinTrips = [];
    termine.forEach((t) => {
      if (t.pleinEffectue && t.pleinDate && t.pleinKm != null) {
        pleinTrips.push({
          date: t.pleinDate,
          km: t.pleinKm,
          driverId: t.pleinParEmployeeId
        });
      }
    });
    pleinTrips.sort((a, b) => new Date(a.date) - new Date(b.date));

    const pleinByEmployee = {};
    termine.forEach((t) => {
      if (t.pleinEffectue && t.pleinParEmployeeId) {
        const id = t.pleinParEmployeeId.toString();
        pleinByEmployee[id] = (pleinByEmployee[id] || 0) + 1;
      }
    });
    const pleinNames = {};
    for (const id of Object.keys(pleinByEmployee)) {
      const e = await Employee.findById(id).select('name');
      pleinNames[e?.name || id] = pleinByEmployee[id];
    }

    let avgKmBetweenPleins = null;
    if (pleinTrips.length >= 2) {
      const deltas = [];
      for (let i = 1; i < pleinTrips.length; i++) {
        const d = pleinTrips[i].km - pleinTrips[i - 1].km;
        if (d > 0) deltas.push(d);
      }
      if (deltas.length) {
        avgKmBetweenPleins = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length);
      }
    }

    let lastOdometer = null;
    termine.forEach((t) => {
      if (t.kmRetour != null) {
        if (lastOdometer === null || t.kmRetour > lastOdometer) lastOdometer = t.kmRetour;
      }
    });

    const problemTrips = await VehicleTrip.find({
      site,
      status: 'termine',
      $or: [{ problemeVoyantMoteur: true }, { problemeAutre: true }]
    })
      .populate('driverId', 'name')
      .sort({ dateRetour: -1 })
      .limit(25)
      .lean();

    const warnings = [];
    const now = new Date();
    if (cfg) {
      if (cfg.controleTechniqueDate) {
        const d = new Date(cfg.controleTechniqueDate);
        const days = daysBetween(now, d);
        const seuil = cfg.rappelJoursAvantCT || 30;
        if (days < 0) {
          warnings.push(`⚠️ Contrôle technique : date dépassée depuis ${-days} jour(s) (${d.toLocaleDateString('fr-FR')}).`);
        } else if (days <= seuil) {
          warnings.push(`Contrôle technique : échéance dans ${days} jour(s) (${d.toLocaleDateString('fr-FR')}).`);
        }
      }
      if (cfg.dateRenouvellement) {
        const d = new Date(cfg.dateRenouvellement);
        const days = daysBetween(now, d);
        const seuil = cfg.rappelJoursAvantRenouvellement || 30;
        if (days < 0) {
          warnings.push(`⚠️ Renouvellement : date dépassée depuis ${-days} jour(s) (${d.toLocaleDateString('fr-FR')}).`);
        } else if (days <= seuil) {
          warnings.push(`Renouvellement : dans ${days} jour(s) (${d.toLocaleDateString('fr-FR')}).`);
        }
      }
      if (cfg.prochaineRevisionDate) {
        const d = new Date(cfg.prochaineRevisionDate);
        const days = daysBetween(now, d);
        const seuil = cfg.rappelJoursAvantRevision || 30;
        if (days < 0) {
          warnings.push(`⚠️ Révision (date) : échéance dépassée depuis ${-days} jour(s) (${d.toLocaleDateString('fr-FR')}).`);
        } else if (days <= seuil) {
          warnings.push(`Révision prévue par date : dans ${days} jour(s) (${d.toLocaleDateString('fr-FR')}).`);
        }
      }
      if (cfg.prochaineRevisionKm != null && lastOdometer != null) {
        const rest = cfg.prochaineRevisionKm - lastOdometer;
        const seuil = cfg.rappelKmAvantRevision || 500;
        if (rest < 0) {
          warnings.push(`⚠️ Révision (km) : km objectif dépassé de ${-rest} km (odomètre ${lastOdometer}, cible ${cfg.prochaineRevisionKm}).`);
        } else if (rest <= seuil) {
          warnings.push(`Révision prévue par km : il reste environ ${rest} km (odomètre actuel ${lastOdometer}).`);
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalKm,
        tripCount: termine.length,
        pleinByEmployee: pleinNames,
        avgKmBetweenPleins,
        lastOdometer,
        problemTrips,
        warnings
      }
    });
  } catch (e) {
    console.error('vehicle getStats', e);
    res.status(500).json({ success: false, error: e.message });
  }
};
