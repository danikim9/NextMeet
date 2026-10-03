import { useSyncExternalStore } from 'react'
import {
  HOST_NAME,
  SEED_GROUPS,
  SEED_MEETUPS,
  SEED_PROGRAMS,
  SEED_RSVPS,
  type Group,
  type HostType,
  type Meetup,
  type Program,
} from './data'

// 데모 상태는 이 브라우저의 localStorage에만 저장됩니다. 서버·계정·알림·결제는 없습니다.
// 같은 브라우저의 다른 탭(진행자 화면)과는 storage 이벤트로 동기화됩니다.

export type CheckinKind = 'good' | 'talk' | 'rest'
export type ReplyKind = 'hi' | 'call' | 'rest'

export type Reply = { from: string; kind: ReplyKind; fresh?: boolean }

export type Checkin = {
  id: string
  groupId: string
  from: string
  kind: CheckinKind
  when: string
  replies: Reply[]
}

export type Report = {
  id: string
  groupId: string | null
  reason: string
  about: string
  when: string
  status: 'new' | 'seen'
}

/** 강좌·모임 제안. 진행자가 확인해야 둘러보기에 올라갑니다. */
export type Proposal = {
  id: string
  hostType: Exclude<HostType, 'center'>
  kind: 'class' | 'group'
  title: string
  desc: string
  shop: string
  place: string
  dong: string
  schedule: string
  capacity: number
  cost: string
  by: string
  when: string
  status: 'pending' | 'approved' | 'declined'
}

export type Screen =
  | 'start'
  | 'name'
  | 'interests'
  | 'explore'
  | 'program'
  | 'propose'
  | 'welcome'
  | 'home'
  | 'send'
  | 'meet'
  | 'proposeMeet'
  | 'help'
  | 'report'
  | 'leave'

export type State = {
  screen: Screen
  profile: { name: string; dong: string; interests: string[]; times: string[] }
  /** 내가 들어간 모임들 */
  groupIds: string[]
  /** 지금 보고 있는 모임 */
  groupId: string | null
  /** 둘러보기에서 열어 본 강좌·모임 */
  programId: string | null
  /** 신청한 강좌 */
  enrolled: string[]
  groups: Group[]
  programs: Program[]
  meetups: Record<string, Meetup[]>
  rsvps: Record<string, Record<string, 'yes' | 'no'>>
  checkins: Checkin[]
  reports: Report[]
  proposals: Proposal[]
  toast: string | null
}

const KEY = 'ttobom-demo-v4'

function seed(): State {
  return {
    screen: 'start',
    profile: { name: '', dong: '', interests: [], times: [] },
    groupIds: [],
    groupId: null,
    programId: null,
    enrolled: [],
    groups: SEED_GROUPS,
    programs: SEED_PROGRAMS,
    meetups: SEED_MEETUPS,
    rsvps: SEED_RSVPS,
    checkins: [
      { id: 'c1', groupId: 'g1', from: '영숙', kind: 'talk', when: '오늘 오전 9:12', replies: [] },
      { id: 'c2', groupId: 'g1', from: '정호', kind: 'good', when: '어제 저녁', replies: [{ from: '순자', kind: 'hi' }] },
      { id: 'c3', groupId: 'g1', from: '순자', kind: 'rest', when: '어제 오후', replies: [] },
      { id: 'c4', groupId: 'g2', from: '경자', kind: 'good', when: '오늘 오전', replies: [] },
      { id: 'c5', groupId: 'g3', from: '상철', kind: 'good', when: '어제', replies: [] },
      { id: 'c6', groupId: 'g4', from: '춘자', kind: 'good', when: '오늘 오전', replies: [] },
    ],
    reports: [],
    proposals: [],
    toast: null,
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...seed(), ...JSON.parse(raw), toast: null }
  } catch {
    /* storage unavailable → start fresh */
  }
  return seed()
}

let state: State = load()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function setState(fn: (s: State) => State) {
  state = fn(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
  emit()
}

export function resetDemo() {
  state = seed()
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  emit()
}

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = { ...load(), screen: state.screen }
    emit()
  }
})

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export const go = (screen: Screen) => {
  setState((s) => ({ ...s, screen, toast: null }))
  window.scrollTo(0, 0)
}

export const showToast = (toast: string) => setState((s) => ({ ...s, toast }))

function now() {
  const d = new Date()
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `오늘 ${h < 12 ? '오전' : '오후'} ${((h + 11) % 12) + 1}:${m}`
}

const uid = () => Math.random().toString(36).slice(2, 9)

// ── 둘러보기 ──

export function openProgram(id: string) {
  setState((s) => ({ ...s, programId: id, screen: 'program', toast: null }))
  window.scrollTo(0, 0)
}

export function toggleEnroll(programId: string) {
  setState((s) => {
    const on = s.enrolled.includes(programId)
    return {
      ...s,
      enrolled: on ? s.enrolled.filter((x) => x !== programId) : [...s.enrolled, programId],
      programs: s.programs.map((p) => (p.id === programId ? { ...p, taken: p.taken + (on ? -1 : 1) } : p)),
      toast: on ? '신청을 취소했어요' : '신청했어요. 첫날 만나요!',
    }
  })
}

export function joinGroup(groupId: string) {
  setState((s) => ({
    ...s,
    groupId,
    groupIds: s.groupIds.includes(groupId) ? s.groupIds : [...s.groupIds, groupId],
    programs: s.programs.map((p) => (p.kind === 'group' && p.groupId === groupId ? { ...p, taken: p.taken + 1 } : p)),
    screen: 'welcome',
    toast: null,
  }))
  window.scrollTo(0, 0)
}

export function switchGroup(groupId: string) {
  setState((s) => ({ ...s, groupId }))
}

export function openGroup(groupId: string) {
  setState((s) => ({ ...s, groupId, screen: 'home', toast: null }))
  window.scrollTo(0, 0)
}

export function submitProposal(p: Omit<Proposal, 'id' | 'by' | 'when' | 'status'>) {
  setState((s) => ({
    ...s,
    screen: 'explore',
    toast: '진행자에게 보냈어요. 확인되면 둘러보기에 올라가요',
    proposals: [{ ...p, id: uid(), by: s.profile.name || '나', when: now(), status: 'pending' }, ...s.proposals],
  }))
  window.scrollTo(0, 0)
}

// ── 모임 ──

// 내가 안부를 보내면 모임원 한 명이 응답하는 장면을 "스크립트로" 보여 줍니다.
// 실제 다른 사용자가 아니며, 화면에도 예시 응답이라고 표시합니다.
const SCRIPTED: Record<CheckinKind, ReplyKind> = { talk: 'call', good: 'hi', rest: 'rest' }

export function sendCheckin(kind: CheckinKind) {
  const s0 = state
  if (!s0.groupId) return
  const id = uid()
  const groupId = s0.groupId
  const members = s0.groups.find((g) => g.id === groupId)?.members ?? []
  const responder = members[kind === 'talk' ? 2 : kind === 'good' ? 1 : 0] ?? members[0]
  setState((s) => ({
    ...s,
    screen: 'home',
    toast: '모임 분들께 안부를 전했어요',
    checkins: [{ id, groupId, from: s.profile.name || '나', kind, when: now(), replies: [] }, ...s.checkins],
  }))
  window.scrollTo(0, 0)
  if (!responder) return
  window.setTimeout(() => {
    setState((s) => ({
      ...s,
      checkins: s.checkins.map((c) =>
        c.id === id ? { ...c, replies: [...c.replies, { from: responder.name, kind: SCRIPTED[kind], fresh: true }] } : c,
      ),
    }))
  }, 2600)
}

export function replyTo(checkinId: string, kind: ReplyKind) {
  setState((s) => ({
    ...s,
    checkins: s.checkins.map((c) =>
      c.id === checkinId ? { ...c, replies: [...c.replies, { from: s.profile.name || '나', kind }] } : c,
    ),
  }))
}

export function setRsvp(meetupId: string, value: 'yes' | 'no') {
  setState((s) => ({
    ...s,
    rsvps: { ...s.rsvps, [meetupId]: { ...(s.rsvps[meetupId] ?? {}), [s.profile.name || '나']: value } },
    toast: value === 'yes' ? '참석한다고 전했어요. 그날 만나요!' : '괜찮아요. 다음에 만나요.',
  }))
}

/** 모임원이 다음 만남을 제안합니다. 제안한 사람은 자동으로 '갈게요'가 됩니다. */
export function proposeMeetup(m: Omit<Meetup, 'id' | 'proposedBy' | 'hostComing'>) {
  setState((s) => {
    if (!s.groupId) return s
    const id = uid()
    const me = s.profile.name || '나'
    return {
      ...s,
      screen: 'meet',
      toast: '모임 분들께 만남을 제안했어요',
      meetups: { ...s.meetups, [s.groupId]: [...(s.meetups[s.groupId] ?? []), { ...m, id, hostComing: false, proposedBy: me }] },
      rsvps: { ...s.rsvps, [id]: { [me]: 'yes' } },
    }
  })
  window.scrollTo(0, 0)
}

export function submitReport(reason: string, about: string) {
  setState((s) => ({
    ...s,
    screen: 'help',
    toast: '진행자에게 전했어요',
    reports: [{ id: uid(), groupId: s.groupId, reason, about, when: now(), status: 'new' }, ...s.reports],
  }))
  window.scrollTo(0, 0)
}

export function leaveGroup() {
  setState((s) => {
    const groupIds = s.groupIds.filter((id) => id !== s.groupId)
    return {
      ...s,
      groupIds,
      groupId: groupIds[0] ?? null,
      programs: s.programs.map((p) => (p.kind === 'group' && p.groupId === s.groupId ? { ...p, taken: Math.max(p.taken - 1, 0) } : p)),
      screen: 'explore',
      toast: '모임에서 나왔어요. 언제든 다시 들어올 수 있어요.',
    }
  })
  window.scrollTo(0, 0)
}

// ── 진행자 화면 ──

export function addMeetup(groupId: string, m: Omit<Meetup, 'id'>) {
  setState((s) => ({ ...s, meetups: { ...s.meetups, [groupId]: [...(s.meetups[groupId] ?? []), { ...m, id: uid() }] } }))
}

export function markReportSeen(id: string) {
  setState((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, status: 'seen' } : r)) }))
}

/** 제안을 확인해 둘러보기에 올립니다. 모임 제안이면 새 모임도 만들고, 제안한 회원을 첫 모임원으로 넣습니다. */
export function approveProposal(id: string) {
  setState((s) => {
    const p = s.proposals.find((x) => x.id === id)
    if (!p) return s
    const me = s.profile.name || '나'
    let groups = s.groups
    let groupIds = s.groupIds
    let groupId: string | undefined
    if (p.kind === 'group') {
      groupId = uid()
      groups = [...groups, { id: groupId, name: p.title, dong: p.dong, members: [], host: HOST_NAME }]
      if (p.by === me) groupIds = [...groupIds, groupId]
    }
    const program: Program = {
      id: uid(),
      kind: p.kind,
      title: p.title,
      emoji: p.hostType === 'shop' ? '🏪' : p.hostType === 'instructor' ? '🧑‍🏫' : '🙋',
      interests: [],
      dong: p.dong,
      place: p.place,
      hostType: p.hostType,
      hostName: p.hostType === 'shop' ? `${p.shop} · ${p.by} 님` : `${p.by} 님 (${p.dong} 주민) 제안`,
      hostIntro: '진행자가 확인한 제안이에요.',
      schedule: p.schedule,
      time: '',
      capacity: p.capacity,
      taken: p.kind === 'group' && p.by === me ? 1 : 0,
      cost: p.cost,
      desc: p.desc,
      groupId,
      isNew: true,
    }
    return {
      ...s,
      groups,
      groupIds,
      groupId: s.groupId ?? groupIds[0] ?? null,
      programs: [program, ...s.programs],
      proposals: s.proposals.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)),
    }
  })
}

export function declineProposal(id: string) {
  setState((s) => ({ ...s, proposals: s.proposals.map((x) => (x.id === id ? { ...x, status: 'declined' } : x)) }))
}

/** 복지관이 직접 강좌·모임을 올립니다. 모임이면 빈 모임도 함께 만듭니다. */
export function addCenterProgram(p: { kind: 'class' | 'group'; title: string; desc: string; dong: string; place: string; schedule: string; capacity: number; interest: string; time: string }) {
  setState((s) => {
    const groupId = p.kind === 'group' ? uid() : undefined
    const program: Program = {
      id: uid(),
      kind: p.kind,
      title: p.title,
      emoji: p.kind === 'class' ? '🎓' : '🌿',
      interests: [p.interest],
      dong: p.dong,
      place: p.place,
      hostType: 'center',
      hostName: `마포 행복복지관 · 진행자 ${HOST_NAME}`,
      hostIntro: '복지관에서 준비한 프로그램이에요.',
      schedule: p.schedule,
      time: p.time,
      capacity: p.capacity,
      taken: 0,
      cost: '무료',
      desc: p.desc,
      groupId,
      isNew: true,
    }
    return {
      ...s,
      programs: [program, ...s.programs],
      groups: groupId ? [...s.groups, { id: groupId, name: p.title, dong: p.dong, members: [], host: HOST_NAME }] : s.groups,
    }
  })
}
