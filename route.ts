import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string, path?: string[] } }) {
  const siteId = params.id
  const fileName = params.path?.join('/') || 'Testing.html'

  const blobUrl = `https://epxpyk2xjwopcaod.public.blob.vercel-storage.com/websites/${siteId}/${fileName}`

  try {
    const blobRes = await fetch(blobUrl)
    if (!blobRes.ok) return new NextResponse('Not found', { status: 404 })

    const data = await blobRes.arrayBuffer()
    const contentType = blobRes.headers.get('Content-Type') || 
      (fileName.endsWith('.css') ? 'text/css' : fileName.endsWith('.js') ? 'application/javascript' : 'text/html')

    return new NextResponse(data, {
      headers: { 
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=60'
      }
    })
  } catch (e) {
    return new NextResponse('Error', { status: 500 })
  }
}