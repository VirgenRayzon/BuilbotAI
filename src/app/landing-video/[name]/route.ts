import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

const videoNames = new Set(['prism5', 'king45']);

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!videoNames.has(name)) return new NextResponse(null, { status: 404 });

  let file: Buffer;
  try {
    file = await readFile(path.join(process.cwd(), 'public', 'videos', `${name}.mp4`));
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const range = request.headers.get('range');
  const match = range?.match(/^bytes=(\d+)-(\d*)$/);
  if (range && !match) {
    return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${file.length}` } });
  }
  const start = match ? Number(match[1]) : 0;
  const end = match && match[2] ? Number(match[2]) : file.length - 1;
  if (start >= file.length || end < start || end >= file.length) {
    return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${file.length}` } });
  }

  const body = new Uint8Array(file.subarray(start, end + 1));
  return new NextResponse(body, {
    status: match ? 206 : 200,
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(body.byteLength),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      ...(match ? { 'Content-Range': `bytes ${start}-${end}/${file.length}` } : {}),
    },
  });
}
