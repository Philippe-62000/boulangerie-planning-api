// Test direct des paramètres
const testData = {
  parameters: [
    {
      _id: "68b9f056ee5683a58ffde096",
      displayName: "Paramètre 1",
      kmValue: 0
    },
    {
      _id: "68b9f056ee5683a58ffde097", 
      displayName: "Paramètre 2",
      kmValue: 0
    }
  ]
};

console.log('📤 Données de test:', JSON.stringify(testData, null, 2));

// Simuler l'envoi
fetch('https://boulangerie-planning-api-3.onrender.com/api/parameters/batch', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://www.filmara.fr'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📊 Status:', response.status);
  console.log('📊 Headers:', response.headers);
  return response.text();
})
.then(data => {
  console.log('📊 Response:', data);
})
.catch(error => {
  console.error('❌ Erreur:', error);
});
