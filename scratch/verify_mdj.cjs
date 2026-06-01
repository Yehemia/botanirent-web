const fs = require('fs');
const j = JSON.parse(fs.readFileSync('botanirent_class_diagram.mdj', 'utf8'));
const m = j.ownedElements[0];

console.log('Project _id:', j._id);
console.log('Model _parent ref:', m._parent && m._parent['$ref']);

const d = m.ownedElements.find(e => e._type === 'UMLClassDiagram');
console.log('Diagram _parent ref:', d._parent && d._parent['$ref']);

const cls = m.ownedElements.filter(e => e._type === 'UMLClass');
console.log('\nTotal UMLClass elements:', cls.length);
cls.forEach(c => {
  const parentRef = c._parent && c._parent['$ref'];
  console.log(`  ${c.name} <<${c.stereotype}>> _parent:${parentRef} attrs:${c.attributes.length} ops:${c.operations.length}`);
});

const cvs = d.ownedViews.filter(v => v._type === 'UMLClassView');
console.log('\nClassViews in diagram:', cvs.length);
const allHaveParent = cvs.every(v => v._parent);
console.log('All ClassViews have _parent:', allHaveParent);

const allHaveModel = cvs.every(v => v.model);
console.log('All ClassViews have model ref:', allHaveModel);

// Check subViews
const allHaveSubViews = cvs.every(v => v.subViews && v.subViews.length === 3);
console.log('All ClassViews have 3 subViews:', allHaveSubViews);
