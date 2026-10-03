import { HOST_NAME, INTERESTS } from '../data'
import { go, setState, useStore } from '../store'
import { Note, TopBar } from '../ui'

const MAX_MEMBERS = 6
const interestLabel = (id: string) => INTERESTS.find((i) => i.id === id)?.label ?? id

export function Groups() {
  const { groups, profile, meetups } = useStore()

  // 실제 "매칭"이 아니라 단순 정렬: 고른 관심사 겹침 → 같은 동네 → 편한 시간 순
  const score = (g: (typeof groups)[number]) =>
    g.interests.filter((i) => profile.interests.includes(i)).length * 10 +
    (g.dong === profile.dong ? 5 : 0) +
    (profile.times.includes(g.time) ? 2 : 0)
  const sorted = [...groups].sort((a, b) => score(b) - score(a))

  return (
    <main className="page">
      <TopBar back="interests" />
      <h1 className="h1">{profile.dong} 근처 모임이에요</h1>
      <p className="sub">고르신 관심사와 겹치는 모임을 먼저 보여 드려요. 모임은 복지관 진행자가 꾸렸어요.</p>

      <ul className="group-list">
        {sorted.map((g) => {
          const shared = g.interests.filter((i) => profile.interests.includes(i))
          const full = g.members.length >= MAX_MEMBERS
          const m = meetups[g.id]
          return (
            <li key={g.id} className="card group-card">
              {shared.length > 0 && (
                <p className="match">✓ 관심사가 겹쳐요: {shared.map(interestLabel).join(', ')}</p>
              )}
              <h2>{g.name}</h2>
              <p className="group-card__activity">{g.activity}</p>
              <dl className="facts">
                <div>
                  <dt>언제</dt>
                  <dd>
                    {g.schedule} · {g.time}
                  </dd>
                </div>
                <div>
                  <dt>어디</dt>
                  <dd>{g.dong}</dd>
                </div>
                <div>
                  <dt>사람</dt>
                  <dd>
                    {g.members.length}명 참여 중 (최대 {MAX_MEMBERS}명)
                  </dd>
                </div>
                {m && (
                  <div>
                    <dt>첫 만남</dt>
                    <dd>
                      {m.date} {m.time}
                    </dd>
                  </div>
                )}
              </dl>
              <button
                className="btn btn--primary"
                disabled={full}
                onClick={() => {
                  setState((s) => ({ ...s, groupId: g.id }))
                  go('welcome')
                }}
              >
                {full ? '자리가 다 찼어요' : '이 모임에 들어갈래요'}
              </button>
            </li>
          )
        })}
      </ul>
      <Note>마음에 드는 모임이 없으면 복지관 진행자({HOST_NAME} 님)에게 새 모임을 제안할 수 있어요.</Note>
    </main>
  )
}

export function Welcome() {
  const { groups, groupId, meetups } = useStore()
  const g = groups.find((x) => x.id === groupId)
  if (!g) return null
  const m = meetups[g.id]

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
      <p className="sub center">
        {g.members.map((x) => `${x.name} 님`).join(', ')}과 함께해요.
      </p>

      {m && (
        <div className="card meet-card">
          <p className="eyebrow">첫 만남</p>
          <p className="meet-card__when">
            {m.date} {m.time}
          </p>
          <p className="meet-card__where">📍 {m.place}</p>
        </div>
      )}

      <ul className="promise">
        <li>
          <span aria-hidden>👥</span> 첫 만남은 사람 많은 <b>공개된 곳</b>에서 해요
        </li>
        <li>
          <span aria-hidden>🙋</span> 진행자 <b>{g.host} 님</b>이 함께 나가요
        </li>
        <li>
          <span aria-hidden>🚫</span> 또봄에서는 <b>돈을 주고받지 않아요</b>. 물건 권유도 안 돼요
        </li>
      </ul>

      <button className="btn btn--primary" onClick={() => go('home')}>
        우리 모임 보러 가기
      </button>
    </main>
  )
}
