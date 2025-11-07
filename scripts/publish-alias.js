#!/usr/bin/env node

/**
 * Publish the package as 'stackblitz-clone' alias
 * Run this after publishing 'stackblitz-zip'
 */

import { execSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const packageJsonPath = resolve(process.cwd(), 'package.json')

async function main() {
  console.log('📦 Publishing as stackblitz-clone...\n')

  // Read current package.json
  const originalContent = await readFile(packageJsonPath, 'utf-8')
  const pkg = JSON.parse(originalContent)
  const originalName = pkg.name

  if (originalName !== 'stackblitz-zip') {
    console.error('❌ Error: Expected package name to be "stackblitz-zip"')
    process.exit(1)
  }

  try {
    // Update package name
    pkg.name = 'stackblitz-clone'
    pkg.description = 'Clone StackBlitz projects to local directories'
    await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
    console.log('✓ Updated package.json name to "stackblitz-clone"')

    // Publish
    console.log('\n📤 Publishing to npm...')
    execSync('pnpm publish --no-git-checks', { stdio: 'inherit' })
    console.log('\n✓ Published stackblitz-clone successfully!')
  }
  catch (error) {
    console.error('\n❌ Error during publishing:', error)
  }
  finally {
    // Restore original package.json
    await writeFile(packageJsonPath, originalContent)
    console.log('✓ Restored package.json to "stackblitz-zip"')
  }
}

main().catch(console.error)
