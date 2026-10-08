'use client'

import * as React from 'react'

export interface CrystalBadgeProps {
  type: 'warning' | 'success' | 'info' | 'alert' | 'purple' | 'cyan'
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export function CrystalBadge({ type, className = '', size = 'md' }: CrystalBadgeProps) {
  const rawId = React.useId()
  const uid = React.useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, '_'), [rawId])

  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12 sm:w-13 sm:h-13',
    lg: 'w-14 h-14 sm:w-16 sm:h-16'
  }[size]

  if (type === 'warning') {
    // 3D Golden Crystal Gem Emblem matching reference media_1791454111794_e621fd98.png
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
        style={{ filter: 'drop-shadow(0 0 14px rgba(234, 179, 8, 0.45)) drop-shadow(0 4px 10px rgba(161, 98, 7, 0.3))' }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={`goldAura_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#eab308" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`goldMain_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#facc15" />
              <stop offset="70%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>

            <linearGradient id={`goldLight_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id={`goldDark_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>

            <linearGradient id={`crystalShine_${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#fde047" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ambient soft glow background */}
          <circle cx="50" cy="50" r="46" fill={`url(#goldAura_${uid})`} />

          {/* Bottom Crystal Shards / Base Cluster */}
          <polygon points="26,76 34,58 38,78" fill={`url(#goldMain_${uid})`} />
          <polygon points="18,72 26,76 28,84" fill={`url(#goldDark_${uid})`} />
          <polygon points="26,76 34,58 29,82" fill={`url(#goldLight_${uid})`} />

          <polygon points="74,76 66,58 62,78" fill={`url(#goldMain_${uid})`} />
          <polygon points="82,72 74,76 72,84" fill={`url(#goldDark_${uid})`} />
          <polygon points="74,76 66,58 71,82" fill={`url(#goldLight_${uid})`} />

          <polygon points="50,92 42,76 58,76" fill={`url(#goldMain_${uid})`} />
          <polygon points="50,92 42,76 50,72" fill={`url(#goldLight_${uid})`} />
          <polygon points="50,92 58,76 50,72" fill={`url(#goldDark_${uid})`} />

          {/* Main Octagonal/Hexagonal Medallion Body */}
          <polygon
            points="50,14 78,28 84,56 66,80 34,80 16,56 22,28"
            fill={`url(#goldMain_${uid})`}
            stroke="#fef08a"
            strokeWidth="1.5"
          />

          {/* Outer Facets */}
          <polygon points="50,14 78,28 66,38 50,30" fill={`url(#goldLight_${uid})`} />
          <polygon points="50,14 22,28 34,38 50,30" fill="#fef08a" opacity="0.8" />
          <polygon points="78,28 84,56 70,56 66,38" fill={`url(#goldDark_${uid})`} />
          <polygon points="22,28 16,56 30,56 34,38" fill={`url(#goldMain_${uid})`} />
          <polygon points="84,56 66,80 58,68 70,56" fill={`url(#goldDark_${uid})`} />
          <polygon points="16,56 34,80 42,68 30,56" fill={`url(#goldMain_${uid})`} />

          {/* Inner Faceted Center */}
          <polygon
            points="50,26 70,44 64,66 36,66 30,44"
            fill={`url(#goldMain_${uid})`}
            stroke="#ffffff"
            strokeWidth="0.8"
            opacity="0.95"
          />

          <polygon
            points="50,30 66,45 61,63 39,63 34,45"
            fill={`url(#goldDark_${uid})`}
          />

          {/* Top Specular Glint */}
          <path
            d="M36,36 L50,28 L64,36"
            stroke={`url(#crystalShine_${uid})`}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Center Glowing Alert Triangle Icon */}
          <g transform="translate(36, 34) scale(1.15)">
            <polygon
              points="12,2 23,21 1,21"
              fill="#fef08a"
              stroke="#713f12"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <line x1="12" y1="8" x2="12" y2="14" stroke="#713f12" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="18" r="1.2" fill="#713f12" />
          </g>
        </svg>
      </div>
    )
  }

  if (type === 'success') {
    // 3D Emerald Mint Crystal Gem Emblem matching reference media_1791454046098_7779ab90.png
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
        style={{ filter: 'drop-shadow(0 0 14px rgba(16, 185, 129, 0.45)) drop-shadow(0 4px 10px rgba(4, 120, 87, 0.3))' }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={`emeraldAura_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`emeraldMain_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="30%" stopColor="#34d399" />
              <stop offset="70%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            <linearGradient id={`emeraldLight_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id={`emeraldDark_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>

            <linearGradient id={`emeraldShine_${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#a7f3d0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ambient soft glow background */}
          <circle cx="50" cy="50" r="46" fill={`url(#emeraldAura_${uid})`} />

          {/* 8-Pointed Faceted Crystal Star Gem Outline */}
          <polygon
            points="50,12 62,24 78,22 80,38 92,50 80,62 78,78 62,76 50,88 38,76 22,78 20,62 8,50 20,38 22,22 38,24"
            fill={`url(#emeraldDark_${uid})`}
            stroke="#a7f3d0"
            strokeWidth="1.2"
          />

          <polygon points="50,12 62,24 50,28" fill={`url(#emeraldLight_${uid})`} />
          <polygon points="50,12 38,24 50,28" fill="#a7f3d0" opacity="0.7" />
          <polygon points="78,22 80,38 68,36" fill={`url(#emeraldMain_${uid})`} />
          <polygon points="92,50 80,62 72,50" fill={`url(#emeraldDark_${uid})`} />
          <polygon points="78,78 62,76 66,66" fill={`url(#emeraldDark_${uid})`} />
          <polygon points="50,88 38,76 50,72" fill={`url(#emeraldMain_${uid})`} />
          <polygon points="22,78 20,62 32,64" fill={`url(#emeraldMain_${uid})`} />
          <polygon points="8,50 20,38 28,50" fill={`url(#emeraldLight_${uid})`} />

          <polygon
            points="50,22 72,32 78,56 64,74 36,74 22,56 28,32"
            fill={`url(#emeraldMain_${uid})`}
            stroke="#ffffff"
            strokeWidth="1"
          />

          <circle cx="50" cy="50" r="18" fill={`url(#emeraldDark_${uid})`} stroke="#a7f3d0" strokeWidth="1" />

          <path
            d="M34,34 Q50,24 66,34"
            stroke={`url(#emeraldShine_${uid})`}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <path
            d="M42,50 L48,56 L60,42"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 4px #a7f3d0)' }}
          />
        </svg>
      </div>
    )
  }

  if (type === 'purple') {
    // 3D Amethyst Crystal Gem Emblem (Funds Received, Offerings, Royal Celebrations)
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
        style={{ filter: 'drop-shadow(0 0 14px rgba(168, 85, 247, 0.45)) drop-shadow(0 4px 10px rgba(126, 34, 206, 0.3))' }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={`amethystAura_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f3e8ff" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`amethystMain_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="30%" stopColor="#c084fc" />
              <stop offset="70%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>

            <linearGradient id={`amethystLight_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id={`amethystDark_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="46" fill={`url(#amethystAura_${uid})`} />

          {/* Hexagonal diamond facet body */}
          <polygon
            points="50,14 78,28 84,56 66,80 34,80 16,56 22,28"
            fill={`url(#amethystMain_${uid})`}
            stroke="#f3e8ff"
            strokeWidth="1.5"
          />
          <polygon points="50,14 78,28 66,38 50,30" fill={`url(#amethystLight_${uid})`} />
          <polygon points="50,14 22,28 34,38 50,30" fill="#f3e8ff" opacity="0.8" />
          <polygon points="78,28 84,56 70,56 66,38" fill={`url(#amethystDark_${uid})`} />
          <polygon points="22,28 16,56 30,56 34,38" fill={`url(#amethystMain_${uid})`} />
          <polygon points="84,56 66,80 58,68 70,56" fill={`url(#amethystDark_${uid})`} />
          <polygon points="16,56 34,80 42,68 30,56" fill={`url(#amethystMain_${uid})`} />

          <polygon points="50,26 70,44 64,66 36,66 30,44" fill={`url(#amethystDark_${uid})`} stroke="#ffffff" strokeWidth="0.8" />

          {/* Money received arrow symbol inside */}
          <g transform="translate(36, 35)">
            <path d="M14 4v16M8 14l6 6 6-6" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>
    )
  }

  if (type === 'cyan') {
    // 3D Aquamarine / Topaz Crystal Gem Emblem (Attendance, QR, Active Members)
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
        style={{ filter: 'drop-shadow(0 0 14px rgba(6, 182, 212, 0.45)) drop-shadow(0 4px 10px rgba(14, 116, 144, 0.3))' }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={`cyanAura_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#cffafe" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`cyanMain_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cffafe" />
              <stop offset="30%" stopColor="#22d3ee" />
              <stop offset="70%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#164e63" />
            </linearGradient>

            <linearGradient id={`cyanDark_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#083344" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="46" fill={`url(#cyanAura_${uid})`} />
          <polygon
            points="50,14 78,28 84,56 66,80 34,80 16,56 22,28"
            fill={`url(#cyanMain_${uid})`}
            stroke="#cffafe"
            strokeWidth="1.5"
          />
          <polygon points="50,26 70,44 64,66 36,66 30,44" fill={`url(#cyanDark_${uid})`} stroke="#ffffff" strokeWidth="0.8" />

          {/* Modern QR/Session checkmark icon */}
          <path
            d="M38 50l8 8 16-16"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  if (type === 'info') {
    // 3D Sapphire Blue Crystal Gem Emblem
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
        style={{ filter: 'drop-shadow(0 0 14px rgba(99, 102, 241, 0.45)) drop-shadow(0 4px 10px rgba(67, 56, 202, 0.3))' }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={`sapphireAura_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4338ca" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`sapphireMain_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c7d2fe" />
              <stop offset="30%" stopColor="#818cf8" />
              <stop offset="70%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>

            <linearGradient id={`sapphireDark_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3730a3" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="46" fill={`url(#sapphireAura_${uid})`} />
          <polygon
            points="50,14 78,28 84,56 66,80 34,80 16,56 22,28"
            fill={`url(#sapphireMain_${uid})`}
            stroke="#c7d2fe"
            strokeWidth="1.5"
          />
          <polygon points="50,26 70,44 64,66 36,66 30,44" fill={`url(#sapphireDark_${uid})`} stroke="#ffffff" strokeWidth="0.8" />

          {/* Info "i" Symbol */}
          <circle cx="50" cy="40" r="2.5" fill="#ffffff" />
          <line x1="50" y1="46" x2="50" y2="60" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  // Ruby Alert Gem
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
      style={{ filter: 'drop-shadow(0 0 14px rgba(244, 63, 94, 0.45)) drop-shadow(0 4px 10px rgba(190, 18, 60, 0.3))' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`rubyAura_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#be123c" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`rubyMain_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="30%" stopColor="#fb7185" />
            <stop offset="70%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>

          <linearGradient id={`rubyDark_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="46" fill={`url(#rubyAura_${uid})`} />
        <polygon
          points="50,14 78,28 84,56 66,80 34,80 16,56 22,28"
          fill={`url(#rubyMain_${uid})`}
          stroke="#fecdd3"
          strokeWidth="1.5"
        />
        <polygon points="50,26 70,44 64,66 36,66 30,44" fill={`url(#rubyDark_${uid})`} stroke="#ffffff" strokeWidth="0.8" />

        {/* Exclamation point */}
        <line x1="50" y1="36" x2="50" y2="52" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="59" r="2" fill="#ffffff" />
      </svg>
    </div>
  )
}
