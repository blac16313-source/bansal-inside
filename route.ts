import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string, path?: string[] } }
) {
  const filePath = params.path ? params.path.join('/') : 'index.html'
  const apiUrl = new URL('/api/site', req.url)
  apiUrl.searchParams.set('id', params.id)
  apiUrl.searchParams.set('file', filePath)
  
  const fileRes = await fetch(apiUrl)
  const data = await fileRes.arrayBuffer()
  
  return new NextResponse(data, {
    status: fileRes.status,
    headers: {
      'Content-Type': fileRes.headers.get('Content-Type') || 'text/html',
    }
  })
}