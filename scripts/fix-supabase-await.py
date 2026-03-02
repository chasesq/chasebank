#!/usr/bin/env python3
import os
import re
import sys

project_root = "/vercel/share/v0-project"
fixed_count = 0
files_processed = 0

def fix_file(filepath):
    global fixed_count, files_processed
    files_processed += 1
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Fix: const/let/var X = createServiceClient() -> const/let/var X = await createServiceClient()
        content = re.sub(
            r'(\s+)(const|let|var)\s+(\w+)\s*=\s*createServiceClient\(\)',
            r'\1\2 \3 = await createServiceClient()',
            content
        )
        
        # Fix double await (in case already partially fixed)
        content = re.sub(
            r'await\s+await\s+createServiceClient\(\)',
            'await createServiceClient()',
            content
        )
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed_count += 1
            rel_path = os.path.relpath(filepath, project_root)
            print(f"✓ Fixed: {rel_path}")
            return True
    except Exception as e:
        print(f"✗ Error: {filepath}: {e}")
    
    return False

def walk_directory(directory):
    for root, dirs, files in os.walk(directory):
        # Skip common directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', '.vercel']]
        
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                fix_file(filepath)

# Start from app directory
walk_directory(os.path.join(project_root, 'app'))
walk_directory(os.path.join(project_root, 'lib'))

print(f"\n✨ Complete! Fixed {fixed_count} files out of {files_processed} TypeScript files processed.")
