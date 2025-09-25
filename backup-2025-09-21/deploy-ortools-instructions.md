# 🚀 Déploiement API OR-Tools sur Render

## 📋 **Étapes à suivre**

### 1. **Créer un nouveau repository GitHub**
1. Allez sur https://github.com
2. Cliquez sur "New repository"
3. Nom : `boulangerie-ortools-api`
4. Description : `API Google OR-Tools pour optimisation planning boulangerie`
5. ✅ Public
6. ✅ Add README
7. Cliquez "Create repository"

### 2. **Préparer les fichiers localement**
Créez un nouveau dossier et copiez ces fichiers :

#### **📄 ortools-api.py** (fichier principal)
```python
# Le contenu est déjà créé dans le projet principal
```

#### **📄 requirements.txt**
```
Flask==2.3.3
Flask-CORS==4.0.0
ortools==9.7.2996
gunicorn==21.2.0
```

#### **📄 render.yaml**
```yaml
services:
  - type: web
    name: planning-ortools-api
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn --bind 0.0.0.0:$PORT ortools-api:app
    envVars:
      - key: FLASK_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /
    autoDeploy: true
```

#### **📄 README.md**
```markdown
# 🎯 Boulangerie OR-Tools API

API d'optimisation de planning utilisant Google OR-Tools pour la boulangerie.

## 🚀 Endpoints

- `GET /` - Health check
- `POST /solve` - Résolution de planning optimisé

## 🔧 Contraintes implémentées

- Volume horaire précis (±0.5h)
- Contraintes d'ouverture/fermeture
- Règles spéciales mineurs
- Repos obligatoires
- Multi-critères

## 📊 Performance

- Résolution en 2-5 secondes
- Optimisation multi-objectifs
- Contraintes strictes
```

### 3. **Uploader sur GitHub**
```bash
cd boulangerie-ortools-api
git init
git add .
git commit -m "🎯 Initial commit - OR-Tools API v1.0"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/boulangerie-ortools-api.git
git push -u origin main
```

### 4. **Déployer sur Render**

#### **A. Créer le service**
1. Allez sur https://render.com
2. Connectez-vous à votre compte
3. Cliquez "New +"
4. Sélectionnez "Web Service"

#### **B. Connecter le repository**
1. Sélectionnez "Connect a repository"
2. Choisissez `boulangerie-ortools-api`
3. Cliquez "Connect"

#### **C. Configuration du service**
- **Name** : `planning-ortools-api`
- **Environment** : `Python 3`
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `gunicorn --bind 0.0.0.0:$PORT ortools-api:app`
- **Plan** : `Free`

#### **D. Variables d'environnement**
- `FLASK_ENV` = `production`
- `PORT` = `10000`

#### **E. Déployer**
1. Cliquez "Create Web Service"
2. Attendez le déploiement (5-10 minutes)
3. L'URL sera : `https://planning-ortools-api.onrender.com`

### 5. **Tester l'API déployée**

#### **Test de santé**
```bash
curl https://planning-ortools-api.onrender.com/
```

Réponse attendue :
```json
{
  "status": "online",
  "service": "Planning Boulangerie OR-Tools API",
  "version": "5.0",
  "timestamp": "2024-12-19T...",
  "endpoints": {
    "status": "GET /",
    "solve": "POST /solve"
  }
}
```

#### **Test de résolution**
```bash
curl -X POST https://planning-ortools-api.onrender.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "employees": [
      {
        "id": "1",
        "name": "Test",
        "volume": 35,
        "status": "Majeur",
        "contract": "CDI",
        "skills": ["Ouverture"],
        "function": "Vendeuse"
      }
    ],
    "constraints": {},
    "affluences": [2, 2, 2, 3, 3, 4, 2],
    "week_number": 36
  }'
```

### 6. **Configurer l'API principale**

Une fois l'API OR-Tools déployée, ajoutez cette variable d'environnement dans votre API principale sur Render :

- **Variable** : `ORTOOLS_API_URL`
- **Valeur** : `https://planning-ortools-api.onrender.com/solve`

## ✅ **Vérification finale**

1. ✅ API OR-Tools déployée et accessible
2. ✅ Test de santé réussi
3. ✅ Test de résolution réussi
4. ✅ Variable d'environnement configurée
5. ✅ API principale peut appeler OR-Tools

## 🔧 **Dépannage**

### **Erreur de build**
- Vérifiez `requirements.txt`
- OR-Tools peut prendre du temps à installer

### **Erreur de démarrage**
- Vérifiez le `Start Command`
- Logs disponibles dans Render Dashboard

### **Timeout**
- OR-Tools peut être lent au premier démarrage
- Render met en veille après inactivité

## 📊 **URLs finales**

- **API OR-Tools** : https://planning-ortools-api.onrender.com
- **API Principale** : https://boulangerie-planning-api-3.onrender.com
- **Frontend** : https://www.filmara.fr/plan/
