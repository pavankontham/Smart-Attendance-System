# PowerShell script to fix import paths
Write-Host "🔄 Fixing import paths..." -ForegroundColor Cyan

# Get all JS files in pages directory
$files = Get-ChildItem -Path "pages" -Recurse -Include "*.js"

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace import paths
    $content = $content -replace "from\s+['""]\.\.\/components\/", "from '../src/components/"
    $content = $content -replace "from\s+['""]\.\.\/contexts\/", "from '../src/contexts/"
    $content = $content -replace "from\s+['""]\.\.\/lib\/", "from '../src/lib/"
    $content = $content -replace "from\s+['""]\.\./\.\.\/components\/", "from '../../src/components/"
    $content = $content -replace "from\s+['""]\.\./\.\.\/contexts\/", "from '../../src/contexts/"
    $content = $content -replace "from\s+['""]\.\./\.\.\/lib\/", "from '../../src/lib/"
    
    # Also handle require statements
    $content = $content -replace "require\s*\(\s*['""]\.\.\/components\/", "require('../src/components/"
    $content = $content -replace "require\s*\(\s*['""]\.\.\/contexts\/", "require('../src/contexts/"
    $content = $content -replace "require\s*\(\s*['""]\.\.\/lib\/", "require('../src/lib/"
    $content = $content -replace "require\s*\(\s*['""]\.\./\.\.\/components\/", "require('../../src/components/"
    $content = $content -replace "require\s*\(\s*['""]\.\./\.\.\/contexts\/", "require('../../src/contexts/"
    $content = $content -replace "require\s*\(\s*['""]\.\./\.\.\/lib\/", "require('../../src/lib/"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "⏭️  No changes needed: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "🎉 Import path fixing complete!" -ForegroundColor Green
