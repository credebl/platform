import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively walk through directories and generate index.ts in each
 */
function generateIndexFiles(dir: string) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  const files: string[] = [];
  const subdirs: string[] = [];

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      subdirs.push(fullPath);
      generateIndexFiles(fullPath); // Recurse
    } else if (
      item.isFile() &&
      item.name.endsWith('.ts') &&
      item.name !== 'index.ts' &&
      !item.name.endsWith('.d.ts')
    ) {
      files.push(item.name);
    }
  }

  if (files.length > 0) {
    const exportLines = files.map((file) => {
      const nameWithoutExt = path.basename(file, '.ts');
      return `export * from './${nameWithoutExt}';`;
    });

    const indexPath = path.join(dir, 'index.ts');
    fs.writeFileSync(indexPath, exportLines.join('\n') + '\n');
    console.log(`Generated index.ts in ${dir}`);
  }
}

// Start from the current working directory
generateIndexFiles(process.cwd());
