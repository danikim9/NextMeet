import { useState } from 'react'
import { REPORT_REASONS } from '../data'
import {
  go,
  leaveGroup,
  replyTo,
  sendCheckin,
  setRsvp,
  showToast,
  submitReport,
  useStore,
  type Checkin,
  type CheckinKind,
  type ReplyKind,
} from '../store'
import { CHECKIN, DemoTag, Note, REPLY, ResetLink, TabBar, TopBar } from '../ui'

function useGroup() {
  const s = useStore()
  const g = s.groups.find((x) => x.id === s.groupId)
  const me = s.profile.name || '나'
  const meetup = g ? s.meetups[g.id] : undefined
  const myRsvp = meetup ? s.rsvps[meetup.id]?.[me] : undefined
  return { ...s, g, me, meetup, myRsvp }
}

// ── 우리 모임 (홈) ──

export function Home() {
  const { g, me, meetup, myRsvp, checkins } = useGroup()
  if (!g) return null
  const feed = checkins.filter((c) => c.groupId === g.id)

  return (
    <main className="page page--tabbed">
      <TopBar />
      <p className="hello">{me} 님, 반가워요</p>
      <h1 className="h1">{g.name}</h1>

      {meetup && (
        <button className="card meet-card meet-card--link" onClick={() => go('meet')}>
          <p className="eyebrow">다음 만남</p>
          <p className="meet-card__when">
            {meetup.date} {meetup.time}
          </p>
          <p className="meet-card__where">📍 {meetup.place}</p>
          <p className="meet-card__status">
            {myRsvp === 'yes' ? '✓ 간다고 했어요' : myRsvp === 'no' ? '이번엔 못 간다고 했어요' : '갈 수 있는지 알려 주세요 →'}
          </p>
        </button>
      )}

      <button className="btn btn--primary btn--xl" onClick={() => go('send')}>
        <span aria-hidden>💌</span> 오늘 안부 전하기
      </button>

      <h2 className="h2">모임 분들의 안부</h2>
      <ul className="feed">
        {feed.map((c) => (
          <CheckinCard key={c.id} c={c} me={me} />
        ))}
      </ul>
      <p className="fine">답하지 않아도 괜찮아요. 또봄은 읽지 않은 사람이나 답이 없는 사람을 따로 표시하지 않아요.</p>
      <TabBar active="home" />
    </main>
  )
}

const ANSWERS: Record<CheckinKind, ReplyKind[]> = {
  talk: ['hi', 'call'],
  good: ['hi'],
  rest: ['rest'],
}

function CheckinCard({ c, me }: { c: Checkin; me: string }) {
  const { g } = useGroup()
  const mine = c.from === me
  const myReply = c.replies.find((r) => r.from === me)
  const member = g?.members.find((m) => m.name === c.from)
  const info = CHECKIN[c.kind]

  return (
    <li className={`card checkin checkin--${c.kind} ${mine ? 'checkin--mine' : ''}`}>
      <div className="checkin__head">
        <span className="checkin__emoji" aria-hidden>
          {info.emoji}
        </span>
        <div>
          <p className="checkin__who">{mine ? '내 안부' : `${c.from} 님`}</p>
          <p className="checkin__what">{info.label}</p>
        </div>
        <span className="checkin__when">{c.when}</span>
      </div>

      {c.replies.length > 0 && (
        <ul className="replies">
          {c.replies.map((r, i) => (
            <li key={i} className={r.fresh ? 'fresh' : ''}>
              <b>{r.from === me ? '나' : `${r.from} 님`}</b> {REPLY[r.kind]}
              {r.fresh && <DemoTag>예시 응답</DemoTag>}
            </li>
          ))}
        </ul>
      )}

      {mine && c.replies.length === 0 && <p className="checkin__wait">모임 분들께 전했어요</p>}

      {!mine && !myReply && (
        <div className="reply-btns">
          {ANSWERS[c.kind].map((k) => (
            <button key={k} className="btn btn--soft" onClick={() => replyTo(c.id, k)}>
              {REPLY[k]}
            </button>
          ))}
        </div>
      )}

      {!mine && myReply?.kind === 'call' && (
        <div className="call-box">
          {member?.sharesPhone ? (
            <>
              <p>{c.from} 님은 모임 분들께 전화번호를 보여 주기로 했어요.</p>
              <button className="btn btn--coral" onClick={() => showToast('데모에서는 실제로 전화가 걸리지 않아요')}>
                📞 {c.from} 님께 전화 걸기
              </button>
            </>
          ) : (
            <p>
              {c.from} 님은 전화번호를 공개하지 않았어요. 응답은 전해졌으니, 다음 만남에서 반갑게 인사해 보세요.
            </p>
          )}
        </div>
      )}
    </li>
  )
}

// ── 안부 보내기 ──

export function Send() {
  return (
    <main className="page">
      <TopBar back="home" />
      <h1 className="h1">오늘 어떠세요?</h1>
      <p className="sub">버튼 하나만 누르면 돼요. 글은 쓰지 않아도 괜찮아요.</p>
      <div className="send-list">
        {(Object.keys(CHECKIN) as CheckinKind[]).map((k) => (
          <button key={k} className={`send send--${k}`} onClick={() => sendCheckin(k)}>
            <span className="send__emoji" aria-hidden>
              {CHECKIN[k].emoji}
            </span>
            <span>
              <span className="send__label">{CHECKIN[k].label}</span>
              <span className="send__desc">{CHECKIN[k].desc}</span>
            </span>
          </button>
        ))}
      </div>
      <Note>보낸 안부는 우리 모임 분들만 봐요. 가족이나 다른 곳에 자동으로 전해지지 않아요.</Note>
    </main>
  )
}

// ── 만남 ──

export function Meet() {
  const { g, me, meetup, myRsvp, rsvps } = useGroup()
  if (!g) return null

  if (!meetup) {
    return (
      <main className="page page--tabbed">
        <TopBar />
        <h1 className="h1">다음 만남</h1>
        <Note>아직 정해진 만남이 없어요. 진행자가 곧 알려 드려요.</Note>
        <TabBar active="meet" />
      </main>
    )
  }

  const answers = rsvps[meetup.id] ?? {}
  const people = [me, ...g.members.map((m) => m.name)]
  const label = (v?: 'yes' | 'no') => (v === 'yes' ? '갈게요' : v === 'no' ? '이번엔 못 가요' : '아직 몰라요')

  return (
    <main className="page page--tabbed">
      <TopBar />
      <p className="eyebrow">다음 만남</p>
      <h1 className="h1">{meetup.activity}</h1>

      <div className="card detail">
        <p>
          <span aria-hidden>🗓️</span> {meetup.date} {meetup.time}
        </p>
        <p>
          <span aria-hidden>📍</span> {meetup.place}
        </p>
        <p>
          <span aria-hidden>🎒</span> 준비물: {meetup.bring}
        </p>
        {meetup.hostComing && (
          <p>
            <span aria-hidden>🙋</span> 진행자 {g.host} 님이 함께 나와요
          </p>
        )}
      </div>

      <h2 className="h2">갈 수 있으세요?</h2>
      <div className="rsvp">
        <button className={`btn btn--rsvp ${myRsvp === 'yes' ? 'on' : ''}`} aria-pressed={myRsvp === 'yes'} onClick={() => setRsvp(meetup.id, 'yes')}>
          갈게요
        </button>
        <button className={`btn btn--rsvp ${myRsvp === 'no' ? 'on' : ''}`} aria-pressed={myRsvp === 'no'} onClick={() => setRsvp(meetup.id, 'no')}>
          이번엔 못 가요
        </button>
      </div>
      <p className="fine">못 가셔도 괜찮아요. 빠진 횟수는 기록하지 않아요.</p>

      <h2 className="h2">
        누가 오나요 <DemoTag>예시 응답</DemoTag>
      </h2>
      <ul className="people">
        {people.map((p) => (
          <li key={p}>
            <span>{p === me ? `${p} (나)` : `${p} 님`}</span>
            <span className={`pill pill--${answers[p] ?? 'none'}`}>{label(answers[p])}</span>
          </li>
        ))}
      </ul>

      <Note tone="warm">
        처음 몇 번은 사람 많은 <b>공개된 장소</b>에서 만나요. 개인 집이나 차량으로 이동하는 만남은 안내하지 않아요.
      </Note>
      <TabBar active="meet" />
    </main>
  )
}

// ── 도움 ──

export function Help() {
  const { g, profile } = useGroup()
  return (
    <main className="page page--tabbed">
      <TopBar />
      <h1 className="h1">도움이 필요하세요?</h1>

      <div className="menu">
        <button className="menu__item menu__item--alert" onClick={() => go('report')}>
          <span aria-hidden>🚩</span>
          <span>
            <b>불편한 일 알리기</b>
            <small>돈 이야기, 물건 권유, 원하지 않는 연락</small>
          </span>
        </button>
        <button className="menu__item" onClick={() => showToast('데모에서는 실제로 전화가 걸리지 않아요')}>
          <span aria-hidden>📞</span>
          <span>
            <b>진행자에게 전화하기</b>
            <small>{g?.host} 님 · 평일 오전 9시~오후 6시</small>
          </span>
        </button>
        <button className="menu__item" onClick={() => go('leave')}>
          <span aria-hidden>🚪</span>
          <span>
            <b>모임 나가기</b>
            <small>이유는 묻지 않아요</small>
          </span>
        </button>
      </div>

      <div className="card mine">
        <p className="eyebrow">내 정보</p>
        <p>
          {profile.name} · {profile.dong}
        </p>
        <p className="fine">전화번호는 내가 공개하기로 한 경우에만 모임 분들께 보여요.</p>
      </div>

      <Note>
        <b>또봄의 약속</b>
        <br />
        돈을 모으거나 주고받지 않아요. 출석 점수나 순위가 없어요. 안부에 답이 없다고 해서 가족에게 알리거나 이상이 있다고 판단하지 않아요.
      </Note>
      <ResetLink />
      <TabBar active="help" />
    </main>
  )
}

export function ReportScreen() {
  const { g, me } = useGroup()
  const [reason, setReason] = useState<string>('')
  const [about, setAbout] = useState<string>('')
  const names = g?.members.map((m) => m.name) ?? []

  return (
    <main className="page">
      <TopBar back="help" />
      <h1 className="h1">어떤 일이 있었나요?</h1>
      <div className="choice-list">
        {REPORT_REASONS.map((r) => (
          <button key={r} className={`choice ${reason === r ? 'on' : ''}`} aria-pressed={reason === r} onClick={() => setReason(r)}>
            {r}
          </button>
        ))}
      </div>

      <fieldset className="field">
        <legend className="field__label">누구와 관련된 일인가요? (선택)</legend>
        <div className="chips">
          {[...names.filter((n) => n !== me), '말하고 싶지 않아요'].map((n) => (
            <button key={n} className={`chip ${about === n ? 'on' : ''}`} aria-pressed={about === n} onClick={() => setAbout(n)}>
              {n === '말하고 싶지 않아요' ? n : `${n} 님`}
            </button>
          ))}
        </div>
      </fieldset>

      <Note>알린 사실은 상대방에게 알려지지 않아요. 진행자가 확인한 뒤 연락드려요.</Note>
      <button className="btn btn--primary" disabled={!reason} onClick={() => submitReport(reason, about)}>
        진행자에게 알리기
      </button>
    </main>
  )
}

export function Leave() {
  const { g } = useGroup()
  return (
    <main className="page">
      <TopBar back="help" />
      <h1 className="h1">{g?.name}에서 나갈까요?</h1>
      <p className="sub">이유는 묻지 않아요. 나가도 다른 모임에 언제든 다시 들어갈 수 있어요.</p>
      <div className="spacer" />
      <button className="btn btn--outline-danger" onClick={leaveGroup}>
        네, 나갈게요
      </button>
      <button className="btn btn--primary" onClick={() => go('home')}>
        아니요, 있을게요
      </button>
    </main>
  )
}
