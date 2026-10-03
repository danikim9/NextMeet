import { useEffect, type ReactNode } from 'react'
import { go, resetDemo, setState, useStore, type CheckinKind, type ReplyKind, type Screen } from './store'

export const CHECKIN: Record<CheckinKind, { label: string; emoji: string; desc: string }> = {
  good: { label: '잘 지내요', emoji: '😊', desc: '그냥 안부만 전해요' },
  talk: { label: '이야기하고 싶어요', emoji: '💬', desc: '누군가와 이야기 나누고 싶어요' },
  rest: { label: '며칠 쉬어요', emoji: '🌙', desc: '며칠 조용히 지낼게요. 걱정 마세요' },
}

export const REPLY: Record<ReplyKind, string> = {
  hi: '반가워요 👋',
  call: '전화할게요 📞',
  rest: '푹 쉬세요 🌙',
}

export function TopBar({ back, title }: { back?: Screen; title?: string }) {
  return (
    <header className="topbar">
      {back ? (
        <button className="back" onClick={() => go(back)}>
          ← 이전으로
        </button>
      ) : (
        <div className="brand">
          <Buddy size={46} />
          또봄
        </div>
      )}
      {title && <span className="topbar__title">{title}</span>}
      <span className="demo-pill" title="가상 데이터로 만든 시연용 화면입니다">
        데모
      </span>
    </header>
  )
}

export function Steps({ now, total }: { now: number; total: number }) {
  return (
    <p className="steps" aria-label={`${total}단계 중 ${now}단계`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < now ? 'on' : ''} />
      ))}
      <b>
        {now} / {total}
      </b>
    </p>
  )
}

export function Toast() {
  const { toast } = useStore()
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setState((s) => ({ ...s, toast: null })), 3500)
    return () => window.clearTimeout(t)
  }, [toast])
  if (!toast) return null
  return (
    <div className="toast" role="status">
      ✓ {toast}
    </div>
  )
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warm' }) {
  return <div className={`note note--${tone}`}>{children}</div>
}

export function DemoTag({ children = '예시' }: { children?: ReactNode }) {
  return <span className="demo-tag">{children}</span>
}

const TABS: { screen: Screen; label: string; icon: string }[] = [
  { screen: 'explore', label: '둘러보기', icon: '🔍' },
  { screen: 'home', label: '내 모임', icon: '🏠' },
  { screen: 'meet', label: '만남', icon: '📅' },
  { screen: 'help', label: '도움', icon: '🙋' },
]

export function TabBar({ active }: { active: Screen }) {
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {TABS.map((t) => (
        <button
          key={t.screen}
          className={active === t.screen ? 'on' : ''}
          aria-current={active === t.screen ? 'page' : undefined}
          onClick={() => go(t.screen)}
        >
          <span aria-hidden>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}

export function ResetLink() {
  return (
    <button
      className="link-btn"
      onClick={() => {
        if (confirm('데모를 처음 상태로 되돌릴까요?')) resetDemo()
      }}
    >
      데모 처음부터 다시 하기
    </button>
  )
}

const AVATAR_TONES = ['aqua', 'peach', 'coral', 'teal'] as const

/** 사진 대신 이름 첫 글자로 만든 동그라미 */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const tone = AVATAR_TONES[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_TONES.length]
  return (
    <span className={`avatar avatar--${tone}`} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {name.slice(0, 1)}
    </span>
  )
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <span className="avatar-stack">
      {shown.map((n) => (
        <Avatar key={n} name={n} />
      ))}
      {rest > 0 && <span className="avatar avatar--more">+{rest}</span>}
    </span>
  )
}

/** '10월 13일 (화)' → 달력 모양 날짜 블록 */
export function DateBlock({ date }: { date: string }) {
  const m = date.match(/(\d+)월\s*(\d+)일\s*\((.)\)/)
  if (!m) return <span className="date-block date-block--text">{date}</span>
  return (
    <span className="date-block" aria-hidden>
      <small>{m[1]}월</small>
      <b>{m[2]}</b>
      <small>{m[3]}요일</small>
    </span>
  )
}

/** 또봄이: 로고의 두 동그라미가 캐릭터가 된 마스코트 */
export function Buddy({ mood = 'happy', size = 140 }: { mood?: 'happy' | 'sleep' | 'wave'; size?: number }) {
  const ink = '#15323d'
  const eye = (x: number) =>
    mood === 'sleep' ? (
      <path key={x} d={`M${x - 4} 52 q4 4 8 0`} stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
    ) : (
      <circle key={x} cx={x} cy={52} r={3.6} fill={ink} />
    )
  return (
    <svg className="buddy" viewBox="0 0 150 100" width={size} height={(size * 100) / 150} aria-hidden>
      <g stroke={ink} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M96 26 q2 -14 16 -16 q0 13 -16 16z" fill="#4FB6C6" />
        <path d="M96 26 q-3 -6 0 -12" fill="none" />
        <circle cx="50" cy="60" r="32" fill="#4FB6C6" />
        <circle cx="94" cy="60" r="32" fill="#FF6F7D" />
        {mood === 'wave' && <path d="M124 52 q12 -6 12 -20" fill="none" />}
      </g>
      <ellipse cx="34" cy="64" rx="6" ry="3.5" fill="#FFD6C8" />
      <ellipse cx="110" cy="64" rx="6" ry="3.5" fill="#FFD6C8" />
      {[40, 54, 88, 102].map(eye)}
      <path d="M41 63 q6 6 12 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M89 63 q6 6 12 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      {mood === 'sleep' && (
        <text x="124" y="30" fontFamily="Jua, sans-serif" fontSize="16" fill={ink}>
          z z
        </text>
      )}
    </svg>
  )
}
