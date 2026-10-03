import { useState } from 'react'
import { DONGS, HOST_NAME, HOST_TYPE, INTERESTS, PUBLIC_PLACES, type Program } from '../data'
import {
  go,
  joinGroup,
  openGroup,
  openProgram,
  submitProposal,
  toggleEnroll,
  useStore,
  type Proposal,
} from '../store'
import { AvatarStack, Buddy, DateBlock, DemoTag, Note, TabBar, TopBar } from '../ui'

type Filter = 'all' | 'class' | 'group' | 'shop' | string
const KINDS: { id: Filter; label: string; emoji: string }[] = [
  { id: 'all', label: '전체', emoji: '🏘️' },
  { id: 'class', label: '강좌', emoji: '🎓' },
  { id: 'group', label: '모임', emoji: '👥' },
  { id: 'shop', label: '동네 가게', emoji: '🏪' },
]
const CATEGORIES = [...KINDS, ...INTERESTS.map((i) => ({ id: i.id, label: i.label, emoji: i.emoji }))]

const isFull = (p: Program) => p.taken >= p.capacity

/** 둘러보기: 위치 헤더 → 카테고리 → 목록 → 떠 있는 제안 버튼 */
export function Explore() {
  const { profile } = useStore()
  return (
    <main className="page page--tabbed page--list">
      <header className="loc-bar">
        <span className="loc">📍 {profile.dong || '우리 동네'}</span>
        <span className="demo-pill">데모</span>
      </header>
      <div className="bridge mx">
        <span className="bridge__step">
          <span aria-hidden>🎓</span>
          <span>강좌 듣고</span>
        </span>
        <span aria-hidden>→</span>
        <span className="bridge__step">
          <span aria-hidden>👥</span>
          <span>같은 반 모임</span>
        </span>
        <span aria-hidden>→</span>
        <span className="bridge__step">
          <span aria-hidden>💌</span>
          <span>안부·다음 만남</span>
        </span>
      </div>
      <ProgramList />
      <TabBar active="explore" />
    </main>
  )
}

function ProgramList() {
  const { programs, profile, enrolled, groupIds, groups, proposals } = useStore()
  const [filter, setFilter] = useState<Filter>('all')

  // 실제 "매칭"이 아니라 단순 정렬: 새로 올라옴 → 고른 관심사 겹침 → 같은 동네 → 편한 시간 순
  const score = (p: Program) =>
    (p.isNew ? 100 : 0) +
    p.interests.filter((i) => profile.interests.includes(i)).length * 10 +
    (p.dong === profile.dong ? 5 : 0) +
    (profile.times.includes(p.time) ? 2 : 0)

  const list = programs
    .filter((p) =>
      filter === 'all' ? true : filter === 'shop' ? p.hostType === 'shop' : filter === 'class' || filter === 'group' ? p.kind === filter : p.interests.includes(filter),
    )
    .sort((a, b) => score(b) - score(a))
  const mine = proposals.filter((p) => p.by === (profile.name || '나'))

  return (
    <>
      <div className="cat-row" role="tablist" aria-label="종류">
        {CATEGORIES.map((c) => (
          <button key={c.id} role="tab" aria-selected={filter === c.id} className={filter === c.id ? 'on' : ''} onClick={() => setFilter(c.id)}>
            <span className="cat-row__icon" aria-hidden>
              {c.emoji}
            </span>
            {c.label}
          </button>
        ))}
      </div>

      <p className="list-head">
        {profile.dong} 근처 · 관심사 맞는 순 <span>모두 진행자가 확인했어요</span>
      </p>

      {list.length === 0 && <p className="fine pad">아직 이 종류는 없어요. 직접 제안해 보세요!</p>}
      <ul className="rows">
        {list.map((p) => {
          const joined = p.kind === 'group' ? groupIds.includes(p.groupId ?? '') : enrolled.includes(p.id)
          const shared = p.interests.some((i) => profile.interests.includes(i))
          const g = groups.find((x) => x.id === p.groupId)
          const follow = p.kind === 'class' && p.groupId ? programs.find((x) => x.kind === 'group' && x.groupId === p.groupId) : undefined
          return (
            <li key={p.id}>
              <button className="row-item" onClick={() => openProgram(p.id)}>
                <span className={`thumb thumb--${p.kind}`} aria-hidden>
                  {p.emoji}
                </span>
                <span className="row-item__body">
                  <span className="row-item__title">{p.title}</span>
                  <span className="row-item__desc">{p.desc}</span>
                  <span className="row-item__meta">
                    {p.dong} · {p.kind === 'group' ? '멤버' : '신청'} {p.taken}/{p.capacity} · {p.cost.split(' (')[0]}
                  </span>
                  {follow && <span className="row-item__next">→ 끝나면 {follow.title}으로 이어져요</span>}
                  <span className="badges">
                    <span className={`badge-kind badge-kind--${p.kind}`}>{p.kind === 'class' ? '강좌' : '모임'}</span>
                    <span className={`badge-host badge-host--${p.hostType}`}>{HOST_TYPE[p.hostType].label}</span>
                    {p.isNew && <span className="badge-new">새로 올라옴</span>}
                    {shared && <span className="badge-match">관심사</span>}
                    {joined && <span className="badge-joined">✓ {p.kind === 'group' ? '가입함' : '신청함'}</span>}
                    {!joined && isFull(p) && <span className="badge-host">자리 없음</span>}
                  </span>
                </span>
                {p.kind === 'group' && g && g.members.length > 0 && (
                  <span className="row-item__side">
                    <AvatarStack names={g.members.map((m) => m.name)} max={2} />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {mine.length > 0 && (
        <section className="card mx">
          <p className="eyebrow">내가 보낸 제안</p>
          <ul className="mini-list">
            {mine.map((p) => (
              <li key={p.id}>
                <span>{p.title}</span>
                <span className={`pill pill--${p.status === 'approved' ? 'yes' : p.status === 'declined' ? 'no' : 'none'}`}>
                  {p.status === 'approved' ? '올라갔어요' : p.status === 'declined' ? '이번엔 어려워요' : '확인 중'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="fab" onClick={() => go('propose')}>
        <span aria-hidden>＋</span> 제안하기
      </button>
    </>
  )
}

export function ProgramDetail() {
  const { programs, programId, enrolled, groupIds, groups, meetups, profile } = useStore()
  const p = programs.find((x) => x.id === programId)
  if (!p) return null
  const isClass = p.kind === 'class'
  const joined = isClass ? enrolled.includes(p.id) : groupIds.includes(p.groupId ?? '')
  const next = isClass && p.groupId ? programs.find((x) => x.kind === 'group' && x.groupId === p.groupId) : undefined
  const group = groups.find((g) => g.id === p.groupId)
  const members = group ? [...group.members.map((m) => m.name), ...(groupIds.includes(group.id) ? [profile.name || '나'] : [])] : []
  const upcoming = !isClass && group ? (meetups[group.id] ?? []) : []
  const paid = !p.cost.startsWith('무료')

  return (
    <main className="page page--cta">
      <div className={`cover cover--${p.kind}`}>
        <button className="cover__back" onClick={() => go('explore')} aria-label="이전으로">
          ←
        </button>
        <span aria-hidden>{p.emoji}</span>
      </div>
      <span className="badges">
        <span className={`badge-kind badge-kind--${p.kind}`}>{isClass ? '강좌' : '모임'}</span>
        <span className={`badge-host badge-host--${p.hostType}`}>
          {HOST_TYPE[p.hostType].emoji} {HOST_TYPE[p.hostType].label}
        </span>
      </span>
      <h1 className="h1">{p.title}</h1>
      <p className="row-item__meta">
        {p.dong} · {isClass ? '신청' : '멤버'} {p.taken}/{p.capacity}명
      </p>
      <p>{p.desc}</p>

      {!isClass && members.length > 0 && (
        <div className="member-strip">
          <AvatarStack names={members} max={5} />
          <span>
            {members.slice(0, 2).map((n) => `${n} 님`).join(', ')}
            {members.length > 2 && ` 외 ${members.length - 2}명`}이 함께해요
          </span>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="section">
          <h2 className="h2">다가오는 일정</h2>
          {upcoming.slice(0, 2).map((m) => (
            <div key={m.id} className="card sched">
              <DateBlock date={m.date} />
              <span>
                <b>{m.activity}</b>
                <small>
                  {m.time} · {m.place}
                </small>
              </span>
            </div>
          ))}
        </section>
      )}

      <dl className="card facts facts--detail">
        <div>
          <dt>언제</dt>
          <dd>{p.schedule}</dd>
        </div>
        <div>
          <dt>어디</dt>
          <dd>{p.place}</dd>
        </div>
        <div>
          <dt>비용</dt>
          <dd>{p.cost}</dd>
        </div>
      </dl>

      <div className="card host-card">
        <p className="eyebrow">{isClass ? '알려 주시는 분' : '이끄는 분'}</p>
        <p className="host-card__name">{p.hostName}</p>
        <p className="host-card__intro">“{p.hostIntro}”</p>
      </div>

      {next && (
        <div className="card next-group">
          <span className="eyebrow">강좌가 끝나면</span>
          <span>
            같은 반 분들과 <b>{next.title}</b>으로 계속 만날 수 있어요. 진행자가 첫 만남까지 함께해요.
          </span>
          {joined && group && !groupIds.includes(group.id) ? (
            <button className="btn btn--primary" onClick={() => joinGroup(group.id)}>
              이 모임에도 미리 들어가기
            </button>
          ) : joined && group ? (
            <button className="btn btn--soft" onClick={() => openGroup(group.id)}>
              ✓ 들어가 있어요 · 모임 보기
            </button>
          ) : (
            <button className="btn btn--soft" onClick={() => openProgram(next.id)}>
              어떤 모임인지 보기 →
            </button>
          )}
        </div>
      )}

      {p.hostType === 'shop' && (
        <Note tone="warm">
          가게에서 물건 구매를 권하지 않기로 약속했어요. 비용은 위에 적힌 재료비뿐이에요. 다른 권유를 받으면 ‘도움 → 불편한 일 알리기’로 알려 주세요.
        </Note>
      )}
      {isClass && paid && <p className="fine">앱에서는 결제하지 않아요. 재료비는 현장에서 직접 내요.</p>}

      <div className="cta-bar">
        <span className="cta-bar__info">
          <b>{p.cost.split(' (')[0]}</b>
          <small>{isFull(p) ? '자리 없음' : `${p.capacity - p.taken}자리 남음`}</small>
        </span>
        {isClass ? (
          <button className={`btn ${joined ? 'btn--ghost' : 'btn--primary'}`} disabled={!joined && isFull(p)} onClick={() => toggleEnroll(p.id)}>
            {joined ? '신청 취소' : isFull(p) ? '마감' : '신청하기'}
          </button>
        ) : joined && group ? (
          <button className="btn btn--primary" onClick={() => openGroup(group.id)}>
            내 모임으로
          </button>
        ) : (
          <button className="btn btn--primary" disabled={isFull(p) || !group} onClick={() => group && joinGroup(group.id)}>
            {isFull(p) ? '마감' : '가입하기'}
          </button>
        )}
      </div>
    </main>
  )
}

const ROLES: { id: Proposal['hostType']; kind: Proposal['kind']; emoji: string; title: string; desc: string }[] = [
  { id: 'neighbor', kind: 'group', emoji: '🙋', title: '동네 주민', desc: '같이 할 모임을 열고 싶어요' },
  { id: 'instructor', kind: 'class', emoji: '🧑‍🏫', title: '이웃 강사', desc: '내가 아는 것을 가르쳐 드리고 싶어요' },
  { id: 'shop', kind: 'class', emoji: '🏪', title: '동네 가게·공방', desc: '우리 가게에서 강좌를 열고 싶어요' },
]

const EXAMPLES: Record<Proposal['hostType'], Partial<Form>> = {
  neighbor: { title: '아침 체조 후 차 한 잔', desc: '공원에서 가볍게 몸 풀고 정자에서 이야기 나눠요.', schedule: '매주 수요일 오전 9시' },
  instructor: { title: '집에서 하는 간단한 수리', desc: '수도꼭지 고무, 문고리 같은 걸 직접 고쳐 봐요. 은퇴 전 30년 동안 설비 일을 했어요.', schedule: '11월 매주 목요일 오후 2시 · 3회' },
  shop: { shop: '망원 동네책방', title: '그림책 소리 내어 읽기', desc: '손주에게 읽어 주고 싶은 그림책을 함께 골라 소리 내어 읽어요.', schedule: '11월 둘째 토요일 오전 11시 · 1회' },
}

type Form = { title: string; desc: string; shop: string; place: string; schedule: string; capacity: number; paid: boolean; fee: string }

export function Propose() {
  const { profile } = useStore()
  const [role, setRole] = useState<Proposal['hostType'] | null>(null)
  const [dong, setDong] = useState(profile.dong || DONGS[0])
  const [f, setF] = useState<Form>({ title: '', desc: '', shop: '', place: '', schedule: '', capacity: 6, paid: false, fee: '' })
  const set = (patch: Partial<Form>) => setF((x) => ({ ...x, ...patch }))
  const r = ROLES.find((x) => x.id === role)
  const places = PUBLIC_PLACES[dong] ?? []
  const ok = r && f.title.trim() && f.desc.trim() && f.schedule.trim() && (role === 'shop' ? f.shop.trim() : f.place)

  return (
    <main className="page">
      <TopBar back="explore" />
      <h1 className="h1">강좌·모임 제안하기</h1>
      <p className="sub">제안은 복지관 진행자({HOST_NAME} 님)가 확인한 뒤 둘러보기에 올라가요.</p>

      <fieldset className="field">
        <legend className="field__label">누구로 제안하시나요?</legend>
        <div className="choice-list">
          {ROLES.map((x) => (
            <button key={x.id} className={`role ${role === x.id ? 'on' : ''}`} aria-pressed={role === x.id} onClick={() => setRole(x.id)}>
              <span aria-hidden>{x.emoji}</span>
              <span>
                <b>{x.title}</b>
                <small>{x.desc}</small>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {r && (
        <>
          <button className="link-btn" onClick={() => set(EXAMPLES[r.id])}>
            예시로 채워 보기
          </button>

          {role === 'shop' && (
            <label className="field">
              <span className="field__label">가게 이름</span>
              <input className="input" value={f.shop} placeholder="예: 들꽃상회" onChange={(e) => set({ shop: e.target.value })} />
            </label>
          )}
          <label className="field">
            <span className="field__label">{r.kind === 'group' ? '모임 이름' : '강좌 이름'}</span>
            <input className="input" value={f.title} placeholder={r.kind === 'group' ? '예: 아침 산책 모임' : '예: 처음 해 보는 뜨개질'} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label className="field">
            <span className="field__label">무엇을 하나요?</span>
            <textarea className="input textarea" rows={3} value={f.desc} placeholder="한두 줄이면 충분해요" onChange={(e) => set({ desc: e.target.value })} />
          </label>
          <fieldset className="field">
            <legend className="field__label">어느 동네예요?</legend>
            <div className="chips">
              {DONGS.map((d) => (
                <button key={d} className={`chip ${dong === d ? 'on' : ''}`} onClick={() => (setDong(d), set({ place: '' }))}>
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          {role !== 'shop' && (
            <fieldset className="field">
              <legend className="field__label">어디서 만나요?</legend>
              <small className="field__hint">처음 보는 분들과 만나니 공개된 장소만 고를 수 있어요.</small>
              <div className="choice-list">
                {places.map((pl) => (
                  <button key={pl} className={`choice ${f.place === pl ? 'on' : ''}`} onClick={() => set({ place: pl })}>
                    {pl}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <label className="field">
            <span className="field__label">언제 해요?</span>
            <input className="input" value={f.schedule} placeholder="예: 매주 목요일 오후 2시" onChange={(e) => set({ schedule: e.target.value })} />
          </label>
          <fieldset className="field">
            <legend className="field__label">몇 명까지요?</legend>
            <div className="chips">
              {[4, 6, 8, 10].map((n) => (
                <button key={n} className={`chip ${f.capacity === n ? 'on' : ''}`} onClick={() => set({ capacity: n })}>
                  {n}명
                </button>
              ))}
            </div>
          </fieldset>
          {r.kind === 'class' && (
            <fieldset className="field">
              <legend className="field__label">재료비가 있나요?</legend>
              <div className="chips">
                <button className={`chip ${!f.paid ? 'on' : ''}`} onClick={() => set({ paid: false })}>
                  무료
                </button>
                <button className={`chip ${f.paid ? 'on' : ''}`} onClick={() => set({ paid: true })}>
                  재료비 있어요
                </button>
              </div>
              {f.paid && (
                <input className="input" inputMode="numeric" value={f.fee} placeholder="1인 금액 (원)" onChange={(e) => set({ fee: e.target.value.replace(/\D/g, '') })} />
              )}
            </fieldset>
          )}

          <Note tone="warm">
            <b>이런 제안은 올리지 않아요</b>
            <br />
            물건 판매·가입 권유가 목적인 강좌, 회비를 모으는 모임, 개인 집에서 만나는 모임
          </Note>

          <button
            className="btn btn--primary"
            disabled={!ok}
            onClick={() =>
              r &&
              submitProposal({
                hostType: r.id,
                kind: r.kind,
                title: f.title.trim(),
                desc: f.desc.trim(),
                shop: f.shop.trim(),
                place: role === 'shop' ? f.shop.trim() : f.place,
                dong,
                schedule: f.schedule.trim(),
                capacity: f.capacity,
                cost: f.paid && f.fee ? `재료비 ${Number(f.fee).toLocaleString()}원 (현장에서 직접)` : '무료',
              })
            }
          >
            진행자에게 제안 보내기
          </button>
        </>
      )}
    </main>
  )
}

export function Welcome() {
  const { groups, groupId, meetups } = useStore()
  const g = groups.find((x) => x.id === groupId)
  if (!g) return null
  const m = meetups[g.id]?.[0]

  return (
    <main className="page page--welcome">
      <TopBar />
      <div className="welcome-badge">
        <Buddy mood="wave" size={170} />
      </div>
      <h1 className="h1 center">
        {g.name}에
        <br />
        들어왔어요
      </h1>
      {g.members.length > 0 && (
        <p className="sub center">{g.members.map((x) => `${x.name} 님`).join(', ')}과 함께해요.</p>
      )}

      {m && (
        <div className="card meet-card">
          <p className="eyebrow">다음 만남</p>
          <p className="meet-card__when">
            {m.date} {m.time}
          </p>
          <p className="meet-card__where">📍 {m.place}</p>
        </div>
      )}

      <ul className="promise">
        <li>
          <span aria-hidden>👥</span>
          <span>
            처음 만남은 사람 많은 <b>공개된 곳</b>에서 해요
          </span>
        </li>
        <li>
          <span aria-hidden>🙋</span>
          <span>
            진행자 <b>{g.host} 님</b>이 함께 나가요
          </span>
        </li>
        <li>
          <span aria-hidden>🚫</span>
          <span>
            모임원끼리 <b>돈을 주고받지 않아요</b>. 물건 권유도 안 돼요
          </span>
        </li>
      </ul>

      <button className="btn btn--primary" onClick={() => go('home')}>
        우리 모임 보러 가기
      </button>
    </main>
  )
}
