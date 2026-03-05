import os
import re

# Find and fix all files that still have await createServiceClient()
pattern = re.compile(r'(\s+)const\s+supabase\s*=\s*await\s+createServiceClient\(\)', re.MULTILINE)
replacement = r'\1const supabase = createServiceClient()'

fixed_count = 0
directory = '/vercel/share/v0-project'

for root, dirs, files in os.walk(directory):
    # Skip node_modules, .next, .git, etc
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', '.vercel', 'dist', 'build']]
    
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r') as f:
                    content = f.read()
                
                new_content = pattern.sub(replacement, content)
                
                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    fixed_count += 1
                    print(f'✓ Fixed: {os.path.relpath(filepath, directory)}')
            except Exception as e:
                print(f'✗ Error processing {filepath}: {e}')

print(f'\n✨ Complete! Fixed {fixed_count} files.')
