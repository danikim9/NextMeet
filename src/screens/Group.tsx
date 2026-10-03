import { useState } from 'react'
import { MEET_DATES, MEET_TIMES, PUBLIC_PLACES, REPORT_REASONS, type Meetup } from '../data'
import {
  go,
  leaveGroup,
  openProgram,
  proposeMeetup,
  replyTo,
  sendCheckin,
  setRsvp,
  showToast,
  submitReport,
  switchGroup,
  useStore,
  type Checkin,
  type CheckinKind,
  type ReplyKind,
} from '../store'
import { AvatarStack, CHECKIN, DateBlock, DemoTag, Note, REPLY, ResetLink, TabBar, TopBar } from '../ui'

function useGroup() {
  const s = useStore()
  const g = s.groups.find((x) => x.id === s.groupId && s.groupIds.includes(x.id))
  const me = s.profile.name || '나'
  const meetups = g ? (s.meetups[g.id] ?? []) : []
  return { ...s, g, me, meetups }
}

function GroupSwitcher() {
  const { groups, groupIds, groupId } = useStore()
  if (groupIds.length < 2) return null
  return (
    <div className="switcher" role="tablist" aria-label="내 모임 고르기">
      {groupIds.map((id) => {
        const g = groups.find((x) => x.id === id)
        return (
          <button key={id} role="tab" aria-selected={id === groupId} className={id === groupId ? 'on' : ''} onClick={() => switchGroup(id)}>
            {g?.name}
          </button>
        )
      })}
    </div>
  )
}

function NoGroup({ active }: { active: 'home' | 'meet' }) {
  return (
    <main className="page page--tabbed">
      <TopBar />
      <h1 className="h1">{active === 'home' ? '내 모임' : '만남'}</h1>
      <div className="empty">
        <span aria-hidden>🌱</span>
        <p>아직 들어간 모임이 없어요.</p>
        <p className="fine">둘러보기에서 동네 모임을 찾아보세요. 강좌를 들은 뒤 같은 반 분들과 모임으로 이어 갈 수도 있어요.</p>
      </div>
      <button className="btn btn--primary" onClick={() => go('explore')}>
        모임 둘러보기
      </button>
      <MyClasses />
      <TabBar active={active} />
    </main>
  )
}

function MyClasses() {
  const { programs, enrolled, groupIds } = useStore()
  const list = programs.filter((p) => enrolled.includes(p.id))
  const followOf = (groupId?: string) => programs.find((x) => x.kind === 'group' && x.groupId === groupId)
  if (list.length === 0) return null
  return (
    <>
      <h2 className="h2">신청한 강좌</h2>
      <ul className="mini-cards">
        {list.map((p) => (
          <li key={p.id}>
            <button className="card mini-card" onClick={() => openProgram(p.id)}>
              <span aria-hidden>{p.emoji}</span>
              <span>
                <b>{p.title}</b>
                <small>{p.schedule}</small>
                {p.groupId && followOf(p.groupId) && (
                  <small className="mini-card__next">
                    {groupIds.includes(p.groupId) ? '✓ 같은 반 모임에도 들어가 있어요' : `끝나면 ${followOf(p.groupId)?.title}으로 이어져요 →`}
                  </small>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

const rsvpLabel = (v?: 'yes' | 'no') => (v === 'yes' ? '✓ 간다고 했어요' : v === 'no' ? '이번엔 못 간다고 했어요' : '갈 수 있는지 알려 주세요 →')

// ── 내 모임 (홈) ──

export function Home() {
  const { g, me, meetups, rsvps, checkins } = useGroup()
  if (!g) return <NoGroup active="home" />
  const feed = checkins.filter((c) => c.groupId === g.id)
  const next = meetups[0]

  return (
    <main className="page page--tabbed">
      <TopBar />
      <p className="hello">{me} 님, 반가워요</p>
      <GroupSwitcher />
      <div className="group-head">
        <h1 className="h1">{g.name}</h1>
        <div className="member-strip">
          <AvatarStack names={[me, ...g.members.map((m) => m.name)]} max={5} />
          <span>
            {g.dong} · 멤버 {g.members.length + 1}명
          </span>
        </div>
      </div>

      {next ? (
        <button className="card meet-card meet-card--link" onClick={() => go('meet')}>
          <p className="eyebrow">다음 만남{next.proposedBy && ` · ${next.proposedBy === me ? '내가' : `${next.proposedBy} 님`} 제안`}</p>
          <span className="sched sched--bare">
            <DateBlock date={next.date} />
            <span>
              <b>{next.activity}</b>
              <small>
                {next.time} · {next.place}
              </small>
            </span>
          </span>
          <p className="meet-card__status">{rsvpLabel(rsvps[next.id]?.[me])}</p>
        </button>
      ) : (
        <button className="card meet-card meet-card--link" onClick={() => go('proposeMeet')}>
          <p className="eyebrow">다음 만남</p>
          <p className="meet-card__when">아직 정해지지 않았어요</p>
          <p className="meet-card__status">내가 먼저 제안해 볼까요? →</p>
        </button>
      )}

      <button className="btn btn--primary btn--xl" onClick={() => go('send')}>
        <span aria-hidden>💌</span> 오늘 안부 전하기
      </button>

      <h2 className="h2">모임 분들의 안부</h2>
      {feed.length === 0 ? (
        <p className="fine">아직 안부가 없어요. 첫 안부를 전해 보세요.</p>
      ) : (
        <ul className="feed">
          {feed.map((c) => (
            <CheckinCard key={c.id} c={c} me={me} />
          ))}
        </ul>
      )}
      <p className="fine">답하지 않아도 괜찮아요. 또봄은 읽지 않은 사람이나 답이 없는 사람을 따로 표시하지 않아요.</p>
      <MyClasses />
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
            <p>{c.from} 님은 전화번호를 공개하지 않았어요. 응답은 전해졌으니, 다음 만남에서 반갑게 인사해 보세요.</p>
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
  const { g, me, meetups } = useGroup()
  if (!g) return <NoGroup active="meet" />

  return (
    <main className="page page--tabbed">
      <TopBar />
      <GroupSwitcher />
      <p className="eyebrow">{g.name}</p>
      <h1 className="h1">다가오는 만남</h1>

      {meetups.length === 0 && <Note>아직 정해진 만남이 없어요. 아래에서 먼저 제안해 보세요.</Note>}
      {meetups.map((m) => (
        <MeetupCard key={m.id} m={m} me={me} host={g.host} people={[me, ...g.members.map((x) => x.name)]} />
      ))}

      <button className="btn btn--ghost" onClick={() => go('proposeMeet')}>
        ＋ 다음 만남 제안하기
      </button>
      <p className="fine">모임원 누구나 만남을 제안할 수 있어요. 못 가셔도 괜찮아요. 빠진 횟수는 기록하지 않아요.</p>
      <TabBar active="meet" />
    </main>
  )
}

function MeetupCard({ m, me, host, people }: { m: Meetup; me: string; host: string; people: string[] }) {
  const { rsvps } = useStore()
  const answers = rsvps[m.id] ?? {}
  const mine = answers[me]
  const yes = people.filter((p) => answers[p] === 'yes')
  const no = people.filter((p) => answers[p] === 'no')
  const name = (p: string) => (p === me ? '나' : `${p} 님`)

  return (
    <article className="card meetup">
      <p className="eyebrow">{m.proposedBy === me ? '내가 제안한 만남' : m.proposedBy ? `${m.proposedBy} 님 제안` : '진행자가 정한 만남'}</p>
      <div className="sched sched--bare">
        <DateBlock date={m.date} />
        <span>
          <b className="meetup__title">{m.activity}</b>
          <small>
            {m.time} · {m.place}
          </small>
        </span>
      </div>
      <div className="detail">
        {m.bring && m.bring !== '없음' && (
          <p>
            <span aria-hidden>🎒</span> 준비물: {m.bring}
          </p>
        )}
        {m.hostComing && (
          <p>
            <span aria-hidden>🙋</span> 진행자 {host} 님이 함께 나와요
          </p>
        )}
      </div>
      <div className="rsvp">
        <button className={`btn btn--rsvp ${mine === 'yes' ? 'on' : ''}`} aria-pressed={mine === 'yes'} onClick={() => setRsvp(m.id, 'yes')}>
          갈게요
        </button>
        <button className={`btn btn--rsvp ${mine === 'no' ? 'on' : ''}`} aria-pressed={mine === 'no'} onClick={() => setRsvp(m.id, 'no')}>
          이번엔 못 가요
        </button>
      </div>
      <p className="who-goes">
        {yes.length > 0 && <AvatarStack names={yes} max={5} />}
        <b>
          참여 {yes.length}/{people.length}
        </b>{' '}
        {yes.length ? yes.map(name).join(', ') : '아직 없어요'}
        {no.length > 0 && (
          <>
            <br />
            <b>못 가요</b> {no.map(name).join(', ')}
          </>
        )}
        <DemoTag>예시 응답 포함</DemoTag>
      </p>
    </article>
  )
}

export function ProposeMeet() {
  const { g } = useGroup()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [place, setPlace] = useState('')
  const [activity, setActivity] = useState('')
  if (!g) return null
  const places = PUBLIC_PLACES[g.dong] ?? []

  return (
    <main className="page">
      <TopBar back="meet" />
      <h1 className="h1">다음 만남 제안하기</h1>
      <p className="sub">{g.name} 분들께 보여요. 고르기만 하면 돼요.</p>

      <fieldset className="field">
        <legend className="field__label">언제요?</legend>
        <div className="chips">
          {MEET_DATES.map((d) => (
            <button key={d} className={`chip ${date === d ? 'on' : ''}`} onClick={() => setDate(d)}>
              {d}
            </button>
          ))}
        </div>
        <div className="chips">
          {MEET_TIMES.map((t) => (
            <button key={t} className={`chip ${time === t ? 'on' : ''}`} onClick={() => setTime(t)}>
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field__label">어디서요?</legend>
        <small className="field__hint">사람이 오가는 공개된 장소만 고를 수 있어요.</small>
        <div className="choice-list">
          {places.map((p) => (
            <button key={p} className={`choice ${place === p ? 'on' : ''}`} onClick={() => setPlace(p)}>
              {p}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span className="field__label">무엇을 할까요? (선택)</span>
        <input className="input" value={activity} placeholder="예: 단풍 사진 찍기" onChange={(e) => setActivity(e.target.value)} />
      </label>

      <button
        className="btn btn--primary"
        disabled={!date || !time || !place}
        onClick={() => proposeMeetup({ date, time, place, activity: activity.trim() || '함께 걷고 이야기 나누기', bring: '' })}
      >
        모임 분들께 제안하기
      </button>
      <p className="fine center">실제 서비스에서는 모임 분들께 문자로 알려 드릴 예정이에요. (데모에서는 알림이 가지 않아요)</p>
    </main>
  )
}

// ── 도움 ──

export function Help() {
  const { g, profile, groupIds } = useGroup()
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
            <small>평일 오전 9시~오후 6시</small>
          </span>
        </button>
        <button
          className="menu__item"
          onClick={() => showToast('진행자가 동네 노인일자리 수행기관을 안내해 드려요 (데모에서는 연락이 가지 않아요)')}
        >
          <span aria-hidden>🧰</span>
          <span>
            <b>일거리 문의하기</b>
            <small>공공 노인일자리는 ‘노인일자리여기’에서도 찾아볼 수 있어요</small>
          </span>
        </button>
        <button className="menu__item" onClick={() => go('propose')}>
          <span aria-hidden>💡</span>
          <span>
            <b>강좌·모임 제안하기</b>
            <small>가르쳐 드리고 싶은 것, 같이 하고 싶은 것</small>
          </span>
        </button>
        {g && (
          <button className="menu__item" onClick={() => go('leave')}>
            <span aria-hidden>🚪</span>
            <span>
              <b>모임 나가기</b>
              <small>{g.name} · 이유는 묻지 않아요</small>
            </span>
          </button>
        )}
      </div>

      <div className="card mine">
        <p className="eyebrow">내 정보</p>
        <p>
          {profile.name} · {profile.dong} · 모임 {groupIds.length}개
        </p>
        <p className="fine">전화번호는 내가 공개하기로 한 경우에만 모임 분들께 보여요.</p>
      </div>

      <Note>
        <b>또봄의 약속</b>
        <br />
        모임원끼리 돈을 모으거나 주고받지 않아요. 출석 점수나 순위가 없어요. 안부에 답이 없다고 해서 가족에게 알리거나 이상이 있다고 판단하지 않아요.
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
          {[...names.filter((n) => n !== me), '강좌·가게', '말하고 싶지 않아요'].map((n) => (
            <button key={n} className={`chip ${about === n ? 'on' : ''}`} aria-pressed={about === n} onClick={() => setAbout(n)}>
              {names.includes(n) ? `${n} 님` : n}
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
