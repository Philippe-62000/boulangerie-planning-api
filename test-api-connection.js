const axios = require('axios');

async function testAPI() {
  console.log('🔍 Test de connexion à l\'API...');
  
  try {
    // Test 1: Health check
    console.log('\n1. Test health check...');
    const healthResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/health', {
      timeout: 10000
    });
    console.log('✅ Health check OK:', healthResponse.data);
    
    // Test 2: Employees endpoint
    console.log('\n2. Test endpoint employees...');
    const employeesResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/api/employees', {
      timeout: 10000
    });
    console.log('✅ Employees OK:', employeesResponse.data.length, 'employés trouvés');
    
    // Test 3: Planning generation
    console.log('\n3. Test génération planning...');
    const planningResponse = await axios.post('https://boulangerie-planning-api-3.onrender.com/api/planning/generate', {
      weekNumber: 35,
      year: 2025
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Planning généré OK:', planningResponse.data);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();



