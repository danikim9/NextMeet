import { useState, type FormEvent } from 'react'
import { DONGS, HOST_NAME, HOST_ORG, HOST_TYPE, INTERESTS, PUBLIC_PLACES, TIMES } from '../data'
import { addCenterProgram, addMeetup, approveProposal, declineProposal, markReportSeen, useStore } from '../store'
import { DemoTag, ResetLink } from '../ui'

// 진행자(복지관 담당자)용 최소 화면. 개인별 안부 기록은 보여 주지 않습니다.
export function Host() {
  const s = useStore()
  const newReports = s.reports.filter((r) => r.status === 'new').length
  const pending = s.proposals.filter((p) => p.status === 'pending')

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
          제안 검토 {pending.length > 0 && <span className="badge">{pending.length}</span>}
        </h2>
        {s.proposals.length === 0 ? (
          <p className="fine">들어온 제안이 없어요. 회원 화면 → 둘러보기 → ‘가르쳐 드리고 싶은 게 있으세요?’로 시연해 보세요.</p>
        ) : (
          <ul className="host-list">
            {s.proposals.map((p) => (
              <li key={p.id} className={`card report ${p.status === 'pending' ? 'new' : ''}`}>
                <p className="fine">
                  {HOST_TYPE[p.hostType].emoji} {HOST_TYPE[p.hostType].label} · {p.kind === 'class' ? '강좌' : '모임'} · {p.by} 님 · {p.when}
                </p>
                <p>
                  <b>{p.title}</b>
                </p>
                <p>{p.desc}</p>
                <p className="fine">
                  {p.dong} · {p.place} · {p.schedule} · {p.capacity}명 · {p.cost}
                </p>
                {p.status === 'pending' ? (
                  <div className="row">
                    <button className="btn btn--ghost" onClick={() => declineProposal(p.id)}>
                      이번엔 어려워요
                    </button>
                    <button className="btn btn--primary" onClick={() => approveProposal(p.id)}>
                      둘러보기에 올리기
                    </button>
                  </div>
                ) : (
                  <p className="fine">{p.status === 'approved' ? '✓ 둘러보기에 올렸어요' : '반려했어요'}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="fine">
          확인할 것: 물건 판매·가입 권유 목적이 아닌지, 장소가 공개된 곳인지, 재료비가 적정한지, 가게·강사 연락처 확인. (데모에서는 확인 절차 없이 버튼으로 처리)
        </p>
      </section>

      <section className="host__section">
        <h2 className="h2">
          들어온 신고 {newReports > 0 && <span className="badge">{newReports}</span>}
        </h2>
        {s.reports.length === 0 ? (
          <p className="fine">아직 들어온 신고가 없어요.</p>
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
        <p className="fine">대응 순서(안): 신고자 연락 → 사실 확인 → 경고, 모임에서 내보내기 또는 가게 연계 중단. 신고자 정보는 상대에게 알리지 않아요.</p>
      </section>

      <GroupsSection />

      <section className="host__section">
        <h2 className="h2">복지관 강좌·모임 올리기</h2>
        <NewProgramForm />
      </section>

      <ResetLink />
    </main>
  )
}

function GroupsSection() {
  const s = useStore()
  const [gid, setGid] = useState(s.groups[0]?.id ?? '')
  const g = s.groups.find((x) => x.id === gid) ?? s.groups[0]
  if (!g) return null
  const memberCount = g.members.length + (s.groupIds.includes(g.id) ? 1 : 0)
  const meetups = s.meetups[g.id] ?? []

  return (
    <section className="host__section">
      <h2 className="h2">모임과 만남</h2>
      <div className="chips">
        {s.groups.map((x) => (
          <button key={x.id} className={`chip ${x.id === g.id ? 'on' : ''}`} onClick={() => setGid(x.id)}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="card">
        <p>
          <b>{g.name}</b> · 모임원 {memberCount}명
        </p>
        <ul className="mini-list">
          {meetups.length === 0 && <li className="fine">정해진 만남이 없어요.</li>}
          {meetups.map((m) => {
            const a = Object.values(s.rsvps[m.id] ?? {})
            return (
              <li key={m.id}>
                <span>
                  {m.date} {m.time} · {m.place}
                  {m.proposedBy && <small className="fine"> ({m.proposedBy} 님 제안)</small>}
                </span>
                <span className="pill pill--none">
                  갈게요 {a.filter((x) => x === 'yes').length} · 못 가요 {a.filter((x) => x === 'no').length}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="fine">
          참석 응답 집계 <DemoTag>예시 데이터 포함</DemoTag> 개인별 안부 기록이나 마지막 접속 시간은 진행자에게도 보이지 않아요.
        </p>
        <MeetupForm key={g.id} groupId={g.id} dong={g.dong} />
      </div>
    </section>
  )
}

function MeetupForm({ groupId, dong }: { groupId: string; dong: string }) {
  const places = PUBLIC_PLACES[dong] ?? []
  const empty = { date: '', time: '', place: places[0] ?? '', activity: '', bring: '', hostComing: true }
  const [form, setForm] = useState(empty)
  const [saved, setSaved] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    addMeetup(groupId, form)
    setForm(empty)
    setSaved(true)
  }

  return (
    <form className="host-form" onSubmit={submit}>
      <p className="field__label">만남 추가</p>
      <div className="row">
        <label className="field">
          <span className="field__hint">날짜</span>
          <input className="input input--sm" required value={form.date} placeholder="10월 27일 (화)" onChange={(e) => (setForm({ ...form, date: e.target.value }), setSaved(false))} />
        </label>
        <label className="field">
          <span className="field__hint">시간</span>
          <input className="input input--sm" required value={form.time} placeholder="오전 10시" onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </label>
      </div>
      <label className="field">
        <span className="field__hint">장소 (공개된 곳)</span>
        <select className="input input--sm" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })}>
          {places.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__hint">활동</span>
        <input className="input input--sm" required value={form.activity} placeholder="단풍 사진 찍기" onChange={(e) => setForm({ ...form, activity: e.target.value })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={form.hostComing} onChange={(e) => setForm({ ...form, hostComing: e.target.checked })} />
        진행자가 함께 나가요
      </label>
      <button className="btn btn--primary">만남 추가하기</button>
      {saved && <p className="fine">✓ 추가했어요. 회원 화면의 ‘만남’ 탭에 바로 보여요. (실제 문자 알림은 보내지 않아요)</p>}
    </form>
  )
}

function NewProgramForm() {
  const [kind, setKind] = useState<'class' | 'group'>('class')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [dong, setDong] = useState<string>(DONGS[0])
  const [interest, setInterest] = useState<string>(INTERESTS[0].id)
  const [time, setTime] = useState<string>(TIMES[0])
  const [schedule, setSchedule] = useState('')
  const [done, setDone] = useState(false)

  return (
    <form
      className="card host-form"
      onSubmit={(e) => {
        e.preventDefault()
        addCenterProgram({ kind, title, desc, dong, place: PUBLIC_PLACES[dong]?.[0] ?? dong, schedule, capacity: kind === 'class' ? 12 : 6, interest, time })
        setTitle('')
        setDesc('')
        setSchedule('')
        setDone(true)
      }}
    >
      <div className="chips">
        <button type="button" className={`chip ${kind === 'class' ? 'on' : ''}`} onClick={() => setKind('class')}>
          강좌
        </button>
        <button type="button" className={`chip ${kind === 'group' ? 'on' : ''}`} onClick={() => setKind('group')}>
          모임
        </button>
      </div>
      <label className="field">
        <span className="field__hint">이름</span>
        <input className="input input--sm" required value={title} placeholder={kind === 'class' ? '스마트폰으로 버스 시간 보기' : '연남 노래 모임'} onChange={(e) => (setTitle(e.target.value), setDone(false))} />
      </label>
      <label className="field">
        <span className="field__hint">한 줄 소개</span>
        <input className="input input--sm" required value={desc} onChange={(e) => setDesc(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__hint">일정</span>
        <input className="input input--sm" required value={schedule} placeholder="11월 매주 월요일 오전 10시 · 4회" onChange={(e) => setSchedule(e.target.value)} />
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
      <label className="field">
        <span className="field__hint">시간대</span>
        <select className="input input--sm" value={time} onChange={(e) => setTime(e.target.value)}>
          {TIMES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <button className="btn btn--primary">올리기</button>
      {done && <p className="fine">✓ 올렸어요. 회원 화면의 둘러보기에 보여요.</p>}
    </form>
  )
}
