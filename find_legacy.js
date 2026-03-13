const fs = require('fs');
const glob = require('glob');

const filesToSearch = [
  'frontend/components/ui-system/**/*.tsx',
  'frontend/components/ui-system/**/*.ts',
  'frontend/app/(public)/layout.tsx',
  'frontend/app/(public)/page.tsx',
  'frontend/app/(public)/store/page.tsx',
  'frontend/app/(public)/store/products/[id]/page.tsx',
  'frontend/app/(public)/book/[serviceId]/page.tsx',
  'frontend/app/dashboard/admin/page.tsx',
  'frontend/app/dashboard/analytics/page.tsx',
  'frontend/app/dashboard/front-desk/pos/page.tsx',
  'frontend/app/dashboard/provider/appointments/[id]/page.tsx',
  'frontend/app/dashboard/provider/visits/[id]/scribe/page.tsx',
  'frontend/app/dashboard/patient/appointments/[id]/page.tsx',
  'frontend/app/(auth)/layout.tsx',
  'frontend/app/(auth)/login/page.tsx',
  'frontend/app/(auth)/register/page.tsx',
  'frontend/components/dashboard/**/*.tsx',
  'frontend/components/dashboard/**/*.ts'
];

let allFiles = [];
filesToSearch.forEach(pattern => {
  if (pattern.includes('*')) {
    allFiles.push(...glob.sync(pattern));
  } else {
    if (fs.existsSync(pattern)) allFiles.push(pattern);
  }
});

// also look for .orig files
const origFiles = glob.sync('frontend/**/*.orig');

const results = [];
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.match(/import\s+{[^}]*(Button|Input)[^}]*}\s+from\s+['"]@\/components\/ui\/(button|input)['"]/)) {
    results.push(file);
  }
});

console.log("Files to update:", results);
console.log("Orig files to delete:", origFiles);
