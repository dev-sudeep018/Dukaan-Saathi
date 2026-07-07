const spec = require('./render-openapi.json');
const schema = spec.components.schemas.servicePOST;
console.log(JSON.stringify(schema, null, 2));
