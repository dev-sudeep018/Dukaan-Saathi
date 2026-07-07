const spec = require('./render-openapi.json');
const names = ['servicePOST','serviceRuntime','envSpecificDetailsPOST','webServiceDetailsPOST'];
for(const n of names){
  console.log('===', n, '===');
  console.log(JSON.stringify(spec.components.schemas[n], null, 2));
}
