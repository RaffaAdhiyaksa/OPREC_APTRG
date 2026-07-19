const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.html') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

let totalRemoved = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match dark:[a-zA-Z0-9\-\/\[\]#\.]+
  const regex = /dark:[a-zA-Z0-9\-\/\[\]#\.]+/g;
  
  if (regex.test(content)) {
    const matches = content.match(regex);
    totalRemoved += matches.length;
    // Replace with empty string and clean up double spaces that might be left
    let newContent = content.replace(regex, '');
    newContent = newContent.replace(/  +/g, ' '); // Clean up double spaces
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Cleaned ${matches.length} dark classes in ${path.basename(file)}`);
  }
});

console.log(`Total dark mode classes removed: ${totalRemoved}`);
