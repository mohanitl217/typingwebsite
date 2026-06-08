import { lookupChar, type Finger } from '../data/keyboard'

/** Finger geometry for a LEFT hand drawn palm-down, fingers pointing up.
 *  Order across the top (left → right): pinky, ring, middle, index, then thumb. */
interface Geo {
  x: number
  y: number
  len: number
  w: number
  a: number // rotation (deg) about the base
}

const GEO: Geo[] = [
  { x: 46, y: 176, len: 70, w: 20, a: -16 }, // pinky (slot 0)
  { x: 72, y: 160, len: 96, w: 23, a: -6 }, // ring (slot 1)
  { x: 99, y: 152, len: 108, w: 24, a: 1 }, // middle (slot 2)
  { x: 126, y: 162, len: 92, w: 23, a: 9 }, // index (slot 3)
  { x: 150, y: 214, len: 66, w: 24, a: 58 }, // thumb (slot 4)
]

const LEFT_IDS: Finger[] = ['l-pinky', 'l-ring', 'l-middle', 'l-index', 'thumb']
const RIGHT_IDS: Finger[] = ['r-pinky', 'r-ring', 'r-middle', 'r-index', 'thumb']

interface HandProps {
  side: 'left' | 'right'
  active: Set<Finger>
  className?: string
}

export function Hand({ side, active, className }: HandProps) {
  const ids = side === 'left' ? LEFT_IDS : RIGHT_IDS
  const sid = side // unique gradient ids per side

  return (
    <svg
      viewBox="0 0 210 300"
      className={className}
      style={side === 'right' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <linearGradient id={`skin-${sid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbd9bd" />
          <stop offset="100%" stopColor="#e8b48c" />
        </linearGradient>
        <linearGradient id={`skin-act-${sid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <radialGradient id={`palm-${sid}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fcdcc0" />
          <stop offset="100%" stopColor="#e3ad84" />
        </radialGradient>
        <filter id={`sh-${sid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter={`url(#sh-${sid})`}>
        {/* fingers (behind the palm so their bases are hidden) */}
        {GEO.map((g, i) => {
          const id = ids[i]
          const isActive = active.has(id)
          const fill = isActive ? `url(#skin-act-${sid})` : `url(#skin-${sid})`
          const tipY = g.y - g.len
          return (
            <g key={i} transform={`rotate(${g.a} ${g.x} ${g.y})`}>
              {isActive && (
                <circle cx={g.x} cy={tipY + 6} r={g.w} fill="#22c55e" opacity="0.25">
                  <animate
                    attributeName="r"
                    values={`${g.w};${g.w + 6};${g.w}`}
                    dur="0.9s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <rect
                x={g.x - g.w / 2}
                y={tipY}
                width={g.w}
                height={g.len + g.w}
                rx={g.w / 2}
                fill={fill}
                stroke={isActive ? '#4338ca' : '#cf9a73'}
                strokeWidth={isActive ? 2 : 1}
              />
              {/* nail */}
              <ellipse
                cx={g.x}
                cy={tipY + g.w * 0.7}
                rx={g.w * 0.28}
                ry={g.w * 0.4}
                fill={isActive ? '#e0e7ff' : '#f7e3d2'}
                opacity="0.85"
              />
              {isActive && (
                <circle cx={g.x} cy={tipY + g.w * 0.7} r="4" fill="#16a34a">
                  <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          )
        })}

        {/* palm + wrist */}
        <path
          d="M40 168
             q-6 28 0 60
             q4 44 30 52
             q30 8 60 0
             q26 -10 30 -52
             q5 -32 0 -60
             q-30 -22 -60 -22
             q-32 0 -60 22 Z"
          fill={`url(#palm-${sid})`}
          stroke="#cf9a73"
          strokeWidth="1.5"
        />
        {/* thumb muscle hint */}
        <path
          d="M150 210 q22 6 24 34 q1 18 -14 24"
          fill="none"
          stroke="#cf9a73"
          strokeWidth="1"
          opacity="0.5"
        />
      </g>
    </svg>
  )
}

/** Convenience: derive the active finger(s) from the next character. */
export function fingersForChar(nextChar?: string): Set<Finger> {
  const set = new Set<Finger>()
  const lk = nextChar ? lookupChar(nextChar) : null
  if (lk?.finger) set.add(lk.finger)
  if (lk?.shift) set.add(lk.finger.startsWith('l-') ? 'r-pinky' : 'l-pinky')
  return set
}
