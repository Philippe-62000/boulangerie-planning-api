// Test des paramètres avec un ID valide
const testParametersValidId = async () => {
  try {
    console.log('🔍 Test des paramètres avec ID valide...');
    
    const testData = {
      parameters: [
        {
          _id: "68b9f056ee5683a58ffde096", // param1
          displayName: "Test Paramètre 1",
          kmValue: 5
        }
      ]
    };
    
    console.log('📤 Données:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('https://boulangerie-planning-api-3.onrender.com/api/parameters/batch', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.filmara.fr'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Status:', response.status);
    
    const data = await response.text();
    console.log('📊 Response:', data);
    
    if (response.status === 200) {
      console.log('✅ Test réussi !');
    } else {
      console.log('❌ Test échoué');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testParametersValidId();
