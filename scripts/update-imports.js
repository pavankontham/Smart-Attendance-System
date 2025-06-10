#!/usr/bin/env node

/**
 * Script to update import paths after reorganizing the codebase
 * This script updates all imports from '../components/', '../contexts/', '../lib/' 
 * to use the new 'src/' directory structure
 */

const fs = require('fs');
const path = require('path');

// Directories to search for files
const searchDirs = ['pages'];

// File extensions to process
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Import path mappings
const importMappings = {
  '../components/': '../src/components/',
  '../contexts/': '../src/contexts/',
  '../lib/': '../src/lib/',
  './components/': './src/components/',
  './contexts/': './src/contexts/',
  './lib/': './src/lib/'
};

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (fileExtensions.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update import statements
    Object.entries(importMappings).forEach(([oldPath, newPath]) => {
      const importRegex = new RegExp(`from\\s+['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      const requireRegex = new RegExp(`require\\s*\\(\\s*['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      
      if (importRegex.test(content) || requireRegex.test(content)) {
        content = content.replace(importRegex, `from '${newPath}`);
        content = content.replace(requireRegex, `require('${newPath}`);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Updating import paths to use src/ directory structure...\n');
  
  let totalFiles = 0;
  let updatedFiles = 0;

  searchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);
      
      files.forEach(file => {
        totalFiles++;
        if (updateImportsInFile(file)) {
          updatedFiles++;
        }
      });
    } else {
      console.log(`⚠️  Directory not found: ${dir}`);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files updated: ${updatedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - updatedFiles}`);
  
  if (updatedFiles > 0) {
    console.log('\n✅ Import paths updated successfully!');
    console.log('🔧 Please test your application to ensure everything works correctly.');
  } else {
    console.log('\n✅ No import paths needed updating.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateImportsInFile, getAllFiles };
