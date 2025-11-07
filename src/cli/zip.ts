#!/usr/bin/env node

import process from 'node:process'
import { cloneProject, downloadToFile, parseUrl } from '../download'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
StackBlitz Project Downloader

Usage:
  stackblitz-zip <url> [output-path]              Download as zip file
  stackblitz-zip clone <url> [output-path]        Clone to directory

Arguments:
  url          StackBlitz project URL (e.g., https://stackblitz.com/edit/nuxt-starter-k7spa3r4)
  output-path  Optional path for the output (defaults to <project-id>.zip or <project-id>/)

Examples:
  stackblitz-zip https://stackblitz.com/edit/nuxt-starter-k7spa3r4
  stackblitz-zip https://stackblitz.com/edit/nuxt-starter-k7spa3r4 my-project.zip
  stackblitz-zip clone https://stackblitz.com/edit/nuxt-starter-k7spa3r4
  stackblitz-zip clone https://stackblitz.com/edit/nuxt-starter-k7spa3r4 ./my-project
`)
    process.exit(0)
  }

  const isClone = args[0] === 'clone'
  const url = isClone ? args[1]! : args[0]!
  const outputPath = isClone ? args[2] : args[1]

  try {
    const projectId = parseUrl(url)

    if (isClone) {
      await cloneProject({ projectId, outputPath, verbose: true })
    }
    else {
      await downloadToFile({ projectId, outputPath, verbose: true })
    }
  }
  catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
