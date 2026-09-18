import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string, path?: string[] } }) {
  const filePath = params.path ? params.path.join('/') : 'Testing.html'
  
  // Build the blob URL from your ID
  const blobUrl = `https://epxpyk2xjwopcaod.public.blob.vercel-storage.com/websites/${params.id}/${filePath}`
  
  // Use your existing /api/view?url= logic internally
  const viewUrl = new URL('/api/view', req.url)
  viewUrl.searchParams.set('url', blobUrl)
  
  const res = await fetch(viewUrl)
  const data = await res.arrayBuffer()
  
  return new NextResponse(data, {
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'text/html' }
  })
}