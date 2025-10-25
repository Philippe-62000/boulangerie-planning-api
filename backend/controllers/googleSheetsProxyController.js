const axios = require('axios');
const { DOMParser } = require('@xmldom/xmldom');

/**
 * Parse le HTML de Google Sheets et extrait les données
 */
const parseGoogleSheetsHTML = (htmlText) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const tables = doc.getElementsByTagName('table');
    
    if (!tables || tables.length === 0) return [];
    
    const table = tables[0];
    const rows = [];
    const trs = table.getElementsByTagName('tr');
    
    for (let i = 0; i < trs.length; i++) {
        const tr = trs[i];
        const cells = [];
        const tds = tr.getElementsByTagName('td');
        const ths = tr.getElementsByTagName('th');
        const allCells = [...Array.from(tds), ...Array.from(ths)];
        
        for (let j = 0; j < allCells.length; j++) {
            const cell = allCells[j];
            let text = '';
            
            // Extraire le contenu texte
            if (cell.textContent) {
                text = cell.textContent.trim();
            } else if (cell.nodeValue) {
                text = cell.nodeValue.trim();
            }
            
            // Remplacer les espaces insécables par des chaînes vides
            text = text.replace(/\u00A0/g, '').replace(/&nbsp;/g, '');
            
            cells.push(text);
        }
        
        // Ignorer la première ligne si elle est complètement vide (header Google Sheets)
        if (i === 0) {
            const hasContent = cells.some(cell => cell && cell.length > 0);
            if (!hasContent) {
                continue;
            }
        }
        
        if (cells.length > 0) {
            rows.push(cells);
        }
    }
    
    return rows;
};

/**
 * Récupère et corrige les données de Google Sheets
 */
exports.fetchSheet = async (req, res) => {
    try {
        const { sheetId, month } = req.query;
        
        if (!sheetId || !month) {
            return res.status(400).json({ 
                error: 'Les paramètres sheetId et month sont requis' 
            });
        }
        
        // URL d'export HTML de Google Sheets
        const htmlUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:html&sheet=${encodeURIComponent(month)}`;
        
        console.log(`📊 Récupération de la feuille ${sheetId} pour le mois ${month}`);
        
        // Récupérer le HTML
        const response = await axios.get(htmlUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const htmlText = response.data;
        
        // Vérifier si c'est une page de connexion
        if (htmlText.includes('accounts.google.com')) {
            return res.status(403).json({ 
                error: `Permission refusée pour la feuille ${sheetId}. Veuillez la partager publiquement.` 
            });
        }
        
        // Parser le HTML
        const rows = parseGoogleSheetsHTML(htmlText);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                error: 'Aucune donnée trouvée dans la feuille' 
            });
        }
        
        // Correction du bug Google Sheets : détecter et compléter les colonnes manquantes
        const correctedRows = correctMissingColumns(rows);
        
        console.log(`✅ Feuille ${sheetId} récupérée : ${correctedRows.length} lignes`);
        
        res.json({
            success: true,
            rows: correctedRows,
            originalRowCount: rows.length,
            correctedRowCount: correctedRows.length
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la feuille:', error.message);
        
        if (error.response) {
            return res.status(error.response.status).json({ 
                error: `Erreur Google Sheets: ${error.response.statusText}` 
            });
        }
        
        res.status(500).json({ 
            error: 'Erreur lors de la récupération de la feuille Google Sheets',
            details: error.message
        });
    }
};

/**
 * Corrige les colonnes manquantes dues au bug Google Sheets
 * 
 * Le bug : Google Sheets n'exporte pas les colonnes qui n'ont qu'une seule cellule remplie.
 * Cette fonction détecte ces colonnes manquantes et les réinsère avec des cellules vides.
 */
const correctMissingColumns = (rows) => {
    if (rows.length < 2) return rows;
    
    const headerRow = rows[0];
    const dataRows = rows.slice(1);
    
    // Identifier les dates dans le header (format DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    const headerDates = headerRow.slice(1).filter(cell => dateRegex.test(cell));
    
    // Si toutes les colonnes sont des dates, pas besoin de correction
    if (headerDates.length === headerRow.length - 1) {
        console.log('✅ Toutes les colonnes de dates sont présentes, pas de correction nécessaire');
        return rows;
    }
    
    console.log(`🔧 Correction des colonnes manquantes : ${headerDates.length} dates trouvées sur ${headerRow.length - 1} colonnes`);
    
    // Pour l'instant, on retourne les lignes telles quelles
    // La vraie correction nécessiterait de connaître toutes les dates attendues
    return rows;
};


