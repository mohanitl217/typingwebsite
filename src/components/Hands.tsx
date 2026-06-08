import { lookupChar, fingerNames, type Finger } from '../data/keyboard'

interface Props {
  /** the next character to type; the responsible finger animates a press */
  nextChar?: string
}

/** geometry slots p1..p5 from the outer (pinky) side to the thumb */
interface FingerGeo {
  x: number
  w: number
  yTop: number
  h: number
  thumb?: boolean
}

const SLOTS: FingerGeo[] = [
  { x: 12, w: 15, yTop: 70, h: 40 }, // pinky
  { x: 31, w: 16, yTop: 56, h: 58 }, // ring
  { x: 51, w: 16, yTop: 50, h: 66 }, // middle
  { x: 71, w: 16, yTop: 60, h: 52 }, // index
  { x: 92, w: 16, yTop: 84, h: 46, thumb: true }, // thumb
]

const LEFT_IDS: Finger[] = ['l-pinky', 'l-ring', 'l-middle', 'l-index', 'thumb']
const RIGHT_IDS: Finger[] = ['r-pinky', 'r-ring', 'r-middle', 'r-index', 'thumb']

export default function Hands({ nextChar }: Props) {
  const lk = nextChar ? lookupChar(nextChar) : null
  const primary = lk?.finger ?? null
  const needsShift = Boolean(lk?.shift)

  // The opposite-hand pinky presses Shift.
  const shiftFinger: Finger | null = needsShift
    ? primary && primary.startsWith('l-')
      ? 'r-pinky'
      : 'l-pinky'
    : null

  const active = new Set<Finger>()
  if (primary) active.add(primary)
  if (shiftFinger) active.add(shiftFinger)

  const label = primary ? fingerNames[primary] : 'Rest on the home row'

  return (
    <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
      <div className="mb-1 text-center text-[11px] font-semibold text-slate-500">
        {primary ? (
          <>
            Use your <span className="text-brand-600">{label}</span>
            {needsShift && <span className="text-accent-600"> + opposite Shift (pinky)</span>}
          </>
        ) : (
          label
        )}
      </div>
      <div className="flex items-start justify-center gap-10">
        <Hand ids={LEFT_IDS} active={active} />
        <Hand ids={RIGHT_IDS} active={active} mirror />
      </div>
    </div>
  )
}

function Hand({ ids, active, mirror }: { ids: Finger[]; active: Set<Finger>; mirror?: boolean }) {
  return (
    <svg
      width="120"
      height="130"
      viewBox="0 0 120 130"
      style={mirror ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* palm */}
      <rect x="14" y="38" width="100" height="46" rx="20" className="fill-slate-300/70" />
      {SLOTS.map((g, i) => {
        const id = ids[i]
        const isActive = active.has(id)
        return (
          <g key={i} className={isActive ? 'finger-active' : ''} style={{ transformBox: 'fill-box' }}>
            {g.thumb ? (
              <rect
                x={g.x}
                y={g.yTop}
                width={g.w}
                height={g.h}
                rx={g.w / 2}
                transform={`rotate(38 ${g.x + g.w / 2} ${g.yTop})`}
                className={isActive ? 'fill-brand-500' : 'fill-slate-300'}
              />
            ) : (
              <rect
                x={g.x}
                y={g.yTop}
                width={g.w}
                height={g.h}
                rx={g.w / 2}
                className={isActive ? 'fill-brand-500' : 'fill-slate-300'}
              />
            )}
            {isActive && (
              <circle
                cx={g.thumb ? g.x + g.w + 4 : g.x + g.w / 2}
                cy={g.thumb ? g.yTop + g.h : g.yTop + g.h}
                r="6"
                className="fill-brand-600/40"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
