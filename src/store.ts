import { useSyncExternalStore } from 'react'
import {
  SEED_GROUPS,
  SEED_MEETUPS,
  SEED_RSVPS,
  type Group,
  type Meetup,
} from './data'

// 데모 상태는 이 브라우저의 localStorage에만 저장됩니다. 서버·계정·알림은 없습니다.
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

export type Screen =
  | 'start'
  | 'name'
  | 'interests'
  | 'groups'
  | 'welcome'
  | 'home'
  | 'send'
  | 'meet'
  | 'help'
  | 'report'
  | 'leave'

export type State = {
  screen: Screen
  profile: { name: string; dong: string; interests: string[]; times: string[] }
  groupId: string | null
  groups: Group[]
  meetups: Record<string, Meetup>
  rsvps: Record<string, Record<string, 'yes' | 'no'>>
  checkins: Checkin[]
  reports: Report[]
  toast: string | null
}

const KEY = 'ttobom-demo-v1'

function seed(): State {
  return {
    screen: 'start',
    profile: { name: '', dong: '', interests: [], times: [] },
    groupId: null,
    groups: SEED_GROUPS,
    meetups: SEED_MEETUPS,
    rsvps: SEED_RSVPS,
    checkins: [
      { id: 'c1', groupId: 'g1', from: '영숙', kind: 'talk', when: '오늘 오전 9:12', replies: [] },
      { id: 'c2', groupId: 'g1', from: '정호', kind: 'good', when: '어제 저녁', replies: [{ from: '순자', kind: 'hi' }] },
      { id: 'c3', groupId: 'g1', from: '순자', kind: 'rest', when: '어제 오후', replies: [] },
      { id: 'c4', groupId: 'g2', from: '경자', kind: 'good', when: '오늘 오전', replies: [] },
      { id: 'c5', groupId: 'g3', from: '상철', kind: 'good', when: '어제', replies: [] },
    ],
    reports: [],
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
    state = load()
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

// 내가 안부를 보내면 모임원 한 명이 응답하는 장면을 "스크립트로" 보여 줍니다.
// 실제 다른 사용자가 아니며, 화면에도 예시 응답이라고 표시합니다.
const SCRIPTED: Record<CheckinKind, Reply> = {
  talk: { from: '미경', kind: 'call' },
  good: { from: '정호', kind: 'hi' },
  rest: { from: '영숙', kind: 'rest' },
}

export function sendCheckin(kind: CheckinKind) {
  const s0 = state
  if (!s0.groupId) return
  const id = uid()
  const groupId = s0.groupId
  setState((s) => ({
    ...s,
    screen: 'home',
    toast: '모임 분들께 안부를 전했어요',
    checkins: [{ id, groupId, from: s.profile.name || '나', kind, when: now(), replies: [] }, ...s.checkins],
  }))
  window.scrollTo(0, 0)
  window.setTimeout(() => {
    setState((s) => ({
      ...s,
      checkins: s.checkins.map((c) =>
        c.id === id ? { ...c, replies: [...c.replies, { ...SCRIPTED[kind], fresh: true }] } : c,
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
  setState((s) => ({ ...s, groupId: null, screen: 'groups', toast: '모임에서 나왔어요. 언제든 다시 들어올 수 있어요.' }))
  window.scrollTo(0, 0)
}

// ── 진행자 화면 ──

export function saveMeetup(groupId: string, m: Omit<Meetup, 'id'>) {
  setState((s) => ({ ...s, meetups: { ...s.meetups, [groupId]: { ...m, id: uid() } } }))
}

export function addGroup(g: Omit<Group, 'id' | 'members' | 'host'>) {
  setState((s) => ({ ...s, groups: [...s.groups, { ...g, id: uid(), members: [], host: s.groups[0]?.host ?? '' }] }))
}

export function markReportSeen(id: string) {
  setState((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, status: 'seen' } : r)) }))
}
