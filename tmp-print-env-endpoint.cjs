const spec = require('./render-openapi.json');
console.log(JSON.stringify(spec.paths['/services/{serviceId}/env-vars'], null, 2));
