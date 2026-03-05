import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git
      if (!['node_modules', '.next', '.git', '.vercel'].includes(file)) {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filePath);
    }
  });
}

let fixedCount = 0;
let filesProcessed = 0;

walkDir(projectRoot, (filePath) => {
  filesProcessed++;
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Pattern 1: const supabase = createServiceClient()
    content = content.replace(
      /(\s+)(const|let|var)\s+(\w+)\s*=\s*createServiceClient\(\)/g,
      '$1$2 $3 = await createServiceClient()'
    );

    // Pattern 2: Fix double await (in case it's already partially fixed)
    content = content.replace(
      /await\s+await\s+createServiceClient\(\)/g,
      'await createServiceClient()'
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      console.log(`✓ Fixed: ${path.relative(projectRoot, filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
});

console.log(`\n✨ Complete! Fixed ${fixedCount} files out of ${filesProcessed} TypeScript files processed.`);
