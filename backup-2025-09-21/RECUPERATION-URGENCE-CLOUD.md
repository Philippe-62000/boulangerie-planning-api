# ☁️ Récupération via Sauvegarde Cloud

## 🎯 **Sauvegarde Préventive dans le Cloud**

### **📋 ÉTAPES POUR CRÉER UNE SAUVEGARDE CLOUD**

#### **1. 📧 Sauvegarde par Email**
```bash
# Créer un ZIP du projet
sauvegarde-projet.bat

# Envoyer par email à soi-même
Sujet: [URGENCE] Sauvegarde Projet Boulangerie
Pièce jointe: backup-2024-12-30.zip
Corps: 
- GitHub: https://github.com/Philippe-62000/boulangerie-planning-api.git
- Render: https://boulangerie-planning-api-4-pbfy.onrender.com
- OVH: https://www.filmara.fr/plan/
- Variables d'environnement importantes
```

#### **2. ☁️ Sauvegarde Google Drive/OneDrive**
```bash
# Upload automatique
1. Installer Google Drive Desktop
2. Copier backup-2024-12-30/ dans Google Drive
3. Synchronisation automatique
```

#### **3. 📱 Sauvegarde sur Mobile**
```bash
# Informations critiques dans Notes/Mémo
=== PROJET BOULANGERIE ===
GitHub: https://github.com/Philippe-62000/boulangerie-planning-api.git
Render: https://boulangerie-planning-api-4-pbfy.onrender.com
OVH: https://www.filmara.fr/plan/
MongoDB: [URI_DE_CONNEXION]
EmailJS: [CLÉS_API]
```

---

## 📥 **RÉCUPÉRATION DEPUIS LE CLOUD**

### **Depuis Email**
```bash
1. 📧 Rechercher "Sauvegarde Projet Boulangerie"
2. 📥 Télécharger backup-2024-12-30.zip
3. 📁 Extraire dans C:\nouveau-projet\
4. 🔧 npm install (backend et frontend)
5. ⚙️ Configurer les variables d'environnement
```

### **Depuis Google Drive**
```bash
1. 🌐 drive.google.com
2. 📁 Dossier "Sauvegarde Boulangerie"
3. 📥 Télécharger le dossier complet
4. 📁 Extraire localement
5. 🚀 Lancer l'application
```

### **Depuis Mobile**
```bash
1. 📱 Ouvrir Notes/Mémo
2. 📋 Copier les URLs importantes
3. 💻 Sur nouvel ordinateur :
   - Aller sur GitHub
   - Cloner le repository
   - Configurer avec les infos du mobile
```

---

## 🔄 **SCRIPT DE SAUVEGARDE CLOUD AUTOMATIQUE**

```bash
@echo off
echo ========================================
echo   SAUVEGARDE CLOUD AUTOMATIQUE
echo ========================================

REM Créer la sauvegarde locale
call sauvegarde-projet.bat

REM Copier vers Google Drive (si installé)
if exist "%USERPROFILE%\Google Drive" (
    echo 📁 Copie vers Google Drive...
    xcopy backup-2024-12-30 "%USERPROFILE%\Google Drive\Sauvegarde-Boulangerie\" /E /I /Y
)

REM Copier vers OneDrive (si installé)
if exist "%USERPROFILE%\OneDrive" (
    echo 📁 Copie vers OneDrive...
    xcopy backup-2024-12-30 "%USERPROFILE%\OneDrive\Sauvegarde-Boulangerie\" /E /I /Y
)

echo ✅ Sauvegarde cloud terminée !
echo.
echo 📋 Sauvegardé dans :
if exist "%USERPROFILE%\Google Drive" echo - Google Drive
if exist "%USERPROFILE%\OneDrive" echo - OneDrive
echo - Dossier local : backup-2024-12-30
echo.
pause
```

---

## 📱 **RÉCUPÉRATION D'URGENCE MOBILE**

### **Applications Utiles**
- 📱 **GitHub Mobile** : Voir le code
- 🌐 **Render Dashboard** : Gérer le backend
- 📧 **Gmail/Outlook** : Accéder aux sauvegardes
- 💾 **Google Drive** : Télécharger les fichiers

### **Depuis Mobile vers PC**
```bash
1. 📱 Mobile → Voir les infos dans Notes
2. 💻 PC → Aller sur github.com
3. 📥 Cloner : git clone [URL_DEPUIS_MOBILE]
4. ⚙️ Configurer avec les infos du mobile
5. 🚀 Lancer l'application
```

---

## 🎯 **CHECKLIST DE RÉCUPÉRATION**

### **✅ Informations à Avoir**
- [ ] URL GitHub du projet
- [ ] URL Render du backend
- [ ] URL OVH du frontend
- [ ] URI MongoDB
- [ ] Clés EmailJS
- [ ] Variables d'environnement
- [ ] Mots de passe admin

### **✅ Actions de Récupération**
- [ ] Nouveau PC configuré (Git, Node.js)
- [ ] Projet cloné depuis GitHub
- [ ] Dépendances installées
- [ ] Variables d'environnement configurées
- [ ] Base de données connectée
- [ ] Application testée
- [ ] Déploiement vérifié

---

## 🚨 **EN CAS D'URGENCE ABSOLUE**

### **📞 Contacts d'Urgence**
```
GitHub Support: https://support.github.com
Render Support: https://render.com/support
OVH Support: https://www.ovh.com/fr/support/
```

### **🔧 Récupération Minimale**
```bash
# Juste pour faire fonctionner rapidement
1. git clone https://github.com/Philippe-62000/boulangerie-planning-api.git
2. cd boulangerie-planning-api
3. npm install (backend et frontend)
4. Configurer .env minimal
5. Tester avec l'API Render existante
```


