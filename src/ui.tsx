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
          <span className="brand__mark" aria-hidden />
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
  { screen: 'home', label: '우리 모임', icon: '🏠' },
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
