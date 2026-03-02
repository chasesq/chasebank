import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Pattern to find createServiceClient() without await
const pattern = /const\s+supabase\s*=\s*createServiceClient\(\)/g;
const patternWithAwait = /const\s+supabase\s*=\s*await\s+createServiceClient\(\)/g;

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
    
    // Fix: const supabase = createServiceClient() -> const supabase = await createServiceClient()
    content = content.replace(
      /const\s+supabase\s*=\s*createServiceClient\(\)/g,
      'const supabase = await createServiceClient()'
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
