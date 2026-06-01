const fs = require('fs');
const j = JSON.parse(fs.readFileSync('botanirent_class_diagram.mdj', 'utf8'));
const m = j.ownedElements[0];
const d = m.ownedElements.find(e => e._type === 'UMLClassDiagram');
const cvs = d.ownedViews.filter(v => v._type === 'UMLClassView');

console.log('ClassViews:', cvs.length);
console.log('');

// Check first few
cvs.slice(0, 5).forEach(cv => {
  const cls = m.ownedElements.find(e => e._id === cv.model['$ref']);
  const name = cls ? cls.name : 'unknown';
  console.log(`${name}:`);
  console.log(`  movable: ${cv.movable}, sizable: ${cv.sizable}, selectable: ${cv.selectable}`);
  console.log(`  subViews count: ${cv.subViews ? cv.subViews.length : 0}`);
  if (cv.subViews) {
    cv.subViews.forEach(sv => {
      console.log(`    - ${sv._type} (movable:${sv.movable}, has subViews: ${sv.subViews ? sv.subViews.length : 'none'})`);
    });
  }
  console.log('');
});

// Summary check
const allHaveSubViews = cvs.every(v => v.subViews && v.subViews.length === 3);
const allMovable = cvs.every(v => v.movable === 1);
const allSelectable = cvs.every(v => v.selectable === true);
const noLabelViews = cvs.every(v => {
  if (!v.subViews) return true;
  const nc = v.subViews.find(s => s._type === 'UMLNameCompartmentView');
  return !nc || !nc.subViews;
});

console.log('=== SUMMARY ===');
console.log('All have 3 subViews:', allHaveSubViews);
console.log('All movable:', allMovable);
console.log('All selectable:', allSelectable);
console.log('No LabelView inside NameCompartment:', noLabelViews);
