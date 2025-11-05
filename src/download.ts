import JSZip from 'jszip'

export interface DownloadOptions {
  projectId: string
  outputPath?: string
  timeout?: number
  maxFileSize?: number
  maxTotalSize?: number
  verbose?: boolean
}

interface StackBlitzProject {
  appFiles: Record<string, {
    name: string
    type: 'file' | 'directory'
    contents: string
    fullPath: string
  }>
}

interface StackBlitzProjectResponse {
  project: StackBlitzProject
}

async function createZip(options: Omit<DownloadOptions, 'outputPath'>): Promise<JSZip> {
  const {
    projectId,
    timeout = 30000,
    maxFileSize = 10 * 1024 * 1024, // 10MB per file
    maxTotalSize = 100 * 1024 * 1024, // 100MB total
    verbose = false,
  } = options

  if (!/^[\w-]+$/.test(projectId)) {
    throw new Error('Invalid project ID: must contain only alphanumeric characters, hyphens, and underscores')
  }

  const url = `https://stackblitz.com/api/projects/${projectId}?include_files=true`
  if (verbose) {
    // eslint-disable-next-line no-console
    console.log(`Fetching project: ${url}`)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`)
    }

    const { project: projectData } = await response.json() as StackBlitzProjectResponse

    if (!projectData || !projectData.appFiles) {
      throw new Error('No files found in project data')
    }

    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(`Found ${Object.keys(projectData.appFiles).length} files in project`)
    }

    // Create a zip file
    const zip = new JSZip()
    let totalSize = 0

    // Add all files to the zip
    for (const [filePath, fileData] of Object.entries(projectData.appFiles)) {
      if (filePath.includes('node_modules/') || filePath.includes('.git/')) {
        continue
      }

      // Skip directories
      if (fileData.type !== 'file') {
        continue
      }

      // Sanitize file path to prevent zip slip attacks
      const normalizedPath = normalizePath(filePath)
      if (!normalizedPath || normalizedPath.startsWith('/') || normalizedPath.includes('..')) {
        if (verbose) {
          console.warn(`Skipping suspicious file path: ${filePath}`)
        }
        continue
      }

      // Check file size (using TextEncoder for accurate byte length)
      const encoder = new TextEncoder()
      const fileBytes = encoder.encode(fileData.contents)
      const fileSize = fileBytes.length

      if (fileSize > maxFileSize) {
        throw new Error(`File ${normalizedPath} exceeds maximum size of ${maxFileSize} bytes`)
      }

      totalSize += fileSize
      if (totalSize > maxTotalSize) {
        throw new Error(`Total project size exceeds maximum of ${maxTotalSize} bytes`)
      }

      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(`Adding file: ${normalizedPath}`)
      }
      zip.file(normalizedPath, fileData.contents)
    }

    return zip
  }
  catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Normalize a file path to prevent directory traversal (Web API compatible)
 */
function normalizePath(path: string): string {
  // Remove leading/trailing slashes and dots
  const parts = path.split('/').filter(part => part && part !== '.')

  // Build normalized path, removing any '..' segments
  const normalized: string[] = []
  for (const part of parts) {
    if (part === '..') {
      // Remove parent if exists, otherwise skip
      if (normalized.length > 0) {
        normalized.pop()
      }
    }
    else {
      normalized.push(part)
    }
  }

  return normalized.join('/')
}

/**
 * Downloads a StackBlitz project as a zip file (Node.js only)
 *
 * @param options - Configuration options for the download
 * @returns Path to the downloaded zip file
 *
 * @example
 * ```ts
 * import { downloadToFile } from 'stackblitz-zip'
 *
 * await downloadToFile({
 *   projectId: 'nuxt-starter-k7spa3r4',
 *   outputPath: './my-project.zip'
 * })
 * ```
 */
export async function downloadToFile(options: DownloadOptions): Promise<string> {
  const { projectId, outputPath, verbose = false } = options

  const zip = await createZip(options)

  // Dynamically import Node.js modules
  const { resolve } = await import('node:path')
  const { writeFile } = await import('node:fs/promises')
  const process = await import('node:process')

  // Determine output path
  const finalOutputPath = outputPath || resolve(process.cwd(), `${projectId}.zip`)

  // Generate and write the zip file
  const content = await zip.generateAsync({ type: 'nodebuffer' })
  await writeFile(finalOutputPath, content)

  if (verbose) {
    // eslint-disable-next-line no-console
    console.log(`✅ Project downloaded to: ${finalOutputPath}`)
  }

  return finalOutputPath
}

/**
 * Downloads a StackBlitz project and returns it as an ArrayBuffer (universal)
 *
 * @param options - Configuration options for the download
 * @returns ArrayBuffer containing the zip file
 */
export async function downloadToBuffer(options: Omit<DownloadOptions, 'outputPath'>): Promise<ArrayBuffer> {
  const zip = await createZip(options)
  return zip.generateAsync({ type: 'arraybuffer' })
}

/**
 * Downloads a StackBlitz project and returns it as a Blob (browser-friendly)
 *
 * @param options - Configuration options for the download
 * @returns Blob containing the zip file
 */
export async function downloadToBlob(options: Omit<DownloadOptions, 'outputPath'>): Promise<Blob> {
  const zip = await createZip(options)
  return zip.generateAsync({ type: 'blob' })
}

/**
 * Parse a StackBlitz URL and extract the project ID
 *
 * @param url - Full StackBlitz URL (e.g., https://stackblitz.com/edit/project-id)
 * @returns The project ID
 *
 * @example
 * ```ts
 * import { parseUrl } from 'stackblitz-zip'
 *
 * const projectId = parseUrl('https://stackblitz.com/edit/nuxt-starter-k7spa3r4')
 * // => 'nuxt-starter-k7spa3r4'
 * ```
 */
export function parseUrl(url: string): string {
  const match = url.match(/stackblitz\.com\/edit\/([^/?#]+)/)

  if (!match || !match[1]) {
    throw new Error(`Invalid StackBlitz URL: ${url}`)
  }

  return match[1]
}
