const spec = require('./render-openapi.json');
const paths = ['/owners','/services'];
for (const path of paths) {
  const op = spec.paths[path];
  if (!op) {
    console.error('missing', path);
    continue;
  }
  console.log('PATH', path);
  for (const [method, details] of Object.entries(op)) {
    console.log('METHOD', method.toUpperCase());
    if (details.summary) console.log(' summary:', details.summary);
    if (details.description) console.log(' desc:', details.description.split('\n')[0]);
    if (details.parameters) console.log(' params:', details.parameters.map(p=>p.name||p['$ref']).join(', '));
    if (details.requestBody) console.log(' requestBody types:', Object.keys(details.requestBody.content||{}));
    if (details.responses) console.log(' responses:', Object.keys(details.responses).join(', '));
    if (details.requestBody && details.requestBody.content['application/json']) {
      console.log(' schema ref:', details.requestBody.content['application/json'].schema['$ref'] || details.requestBody.content['application/json'].schema.type);
    }
  }
}
