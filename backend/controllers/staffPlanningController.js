const Employee = require('../models/Employee');
const ApprenticePlanning = require('../models/ApprenticePlanning');
const StaffPlanningSettings = require('../models/StaffPlanningSettings');
const StaffWeekPlanning = require('../models/StaffWeekPlanning');
const emailService = require('../services/emailService');
const hours = require('../services/staffPlanningHours');

function settingsPlain(doc) {
  const json = doc.toObject ? doc.toObject() : doc;
  return {
    sundayOpen: json.sundayOpen,
    breakThresholdHours: json.breakThresholdHours,
    breakMinutes: json.breakMinutes,
    maxDayHours: json.maxDayHours,
    minRestHours: json.minRestHours,
    maxSplitGapHours: json.maxSplitGapHours,
    nightStart: json.nightStart,
    nightEnd: json.nightEnd,
    ot25FromHour: json.ot25FromHour,
    ot25ToHour: json.ot25ToHour,
    ot50FromHour: json.ot50FromHour,
    defaultCfaCode: json.defaultCfaCode || 'CFA8',
    words: (json.words || []).filter((word) => (
      word && String(word.code).toUpperCase() !== 'FERIE' && word.category !== 'ferie'
    ))
  };
}

function toPlain(doc) {
  if (doc == null) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject();
  if (doc._doc) return { ...doc._doc };
  return { ...doc };
}

function holidayDatesOf(week) {
  return Array.isArray(week?.holidayDates) ? week.holidayDates.filter(Boolean) : [];
}

function summarizeRow(row, settings, holidayDates) {
  const plain = toPlain(row) || {};
  const days = (plain.days || []).map((day) => hours.plainDay(day));
  const summarized = hours.summarizeDays(days, plain.contractedHours, settings, holidayDates);
  return {
    employeeId: plain.employeeId,
    employeeName: plain.employeeName,
    contractedHours: plain.contractedHours,
    employeeCategory: plain.employeeCategory || 'vente',
    ...summarized
  };
}

function getSiteKey() {
  const appBasePath = process.env.APP_BASE_PATH;
  if (appBasePath === '/lon') return 'lon';
  const corsOrigin = process.env.CORS_ORIGIN || '';
  return corsOrigin.includes('/lon') ? 'lon' : 'plan';
}

function requireAdmin(req, res) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Action réservée à l\'administrateur' });
    return false;
  }
  return true;
}

function applyCodeToDay(day, code, settings) {
  return hours.computeDay({ kind: 'code', code }, { day: day.day, date: day.date }, settings);
}

function buildEmptyRow(employee, dates, settings, holidayDates) {
  let days = dates.map((meta) => hours.emptyDay(meta.day, meta.date));
  if (!settings.sundayOpen) {
    days = days.map((day) => (
      day.day === 'Dimanche' ? applyCodeToDay(day, 'REPOS', settings) : day
    ));
  }
  const summarized = hours.summarizeDays(days, employee.weeklyHours, settings, holidayDates);
  return {
    employeeId: employee._id,
    employeeName: employee.name,
    contractedHours: employee.weeklyHours,
    employeeCategory: employee.employeeCategory || 'vente',
    ...summarized
  };
}

async function cfaDatesByEmployee(dates) {
  const siteKey = getSiteKey();
  const dateSet = new Set(dates.map((item) => item.date));
  const plannings = await ApprenticePlanning.find(
    siteKey ? { $or: [{ siteKey }, { siteKey: { $exists: false } }] } : {}
  ).lean();
  const map = new Map();
  plannings.forEach((planning) => {
    const cfaDates = new Set();
    if (Array.isArray(planning.trainingEntries) && planning.trainingEntries.length) {
      planning.trainingEntries.forEach((entry) => {
        if (entry.kind === 'cfa' && dateSet.has(entry.date)) cfaDates.add(entry.date);
      });
    } else {
      (planning.trainingDates || []).forEach((date) => {
        if (dateSet.has(date)) cfaDates.add(date);
      });
    }
    if (cfaDates.size) map.set(String(planning.employeeId), cfaDates);
  });
  return map;
}

function applyCfaAndSunday(row, dates, settings, cfaMap, { overwriteCodes = false, trainingDays = [], holidayDates = [] } = {}) {
  const plain = toPlain(row) || {};
  const cfaCode = hours.findWord(settings, settings.defaultCfaCode || 'CFA8')
    ? (settings.defaultCfaCode || 'CFA8')
    : 'CFA';
  const cfaDates = cfaMap.get(String(plain.employeeId || row.employeeId));
  const days = (plain.days || []).map((raw) => {
    const day = hours.plainDay(raw);
    const isSundayClosed = !settings.sundayOpen && day.day === 'Dimanche';
    const isCfa = (cfaDates && cfaDates.has(day.date))
      || (Array.isArray(trainingDays) && trainingDays.includes(day.day) && !(cfaDates && cfaDates.size));
    if (isCfa && (day.kind === 'empty' || overwriteCodes)) {
      return applyCodeToDay(day, cfaCode, settings);
    }
    if (isSundayClosed && (day.kind === 'empty' || day.code === 'REPOS')) {
      return applyCodeToDay(day, 'REPOS', settings);
    }
    return day;
  });
  const summarized = hours.summarizeDays(days, plain.contractedHours, settings, holidayDates);
  return {
    employeeId: plain.employeeId,
    employeeName: plain.employeeName,
    contractedHours: plain.contractedHours,
    employeeCategory: plain.employeeCategory || 'vente',
    ...summarized
  };
}

async function syncWeekRows(weekDoc, settings) {
  const dates = hours.weekDates(weekDoc.weekNumber, weekDoc.year);
  const holidayDates = new Set(holidayDatesOf(weekDoc));
  (weekDoc.rows || []).forEach((row) => {
    const plain = toPlain(row);
    (plain.days || []).forEach((raw) => {
      const day = hours.plainDay(raw);
      if (String(day.code || '').toUpperCase() === 'FERIE') {
        if (day.date) holidayDates.add(day.date);
      }
    });
  });
  const holidayList = Array.from(holidayDates);
  const employees = await Employee.find({ isActive: true }).sort({ name: 1 }).lean();
  const cfaMap = await cfaDatesByEmployee(dates);
  const byId = new Map((weekDoc.rows || []).map((row) => [String(row.employeeId), row]));

  const rows = employees.map((employee) => {
    const existing = byId.get(String(employee._id));
    if (existing) {
      const plain = toPlain(existing);
      const dated = {
        employeeId: employee._id,
        employeeName: employee.name,
        contractedHours: employee.weeklyHours,
        employeeCategory: employee.employeeCategory || plain.employeeCategory || 'vente',
        days: dates.map((meta) => {
          const found = (plain.days || []).find((day) => hours.plainDay(day).day === meta.day);
          if (!found) return hours.emptyDay(meta.day, meta.date);
          const day = { ...hours.plainDay(found), date: meta.date };
          if (String(day.code || '').toUpperCase() === 'FERIE') {
            return hours.emptyDay(meta.day, meta.date);
          }
          return day;
        })
      };
      return applyCfaAndSunday(dated, dates, settings, cfaMap, {
        overwriteCodes: false,
        trainingDays: employee.trainingDays || [],
        holidayDates: holidayList
      });
    }
    return applyCfaAndSunday(buildEmptyRow(employee, dates, settings, holidayList), dates, settings, cfaMap, {
      trainingDays: employee.trainingDays || [],
      holidayDates: holidayList
    });
  });

  weekDoc.rows = rows;
  weekDoc.sundayOpen = settings.sundayOpen;
  weekDoc.holidayDates = holidayList;
  return weekDoc;
}

function collectAlerts(weekDoc) {
  const items = [];
  (weekDoc.rows || []).forEach((row) => {
    (row.days || []).forEach((day) => {
      (day.alerts || []).forEach((alert) => {
        items.push({
          employeeName: row.employeeName,
          day: day.day,
          date: day.date,
          type: alert.type,
          message: alert.message
        });
      });
    });
  });
  return items;
}

function formatDayLabel(day) {
  if (day.kind === 'code') return day.code || '';
  if (day.kind === 'hours') return hours.formatHours(day.volumeHours);
  if (day.kind === 'shifts') {
    return (day.shifts || [])
      .map((shift) => `${shift.startTime.replace(':', 'h')}–${shift.endTime.replace(':', 'h')}`)
      .join(' / ');
  }
  return '';
}

function buildPlanningEmail({ employeeName, weekNumber, year, dates, week, isUpdate }) {
  const title = isUpdate
    ? `Planning modifié — semaine ${weekNumber}`
    : `Planning semaine ${weekNumber}`;
  const range = dates.length ? `${dates[0].date} → ${dates[dates.length - 1].date}` : '';
  const teamRows = (week.rows || []).map((row) => {
    const cells = hours.DAYS.map((dayName) => {
      const day = (row.days || []).find((item) => item.day === dayName);
      const label = day ? formatDayLabel(day) : '';
      const paid = day && day.paidHours ? `<br/><small>${hours.formatHours(day.paidHours)}</small>` : '';
      const holiday = day?.isHoliday && day.paidHours
        ? '<br/><small>Férié (majoré)</small>'
        : (day?.isHoliday ? '<br/><small>Férié</small>' : '');
      return `<td style="border:1px solid #ddd;padding:6px;text-align:center;font-size:13px;">${label || '—'}${paid}${holiday}</td>`;
    }).join('');
    return `<tr>
      <td style="border:1px solid #ddd;padding:6px;font-weight:600;">${row.employeeName}</td>
      ${cells}
      <td style="border:1px solid #ddd;padding:6px;text-align:center;">${hours.formatHours(row.weeklyPaidHours)} / ${hours.formatHours(row.contractedHours)}</td>
    </tr>`;
  }).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#222;">
      <h2>${title}</h2>
      <p>Bonjour ${employeeName},</p>
      <p>${isUpdate ? 'Le planning de l’équipe a été modifié.' : 'Voici le planning de l’équipe pour la semaine.'}
      Semaine ${weekNumber} (${range}).</p>
      <p>Vous pouvez aussi le consulter sur votre espace Filmara.</p>
      <table style="border-collapse:collapse;width:100%;margin-top:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd;padding:6px;background:#f4f4f4;">Salarié</th>
            ${hours.DAYS.map((dayName, index) => {
              const date = dates[index]?.date;
              const holiday = (week.holidayDates || []).includes(date);
              return `<th style="border:1px solid #ddd;padding:6px;background:${holiday ? '#f3e8ff' : '#f4f4f4'};">${dayName.slice(0, 3)}${holiday ? '<br/><small>Férié</small>' : ''}</th>`;
            }).join('')}
            <th style="border:1px solid #ddd;padding:6px;background:#f4f4f4;">Semaine</th>
          </tr>
        </thead>
        <tbody>${teamRows}</tbody>
      </table>
      <p style="margin-top:16px;font-size:12px;color:#666;">Filmara — planning du personnel</p>
    </div>
  `;
  const text = `${title} — semaine ${weekNumber} (${range})`;
  return { subject: `${title} ${year}`, html, text };
}

const getSettings = async (req, res) => {
  try {
    const doc = await StaffPlanningSettings.getSingleton();
    res.json({ success: true, settings: settingsPlain(doc) });
  } catch (error) {
    console.error('staff-planning settings GET', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les paramètres planning' });
  }
};

const updateSettings = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const doc = await StaffPlanningSettings.getSingleton();
    const body = req.body || {};
    const fields = [
      'sundayOpen', 'breakThresholdHours', 'breakMinutes', 'maxDayHours', 'minRestHours',
      'maxSplitGapHours', 'nightStart', 'nightEnd', 'ot25FromHour', 'ot25ToHour',
      'ot50FromHour', 'defaultCfaCode'
    ];
    fields.forEach((field) => {
      if (body[field] !== undefined) doc[field] = body[field];
    });
    if (Array.isArray(body.words)) {
      doc.words = body.words
        .filter((word) => (
          word && word.code
          && String(word.code).toUpperCase() !== 'FERIE'
          && word.category !== 'ferie'
        ))
        .map((word) => ({
          code: String(word.code).trim().toUpperCase(),
          hours: Number(word.hours) || 0,
          category: word.category || 'autre',
          countsInTotal: !!word.countsInTotal,
          countsAsSick: !!word.countsAsSick || word.category === 'maladie'
        }));
    }
    await doc.save();
    res.json({ success: true, settings: settingsPlain(doc) });
  } catch (error) {
    console.error('staff-planning settings PUT', error);
    res.status(500).json({ success: false, error: 'Impossible d\'enregistrer les paramètres planning' });
  }
};

const getWeek = async (req, res) => {
  try {
    const weekNumber = parseInt(req.params.week, 10);
    const year = parseInt(req.params.year, 10);
    if (!weekNumber || !year) {
      return res.status(400).json({ success: false, error: 'Semaine et année requises' });
    }
    const settingsDoc = await StaffPlanningSettings.getSingleton();
    const settings = settingsPlain(settingsDoc);
    let week = await StaffWeekPlanning.findOne({ weekNumber, year });
    if (!week) {
      week = new StaffWeekPlanning({
        weekNumber,
        year,
        status: 'draft',
        sundayOpen: settings.sundayOpen,
        holidayDates: [],
        rows: []
      });
    }
    await syncWeekRows(week, settings);
    week.markModified('rows');
    week.markModified('holidayDates');
    await week.save();
    res.json({
      success: true,
      settings,
      dates: hours.weekDates(weekNumber, year),
      week,
      alerts: collectAlerts(week)
    });
  } catch (error) {
    console.error('staff-planning week GET', error);
    res.status(500).json({ success: false, error: 'Impossible de charger le planning de la semaine' });
  }
};

const updateCell = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const weekNumber = parseInt(req.params.week, 10);
    const year = parseInt(req.params.year, 10);
    const { employeeId, day, cell, applyToWeek } = req.body || {};
    if (!employeeId || !day) {
      return res.status(400).json({ success: false, error: 'Salarié et jour requis' });
    }
    const settings = settingsPlain(await StaffPlanningSettings.getSingleton());
    const week = await StaffWeekPlanning.findOne({ weekNumber, year });
    if (!week) {
      return res.status(404).json({ success: false, error: 'Planning introuvable' });
    }
    const rowIndex = week.rows.findIndex((item) => String(item.employeeId) === String(employeeId));
    if (rowIndex < 0) {
      return res.status(404).json({ success: false, error: 'Salarié absent de cette semaine' });
    }
    const holidayDates = holidayDatesOf(week);
    const dates = hours.weekDates(weekNumber, year);
    const dayMeta = dates.find((item) => item.day === day);
    if (!dayMeta) {
      return res.status(400).json({ success: false, error: 'Jour invalide' });
    }
    const plain = toPlain(week.rows[rowIndex]);
    const currentDays = dates.map((meta) => {
      const found = (plain.days || []).find((item) => hours.plainDay(item).day === meta.day);
      return found ? { ...hours.plainDay(found), date: meta.date } : hours.emptyDay(meta.day, meta.date);
    });
    const days = currentDays.map((item) => {
      if (applyToWeek || item.day === day) {
        return hours.computeDay(cell || { kind: 'empty' }, { day: item.day, date: item.date }, settings);
      }
      return item;
    });
    const nextRow = summarizeRow({
      ...plain,
      days
    }, settings, holidayDates);
    week.rows = (week.toObject().rows || []).map((item, index) => (
      index === rowIndex ? nextRow : item
    ));
    if (week.status !== 'draft') week.status = 'draft';
    week.markModified('rows');
    await week.save();
    res.json({
      success: true,
      week,
      alerts: collectAlerts(week)
    });
  } catch (error) {
    console.error('staff-planning cell PUT', error);
    res.status(500).json({ success: false, error: 'Impossible d\'enregistrer la cellule' });
  }
};

const validateWeek = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const weekNumber = parseInt(req.params.week, 10);
    const year = parseInt(req.params.year, 10);
    const week = await StaffWeekPlanning.findOne({ weekNumber, year });
    if (!week) return res.status(404).json({ success: false, error: 'Planning introuvable' });
    const alerts = collectAlerts(week);
    week.status = 'validated';
    week.validatedAt = new Date();
    week.validatedBy = req.user?.name || req.user?.email || 'admin';
    week.markModified('rows');
    await week.save();
    res.json({ success: true, week, alerts });
  } catch (error) {
    console.error('staff-planning validate', error);
    res.status(500).json({ success: false, error: 'Impossible de valider le planning' });
  }
};

const sendWeek = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const weekNumber = parseInt(req.params.week, 10);
    const year = parseInt(req.params.year, 10);
    const week = await StaffWeekPlanning.findOne({ weekNumber, year });
    if (!week) return res.status(404).json({ success: false, error: 'Planning introuvable' });
    const alerts = collectAlerts(week);
    const dates = hours.weekDates(weekNumber, year);
    const employees = await Employee.find({
      _id: { $in: week.rows.map((row) => row.employeeId) }
    }).select('name email').lean();
    const byId = new Map(employees.map((employee) => [String(employee._id), employee]));
    const isUpdate = (week.sendCount || 0) > 0;
    const results = [];

    for (const row of week.rows) {
      const employee = byId.get(String(row.employeeId));
      if (!employee?.email) {
        results.push({ employeeName: row.employeeName, ok: false, error: 'Pas d\'email' });
        continue;
      }
      const mail = buildPlanningEmail({
        employeeName: employee.name,
        weekNumber,
        year,
        dates,
        week,
        isUpdate
      });
      const sent = await emailService.sendEmail(employee.email, mail.subject, mail.html, mail.text);
      results.push({
        employeeName: employee.name,
        email: employee.email,
        ok: !!sent?.success,
        error: sent?.success ? null : (sent?.error || 'Envoi impossible')
      });
    }

    const okCount = results.filter((item) => item.ok).length;
    week.status = 'sent';
    week.lastSentAt = new Date();
    week.lastSentBy = req.user?.name || req.user?.email || 'admin';
    week.sendCount = (week.sendCount || 0) + 1;
    week.lastSendSummary = `${okCount}/${results.length} envoyés`;
    week.validatedAt = week.validatedAt || new Date();
    week.markModified('rows');
    await week.save();

    res.json({
      success: true,
      week,
      alerts,
      results,
      sent: okCount,
      total: results.length
    });
  } catch (error) {
    console.error('staff-planning send', error);
    res.status(500).json({ success: false, error: 'Impossible d\'envoyer le planning' });
  }
};

const duplicateWeek = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const weekNumber = parseInt(req.params.week, 10);
    const year = parseInt(req.params.year, 10);
    const source = await StaffWeekPlanning.findOne({ weekNumber, year });
    if (!source) return res.status(404).json({ success: false, error: 'Planning source introuvable' });

    const target = req.body?.targetWeek && req.body?.targetYear
      ? { weekNumber: parseInt(req.body.targetWeek, 10), year: parseInt(req.body.targetYear, 10) }
      : hours.addIsoWeeks(weekNumber, year, 1);

    const settings = settingsPlain(await StaffPlanningSettings.getSingleton());
    const dates = hours.weekDates(target.weekNumber, target.year);
    const cfaMap = await cfaDatesByEmployee(dates);

    let dest = await StaffWeekPlanning.findOne({ weekNumber: target.weekNumber, year: target.year });
    if (!dest) {
      dest = new StaffWeekPlanning({
        weekNumber: target.weekNumber,
        year: target.year,
        status: 'draft',
        sundayOpen: settings.sundayOpen,
        holidayDates: [],
        rows: []
      });
    }

    dest.rows = source.rows.map((row) => {
      const copiedDays = dates.map((meta) => {
        const origin = (row.days || []).find((day) => day.day === meta.day) || hours.emptyDay(meta.day, meta.date);
        const clone = hours.plainDay(origin);
        clone.date = meta.date;
        clone.isHoliday = false;
        clone.holidayHours = 0;
        clone.alerts = [];
        return clone;
      });
      return applyCfaAndSunday({
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        contractedHours: row.contractedHours,
        employeeCategory: row.employeeCategory,
        days: copiedDays
      }, dates, settings, cfaMap, { overwriteCodes: true, holidayDates: [] });
    });
    dest.status = 'draft';
    dest.sundayOpen = settings.sundayOpen;
    dest.holidayDates = [];
    dest.validatedAt = undefined;
    dest.lastSentAt = undefined;
    dest.sendCount = 0;
    dest.lastSendSummary = '';
    await syncWeekRows(dest, settings);
    dest.markModified('rows');
    await dest.save();

    res.json({
      success: true,
      week: dest,
      dates,
      settings,
      alerts: collectAlerts(dest)
    });
  } catch (error) {
    console.error('staff-planning duplicate', error);
    res.status(500).json({ success: false, error: 'Impossible de dupliquer la semaine' });
  }
};

const toggleHoliday = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const weekNumber = parseInt(req.params.week, 10);
    const year = parseInt(req.params.year, 10);
    const { date, holiday } = req.body || {};
    if (!date) {
      return res.status(400).json({ success: false, error: 'Date requise' });
    }
    const settings = settingsPlain(await StaffPlanningSettings.getSingleton());
    const week = await StaffWeekPlanning.findOne({ weekNumber, year });
    if (!week) {
      return res.status(404).json({ success: false, error: 'Planning introuvable' });
    }
    const current = new Set(holidayDatesOf(week));
    if (holiday) current.add(date);
    else current.delete(date);
    week.holidayDates = Array.from(current);
    await syncWeekRows(week, settings);
    if (week.status !== 'draft') week.status = 'draft';
    week.markModified('rows');
    week.markModified('holidayDates');
    await week.save();
    res.json({
      success: true,
      week,
      dates: hours.weekDates(weekNumber, year),
      settings,
      alerts: collectAlerts(week)
    });
  } catch (error) {
    console.error('staff-planning holiday', error);
    res.status(500).json({ success: false, error: 'Impossible de modifier le jour férié' });
  }
};

const getMonthCounters = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!year || !month) {
      return res.status(400).json({ success: false, error: 'Année et mois requis' });
    }
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const weeks = await StaffWeekPlanning.find({
      year: { $in: [year, year - 1, year + 1] }
    }).lean();
    const byEmployee = new Map();
    weeks.forEach((week) => {
      (week.rows || []).forEach((row) => {
        const key = String(row.employeeId);
        if (!byEmployee.has(key)) {
          byEmployee.set(key, {
            employeeId: row.employeeId,
            employeeName: row.employeeName,
            paidHours: 0,
            nightHours: 0,
            sickDays: 0,
            sickHours: 0,
            cpHours: 0,
            absenceHours: 0,
            holidayHours: 0,
            ot25: 0,
            ot50: 0
          });
        }
        const acc = byEmployee.get(key);
        (row.days || []).forEach((day) => {
          if (!day.date || !day.date.startsWith(prefix)) return;
          acc.paidHours += day.paidHours || 0;
          acc.nightHours += day.nightHours || 0;
          acc.sickDays += day.sickDays || 0;
          acc.sickHours += day.sickHours || 0;
          acc.cpHours += day.cpHours || 0;
          acc.absenceHours += day.absenceHours || 0;
          acc.holidayHours += day.holidayHours || 0;
        });
      });
    });
    const settings = settingsPlain(await StaffPlanningSettings.getSingleton());
    const counters = Array.from(byEmployee.values()).map((item) => {
      const overtime = hours.overtimeFromPaid(item.paidHours, settings);
      return {
        ...item,
        paidHours: Math.round(item.paidHours * 100) / 100,
        nightHours: Math.round(item.nightHours * 100) / 100,
        ot25: overtime.ot25,
        ot50: overtime.ot50
      };
    });
    res.json({ success: true, year, month, counters });
  } catch (error) {
    console.error('staff-planning month counters', error);
    res.status(500).json({ success: false, error: 'Impossible de calculer les compteurs du mois' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getWeek,
  updateCell,
  validateWeek,
  sendWeek,
  duplicateWeek,
  toggleHoliday,
  getMonthCounters
};
