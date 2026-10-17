const assert = require('assert');
const { findEmployeeByPersonName, personNameTokenKey } = require('./personName');

const employees = [
  { _id: '1', name: 'MOHAMMAD Maryam', email: 'maryamakhtarahmad@gmail.com' },
  { _id: '2', name: 'Maeva HENON', email: 'maeva@example.com' },
  { _id: '3', name: 'Maeva REGISTRE-ISIDORE', email: 'registre@example.com' }
];

assert.strictEqual(personNameTokenKey('Maryam MOHAMMAD'), personNameTokenKey('MOHAMMAD Maryam'));
assert.strictEqual(findEmployeeByPersonName(employees, 'Maryam MOHAMMAD')?._id, '1');
assert.strictEqual(findEmployeeByPersonName(employees, 'MOHAMMAD Maryam')?._id, '1');
assert.strictEqual(findEmployeeByPersonName(employees, 'Maeva REGISTRE-ISIDORE')?._id, '3');
assert.notStrictEqual(findEmployeeByPersonName(employees, 'Maeva HENON')?._id, '3');
console.log('personName.test.js ok');
