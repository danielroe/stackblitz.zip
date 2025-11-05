import { defineHandler, HTTPError } from 'nitro/h3'
import { downloadToBlob, parseUrl } from 'stackblitz-zip'

export default defineHandler(async (event) => {
  const { pathname } = event.url
  if (pathname === '/')
    return // render index.html

  // Convert stackblitz.zip URL to stackblitz.com URL
  const stackblitzUrl = `https://stackblitz.com/${pathname.replace(/^\/|\.zip$/g, '')}`

  // Validate it's a valid StackBlitz edit URL
  if (!stackblitzUrl.match(/stackblitz\.com\/edit\/[^/?#]+/)) {
    throw new HTTPError({
      status: 400,
      statusText: 'Invalid StackBlitz URL. Expected format: /edit/project-id.zip',
    })
  }

  try {
    const projectId = parseUrl(stackblitzUrl)
    const blob = await downloadToBlob({ projectId, verbose: true })

    // Set headers for file download
    event.res.headers.set('Content-Type', 'application/zip')
    event.res.headers.set('Content-Disposition', `attachment; filename="${projectId}.zip"`)

    return blob
  }
  catch (error) {
    throw new HTTPError({
      status: 500,
      statusText: `Failed to download project: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
})
