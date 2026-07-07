const spec = require('./render-openapi.json');
const keyword = process.argv[2] || 'workspace';
const matches = [];
for (const path of Object.keys(spec.paths)) {
  if (path.includes(keyword)) matches.push({type:'path', path});
}
for (const [name,schema] of Object.entries(spec.components.schemas||{})) {
  if (name.toLowerCase().includes(keyword)) matches.push({type:'schema', name});
}
for (const [name, schema] of Object.entries(spec.components.parameters||{})) {
  if (name.toLowerCase().includes(keyword)) matches.push({type:'parameter', name});
}
console.log(JSON.stringify(matches,null,2));
