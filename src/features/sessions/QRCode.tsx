'use client'

import * as React from 'react'
import { encodeAttendanceQr } from './qr'

export function QRCode({ value, size = 224 }: { value: string; size?: number }) {
  const result = React.useMemo(() => {
    try {
      return { grid: encodeAttendanceQr(value), error: '' }
    } catch {
      return { grid: null, error: 'This check-in link is too long to encode as a QR code.' }
    }
  }, [value])
  if (!result.grid) return <p role="alert" className="text-xs text-rose-600">{result.error}</p>
  const border = 4
  const modules = result.grid.length
  let path = ''
  for (let y = 0; y < modules; y += 1) {
    for (let x = 0; x < modules; x += 1) {
      if (result.grid[y][x]) path += `M${x + border},${y + border}h1v1h-1z`
    }
  }
  return <svg
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Session attendance QR code"
    width={size}
    height={size}
    viewBox={`0 0 ${modules + border * 2} ${modules + border * 2}`}
    shapeRendering="crispEdges"
    className="h-auto max-w-full"
  >
    <rect width="100%" height="100%" fill="#fff" />
    <path d={path} fill="#172554" />
  </svg>
}
