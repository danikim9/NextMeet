import { useState } from 'react'
import { DEMO_INVITE_CODE, DONGS, HOST_NAME, HOST_ORG, INTERESTS, TIMES } from '../data'
import { go, setState, useStore } from '../store'
import { Buddy, Note, Steps, TopBar } from '../ui'

export function Start() {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [noCode, setNoCode] = useState(false)

  const submit = () => {
    if (code.trim() === DEMO_INVITE_CODE) go('name')
    else setError(true)
  }

  return (
    <main className="page">
      <TopBar />
      <section className="hero">
        <Buddy mood="wave" size={150} />
        <h1>
          같은 동네 다섯 명이,
          <br />
          정해진 날 <em className="scribble">또 봐요</em>
        </h1>
        <p>배운 것, 걷는 길, 사는 이야기를 나누는 작은 동네 모임이에요.</p>
      </section>

      <label className="field">
        <span className="field__label">복지관에서 받은 초대코드를 넣어 주세요</span>
        <input
          className="input input--code"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={code}
          placeholder="숫자 4자리"
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''))
            setError(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </label>
      {error && <p className="error">코드가 맞지 않아요. 카드에 적힌 숫자를 다시 확인해 주세요.</p>}
      <Note>
        데모용 초대코드: <b>{DEMO_INVITE_CODE}</b>
      </Note>

      <button className="btn btn--primary" disabled={code.length < 4} onClick={submit}>
        시작하기
      </button>
      <button className="btn btn--ghost" onClick={() => setNoCode((v) => !v)} aria-expanded={noCode}>
        초대코드가 없어요
      </button>
      {noCode && (
        <Note tone="warm">
          다니시는 복지관·문화센터 창구에 물어보세요. 직원이 옆에서 가입을 도와 드려요.
          <br />
          <small>
            예시: {HOST_ORG} · 담당 {HOST_NAME}
          </small>
        </Note>
      )}

      <a className="host-link" href="#/host">
        진행자 화면 보기 →
      </a>
    </main>
  )
}

export function NameStep() {
  const { profile } = useStore()
  const [name, setName] = useState(profile.name)
  const [dong, setDong] = useState(profile.dong)

  return (
    <main className="page">
      <TopBar back="start" />
      <Steps now={1} total={2} />
      <h1 className="h1">반가워요!</h1>

      <label className="field">
        <span className="field__label">어떻게 불러 드릴까요?</span>
        <input
          className="input"
          value={name}
          maxLength={8}
          placeholder="예: 정희"
          onChange={(e) => setName(e.target.value)}
        />
        <small className="field__hint">모임 분들에게 이 이름으로 보여요. 성은 빼도 괜찮아요.</small>
      </label>

      <fieldset className="field">
        <legend className="field__label">어느 동네에 사세요?</legend>
        <div className="chips">
          {DONGS.map((d) => (
            <button key={d} className={`chip ${dong === d ? 'on' : ''}`} aria-pressed={dong === d} onClick={() => setDong(d)}>
              {d}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="spacer" />
      <button
        className="btn btn--primary"
        disabled={!name.trim() || !dong}
        onClick={() => {
          setState((s) => ({ ...s, profile: { ...s.profile, name: name.trim(), dong } }))
          go('interests')
        }}
      >
        다음
      </button>
    </main>
  )
}

export function InterestStep() {
  const { profile } = useStore()
  const [picked, setPicked] = useState<string[]>(profile.interests)
  const [times, setTimes] = useState<string[]>(profile.times)
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <main className="page">
      <TopBar back="name" />
      <Steps now={2} total={2} />
      <h1 className="h1">해보고 싶은 것을 골라 주세요</h1>
      <p className="sub">여러 개 골라도 돼요. 나중에 바꿀 수 있어요.</p>

      <div className="interest-grid">
        {INTERESTS.map((it) => {
          const on = picked.includes(it.id)
          return (
            <button key={it.id} className={`interest ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setPicked((p) => toggle(p, it.id))}>
              <span className="interest__emoji" aria-hidden>
                {it.emoji}
              </span>
              {it.label}
              {on && <span className="interest__check" aria-hidden>✓</span>}
            </button>
          )
        })}
      </div>

      <fieldset className="field">
        <legend className="field__label">편한 시간은요?</legend>
        <div className="chips">
          {TIMES.map((t) => {
            const on = times.includes(t)
            return (
              <button key={t} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setTimes((p) => toggle(p, t))}>
                {t}
              </button>
            )
          })}
        </div>
      </fieldset>

      <button
        className="btn btn--primary"
        disabled={picked.length === 0}
        onClick={() => {
          setState((s) => ({ ...s, profile: { ...s.profile, interests: picked, times } }))
          go('explore')
        }}
      >
        강좌·모임 보러 가기
      </button>
    </main>
  )
}
