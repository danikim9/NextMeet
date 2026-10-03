import { useState } from 'react'
import { DONGS, HOST_NAME, HOST_TYPE, PUBLIC_PLACES, type Program } from '../data'
import { go, joinGroup, openGroup, openProgram, submitProposal, toggleEnroll, useStore, type Proposal } from '../store'
import { Note, TabBar, TopBar } from '../ui'

type Filter = 'all' | 'class' | 'group' | 'shop'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'class', label: '강좌' },
  { id: 'group', label: '모임' },
  { id: 'shop', label: '동네 가게' },
]

const isFull = (p: Program) => p.taken >= p.capacity

export function Explore() {
  const { programs, profile, enrolled, groupIds, proposals } = useStore()
  const [filter, setFilter] = useState<Filter>('all')

  // 실제 "매칭"이 아니라 단순 정렬: 고른 관심사 겹침 → 같은 동네 → 편한 시간 순
  const score = (p: Program) =>
    (p.isNew ? 100 : 0) +
    p.interests.filter((i) => profile.interests.includes(i)).length * 10 +
    (p.dong === profile.dong ? 5 : 0) +
    (profile.times.includes(p.time) ? 2 : 0)

  const list = programs
    .filter((p) => (filter === 'all' ? true : filter === 'shop' ? p.hostType === 'shop' : p.kind === filter))
    .sort((a, b) => score(b) - score(a))
  const mine = proposals.filter((p) => p.by === (profile.name || '나'))

  return (
    <main className="page page--tabbed">
      <TopBar />
      <h1 className="h1">우리 동네 배움과 모임</h1>
      <p className="sub">{profile.dong} 근처 · 고르신 관심사와 맞는 것부터 보여 드려요. 모두 복지관 진행자가 확인했어요.</p>

      <div className="segments" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <ul className="program-list">
        {list.map((p) => {
          const joined = p.kind === 'group' ? groupIds.includes(p.groupId ?? '') : enrolled.includes(p.id)
          const shared = p.interests.some((i) => profile.interests.includes(i))
          return (
            <li key={p.id}>
              <button className="card program" onClick={() => openProgram(p.id)}>
                <span className={`program__thumb program__thumb--${p.kind}`} aria-hidden>
                  {p.emoji}
                </span>
                <span className="program__body">
                  <span className="badges">
                    <span className={`badge-kind badge-kind--${p.kind}`}>{p.kind === 'class' ? '강좌' : '모임'}</span>
                    <span className={`badge-host badge-host--${p.hostType}`}>
                      {HOST_TYPE[p.hostType].emoji} {HOST_TYPE[p.hostType].label}
                    </span>
                    {p.isNew && <span className="badge-new">새로 올라옴</span>}
                    {shared && <span className="badge-match">관심사</span>}
                  </span>
                  <span className="program__title">{p.title}</span>
                  <span className="program__meta">{p.schedule}</span>
                  <span className="program__meta">📍 {p.place}</span>
                  <span className="program__foot">
                    <span>{p.cost.split(' (')[0]}</span>
                    <span className={isFull(p) ? 'full' : ''}>
                      {joined ? '✓ 신청함' : isFull(p) ? '자리 없음' : `${p.capacity - p.taken}자리 남음`}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <button className="card propose-banner" onClick={() => go('propose')}>
        <span aria-hidden>💡</span>
        <span>
          <b>가르쳐 드리고 싶은 게 있으세요?</b>
          <small>동네 가게, 이웃 강사, 주민 누구나 강좌·모임을 제안할 수 있어요</small>
        </span>
      </button>

      {mine.length > 0 && (
        <section className="card">
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
      <TabBar active="explore" />
    </main>
  )
}

export function ProgramDetail() {
  const { programs, programId, enrolled, groupIds, groups } = useStore()
  const p = programs.find((x) => x.id === programId)
  if (!p) return null
  const isClass = p.kind === 'class'
  const joined = isClass ? enrolled.includes(p.id) : groupIds.includes(p.groupId ?? '')
  const next = isClass && p.groupId ? programs.find((x) => x.kind === 'group' && x.groupId === p.groupId) : undefined
  const group = groups.find((g) => g.id === p.groupId)

  return (
    <main className="page">
      <TopBar back="explore" />
      <div className={`detail-hero detail-hero--${p.kind}`}>
        <span aria-hidden>{p.emoji}</span>
      </div>
      <span className="badges">
        <span className={`badge-kind badge-kind--${p.kind}`}>{isClass ? '강좌' : '모임'}</span>
        <span className={`badge-host badge-host--${p.hostType}`}>
          {HOST_TYPE[p.hostType].emoji} {HOST_TYPE[p.hostType].label}
        </span>
      </span>
      <h1 className="h1">{p.title}</h1>
      <p>{p.desc}</p>

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
          <dt>인원</dt>
          <dd>
            {p.capacity}명 중 {p.taken}명 {isClass ? '신청' : '참여 중'}
          </dd>
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
        <button className="card next-group" onClick={() => openProgram(next.id)}>
          <span className="eyebrow">강좌가 끝나면</span>
          <span>
            같은 반 분들과 <b>{next.title}</b>으로 계속 만날 수 있어요 →
          </span>
        </button>
      )}

      {p.hostType === 'shop' && (
        <Note tone="warm">
          가게에서 물건 구매를 권하지 않기로 약속했어요. 비용은 위에 적힌 재료비뿐이에요. 다른 권유를 받으면 ‘도움 → 불편한 일 알리기’로 알려 주세요.
        </Note>
      )}

      {isClass ? (
        <>
          <button className={`btn ${joined ? 'btn--ghost' : 'btn--primary'}`} disabled={!joined && isFull(p)} onClick={() => toggleEnroll(p.id)}>
            {joined ? '신청 취소하기' : isFull(p) ? '자리가 다 찼어요' : '이 강좌 신청하기'}
          </button>
          {p.cost !== '무료' && !p.cost.startsWith('무료') && (
            <p className="fine center">앱에서는 결제하지 않아요. 재료비는 첫날 현장에서 직접 내요.</p>
          )}
        </>
      ) : joined && group ? (
        <button className="btn btn--primary" onClick={() => openGroup(group.id)}>
          내 모임으로 가기
        </button>
      ) : (
        <button className="btn btn--primary" disabled={isFull(p) || !group} onClick={() => group && joinGroup(group.id)}>
          {isFull(p) ? '자리가 다 찼어요' : '이 모임에 들어갈래요'}
        </button>
      )}
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
      <div className="welcome-badge" aria-hidden>
        🎉
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
          <span aria-hidden>👥</span> 처음 만남은 사람 많은 <b>공개된 곳</b>에서 해요
        </li>
        <li>
          <span aria-hidden>🙋</span> 진행자 <b>{g.host} 님</b>이 함께 나가요
        </li>
        <li>
          <span aria-hidden>🚫</span> 모임원끼리 <b>돈을 주고받지 않아요</b>. 물건 권유도 안 돼요
        </li>
      </ul>

      <button className="btn btn--primary" onClick={() => go('home')}>
        우리 모임 보러 가기
      </button>
    </main>
  )
}
