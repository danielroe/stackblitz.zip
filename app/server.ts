import { defineHandler, HTTPError } from 'nitro/h3'
import { downloadToResponse, parseUrl } from 'stackblitz-zip'

export default defineHandler(async (event) => {
  const { pathname } = event.url
  if (pathname === '/')
    return // render index.html

  // Check if this is a clone request (just redirect to regular download for now)
  if (pathname.startsWith('/clone/')) {
    const cleanPath = pathname.replace(/^\/clone\//, '')
    return Response.redirect(`https://stackblitz.zip/${cleanPath}`, 302)
  }

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
    const response = await downloadToResponse({ projectId, verbose: true })

    // Set headers for file download
    event.res.headers.set('Content-Type', 'application/zip')
    event.res.headers.set('Content-Disposition', `attachment; filename="${projectId}.zip"`)

    return response.blob()
  }
  catch (error) {
    throw new HTTPError({
      status: 500,
      statusText: `Failed to download project: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
})
