import { useState, type FormEvent } from 'react'
import { DONGS, HOST_NAME, HOST_ORG, INTERESTS, TIMES } from '../data'
import { addGroup, markReportSeen, saveMeetup, useStore } from '../store'
import { DemoTag, ResetLink } from '../ui'

// 진행자(복지관 담당자)용 최소 화면. 개인별 안부 기록은 보여 주지 않습니다.
export function Host() {
  const s = useStore()
  const [gid, setGid] = useState(s.groups[0]?.id ?? '')
  const g = s.groups.find((x) => x.id === gid) ?? s.groups[0]
  const newReports = s.reports.filter((r) => r.status === 'new').length

  const membersOf = (groupId: string) => {
    const base = s.groups.find((x) => x.id === groupId)?.members.length ?? 0
    return base + (s.groupId === groupId ? 1 : 0)
  }

  return (
    <main className="host">
      <header className="host__bar">
        <div className="brand">
          <span className="brand__mark" aria-hidden />
          또봄 <small>진행자</small>
        </div>
        <span className="demo-pill">데모</span>
      </header>
      <p className="host__who">
        {HOST_NAME} 님 · {HOST_ORG}
      </p>
      <a className="host-link" href="#/">
        ← 회원 화면으로
      </a>

      <section className="host__section">
        <h2 className="h2">
          들어온 신고 {newReports > 0 && <span className="badge">{newReports}</span>}
        </h2>
        {s.reports.length === 0 ? (
          <p className="fine">아직 들어온 신고가 없어요. 회원 화면 → 도움 → 불편한 일 알리기로 시연해 보세요.</p>
        ) : (
          <ul className="host-list">
            {s.reports.map((r) => (
              <li key={r.id} className={`card report ${r.status}`}>
                <p>
                  <b>{r.reason}</b>
                </p>
                <p className="fine">
                  {s.groups.find((x) => x.id === r.groupId)?.name ?? '모임 없음'} · 관련: {r.about || '선택 안 함'} · {r.when}
                </p>
                {r.status === 'new' ? (
                  <button className="btn btn--soft" onClick={() => markReportSeen(r.id)}>
                    확인했어요
                  </button>
                ) : (
                  <p className="fine">✓ 확인함</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="fine">대응 순서(안): 신고자 연락 → 사실 확인 → 경고 또는 모임에서 내보내기. 신고자 정보는 상대에게 알리지 않아요.</p>
      </section>

      <section className="host__section">
        <h2 className="h2">모임 현황</h2>
        <div className="chips">
          {s.groups.map((x) => (
            <button key={x.id} className={`chip ${x.id === g?.id ? 'on' : ''}`} onClick={() => setGid(x.id)}>
              {x.name}
            </button>
          ))}
        </div>
        {g && <GroupPanel key={g.id} groupId={g.id} memberCount={membersOf(g.id)} />}
        <p className="fine">개인별 안부 기록이나 마지막 접속 시간은 진행자에게도 보이지 않아요.</p>
      </section>

      <section className="host__section">
        <h2 className="h2">새 모임 만들기</h2>
        <NewGroupForm />
      </section>

      <ResetLink />
    </main>
  )
}

function GroupPanel({ groupId, memberCount }: { groupId: string; memberCount: number }) {
  const s = useStore()
  const m = s.meetups[groupId]
  const answers = Object.values(m ? (s.rsvps[m.id] ?? {}) : {})
  const yes = answers.filter((a) => a === 'yes').length
  const no = answers.filter((a) => a === 'no').length

  const [form, setForm] = useState({
    date: m?.date ?? '',
    time: m?.time ?? '',
    place: m?.place ?? '',
    activity: m?.activity ?? '',
    bring: m?.bring ?? '',
    hostComing: m?.hostComing ?? true,
  })
  const [saved, setSaved] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    saveMeetup(groupId, form)
    setSaved(true)
  }

  return (
    <div className="card">
      <div className="stats">
        <div>
          <b>{memberCount}</b>
          <span>모임원</span>
        </div>
        <div>
          <b>{yes}</b>
          <span>갈게요</span>
        </div>
        <div>
          <b>{no}</b>
          <span>못 가요</span>
        </div>
        <div>
          <b>{Math.max(memberCount - yes - no, 0)}</b>
          <span>아직</span>
        </div>
      </div>
      <p className="fine">
        참석 응답 집계 <DemoTag>예시 데이터 포함</DemoTag>
      </p>

      <form className="host-form" onSubmit={submit}>
        <p className="field__label">다음 만남 등록·수정</p>
        {(
          [
            ['date', '날짜', '10월 27일 (화)'],
            ['time', '시간', '오전 10시'],
            ['place', '장소 (공개된 곳)', '망원한강공원 망원나들목 입구'],
            ['activity', '활동', '단풍 사진 찍기'],
            ['bring', '준비물', '휴대폰'],
          ] as const
        ).map(([k, label, ph]) => (
          <label key={k} className="field">
            <span className="field__hint">{label}</span>
            <input
              className="input input--sm"
              required={k !== 'bring'}
              value={form[k]}
              placeholder={ph}
              onChange={(e) => {
                setForm({ ...form, [k]: e.target.value })
                setSaved(false)
              }}
            />
          </label>
        ))}
        <label className="check">
          <input type="checkbox" checked={form.hostComing} onChange={(e) => setForm({ ...form, hostComing: e.target.checked })} />
          진행자가 함께 나가요
        </label>
        <button className="btn btn--primary">저장하기</button>
        {saved && <p className="fine">✓ 저장했어요. 회원 화면의 ‘만남’ 탭에 바로 보여요. (실제 문자 알림은 보내지 않아요)</p>}
      </form>
    </div>
  )
}

function NewGroupForm() {
  const [name, setName] = useState('')
  const [dong, setDong] = useState<string>(DONGS[0])
  const [interest, setInterest] = useState<string>(INTERESTS[0].id)
  const [time, setTime] = useState<string>(TIMES[0])
  const [schedule, setSchedule] = useState('격주 수요일')
  const [activity, setActivity] = useState('')
  const [done, setDone] = useState(false)

  return (
    <form
      className="card host-form"
      onSubmit={(e) => {
        e.preventDefault()
        addGroup({ name, dong, interests: [interest], time, schedule, activity })
        setName('')
        setActivity('')
        setDone(true)
      }}
    >
      <label className="field">
        <span className="field__hint">모임 이름</span>
        <input className="input input--sm" required value={name} placeholder="연남 노래 모임" onChange={(e) => (setName(e.target.value), setDone(false))} />
      </label>
      <label className="field">
        <span className="field__hint">활동 한 줄</span>
        <input className="input input--sm" required value={activity} placeholder="좋아하는 옛 노래 함께 부르기" onChange={(e) => setActivity(e.target.value)} />
      </label>
      <div className="row">
        <label className="field">
          <span className="field__hint">동네</span>
          <select className="input input--sm" value={dong} onChange={(e) => setDong(e.target.value)}>
            {DONGS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__hint">관심사</span>
          <select className="input input--sm" value={interest} onChange={(e) => setInterest(e.target.value)}>
            {INTERESTS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <label className="field">
          <span className="field__hint">주기</span>
          <input className="input input--sm" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__hint">시간대</span>
          <select className="input input--sm" value={time} onChange={(e) => setTime(e.target.value)}>
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <button className="btn btn--primary">모임 만들기</button>
      {done && <p className="fine">✓ 만들었어요. 회원 화면의 모임 목록에 보여요.</p>}
    </form>
  )
}
