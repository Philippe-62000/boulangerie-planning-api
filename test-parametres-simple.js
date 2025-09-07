// Test simple des paramètres
const testData = {
  parameters: [
    {
      _id: "68b9f056ee5683a58ffde096",
      displayName: "Test Paramètre 1",
      kmValue: 5
    }
  ]
};

console.log('📤 Test simple avec données valides');
console.log('📤 Données:', JSON.stringify(testData, null, 2));

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
  return response.text();
})
.then(data => {
  console.log('📊 Response:', data);
})
.catch(error => {
  console.error('❌ Erreur:', error);
});
