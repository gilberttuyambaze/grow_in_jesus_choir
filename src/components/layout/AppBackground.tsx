import type { ReactNode } from 'react'

export function AppBackground({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="app-backdrop" aria-hidden="true">
        <svg className="app-geometry" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="app-diamond-mesh" width="560" height="560" patternUnits="userSpaceOnUse">
              <path
                d="M 0 140 L 140 0 L 280 140 L 140 280 Z M 280 140 L 420 0 L 560 140 L 420 280 Z M 0 420 L 140 280 L 280 420 L 140 560 Z M 280 420 L 420 280 L 560 420 L 420 560 Z"
                fill="none"
                stroke="white"
                strokeOpacity="0.58"
                strokeWidth="1.15"
                vectorEffect="non-scaling-stroke"
              />
              <g fill="white" fillOpacity="0.96">
                <circle cx="0" cy="140" r="3.2" />
                <circle cx="420" cy="0" r="3.2" />
                <circle cx="280" cy="420" r="3.2" />
                <circle cx="140" cy="560" r="3.2" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#app-diamond-mesh)" />
        </svg>
      </div>
      <div className="app-content">{children}</div>
    </>
  )
}
