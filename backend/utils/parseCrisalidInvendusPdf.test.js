const assert = require('assert');
const {
  parseCrisalidInvendusText,
  isIgnoredBeverageName
} = require('./parseCrisalidInvendusPdf');

const pageBreak50cl = `
OffertsInvendus%( 155 ) BOISSONS 50CLVentes
% Inv +
Offert
FUZE TEA PECHE 40CL 821.24 € 0 00.00 €0.00 €0.00%0.00%
Edité le 20/08/2026 - ©2006-2018 - CRISALID - Tous droits réservés
Page 5 / 10

OffertsInvendus%( 155 ) BOISSONS 50CLVentes
% Inv +
Offert
COCA COLA CHERRY 50CL1129.09 € 0 00.00 €0.00 €0.00%0.00%
COCA COLA 50CL1231.69 € 0 00.00 €0.00 €0.00%0.00%
COCA COLA ZERO 50CL1745.86 € 0 00.00 €0.00 €0.00%0.00%
ORANGINA 50CL 512.06 € 0 00.00 €0.00 €0.00%0.00%
SPRITE 50CL 410.76 € 0 00.00 €0.00 €0.00%0.00%
OASIS TROPICAL 50CL1231.76 € 0 00.00 €0.00 €0.00%0.00%
FUZE TEA PECHE 50CL 821.90 € 0 00.00 €0.00 €0.00%0.00%
77
 0
204.36 €
0.00 €
 00.00 €
TOTAL
0.00%0.00%
OffertsInvendus%( 157 ) BOISSONS PREMIUMVentes
% Inv +
Offert
KOOKABARRA ORANGE 25CL 514.44 € 0 00.00 €0.00 €0.00%0.00%
KOOKABARRA POMME 25CL1314.44 € 0 00.00 €0.00 €0.00%0.00%
RED BULL ENERGY DRINK 25CL 614.44 € 0 00.00 €0.00 €0.00%0.00%
TOTAL
`;

const { categories } = parseCrisalidInvendusText(pageBreak50cl);
const fifty = categories.find((c) => c.name === 'Boissons 50cl');
assert.ok(fifty, 'famille 50cl absente');
const names = fifty.products.map((p) => p.name);
assert.ok(names.includes('COCA COLA 50CL'), names.join(', '));
assert.ok(names.includes('COCA COLA ZERO 50CL'));
assert.ok(names.includes('SPRITE 50CL'));
assert.ok(names.includes('OASIS TROPICAL 50CL'));
assert.ok(names.includes('FUZE TEA PECHE 40CL'));
assert.ok(names.includes('FUZE TEA PECHE 50CL'));
assert.equal(fifty.products.find((p) => p.name === 'COCA COLA 50CL').ventesQty, 12);

const premium = categories.find((c) => c.name === 'Boissons Premium');
assert.ok(premium);
assert.ok(!premium.products.some((p) => /kookabarra/i.test(p.name)));
assert.ok(premium.products.some((p) => /RED BULL/i.test(p.name)));
assert.ok(isIgnoredBeverageName('KOOKABARRA MANGUE 25CL'));

console.log('ok', names.join(' | '));
