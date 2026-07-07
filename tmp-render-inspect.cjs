const spec = require('./render-openapi.json');
const op = spec.paths['/services'].post;
console.log(JSON.stringify({
  keys: Object.keys(op),
  requestBody: op.requestBody ? Object.keys(op.requestBody.content || {}) : null,
  schema: op.requestBody && op.requestBody.content && op.requestBody.content['application/json'] ? op.requestBody.content['application/json'].schema : null
}, null, 2));
