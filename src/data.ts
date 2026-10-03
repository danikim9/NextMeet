// 모든 사람·모임·만남은 데모용 가상 데이터입니다.

export const DEMO_INVITE_CODE = '1013'

export const DONGS = ['망원동', '성산동', '합정동', '연남동'] as const

export const INTERESTS = [
  { id: 'photo', label: '휴대폰 사진', emoji: '📷' },
  { id: 'walk', label: '산책', emoji: '🚶' },
  { id: 'book', label: '책·이야기', emoji: '📖' },
  { id: 'tour', label: '동네 탐방', emoji: '🗺️' },
  { id: 'music', label: '노래·음악', emoji: '🎵' },
  { id: 'share', label: '생활 지식 나눔', emoji: '🤝' },
] as const

export const TIMES = ['평일 오전', '평일 오후', '주말'] as const

export type Member = {
  name: string
  /** 전화번호 공개에 동의했는지 (번호 자체는 데모에서 다루지 않음) */
  sharesPhone: boolean
}

export type Group = {
  id: string
  name: string
  dong: string
  interests: string[]
  schedule: string
  time: string
  activity: string
  members: Member[]
  host: string
}

export type Meetup = {
  id: string
  date: string
  time: string
  place: string
  activity: string
  bring: string
  hostComing: boolean
}

export const HOST_NAME = '이수진'
export const HOST_ORG = '마포 행복복지관 (가상)'

export const SEED_GROUPS: Group[] = [
  {
    id: 'g1',
    name: '망원 사진 산책 모임',
    dong: '망원동',
    interests: ['photo', 'walk'],
    schedule: '격주 화요일',
    time: '평일 오전',
    activity: '한강 따라 걸으며 휴대폰으로 사진 찍기',
    members: [
      { name: '영숙', sharesPhone: true },
      { name: '정호', sharesPhone: true },
      { name: '미경', sharesPhone: false },
      { name: '순자', sharesPhone: true },
    ],
    host: HOST_NAME,
  },
  {
    id: 'g2',
    name: '성산 책과 차 모임',
    dong: '성산동',
    interests: ['book', 'share'],
    schedule: '매달 첫째·셋째 목요일',
    time: '평일 오후',
    activity: '동네 카페에서 짧은 글 함께 읽기',
    members: [
      { name: '경자', sharesPhone: true },
      { name: '태식', sharesPhone: false },
      { name: '명희', sharesPhone: true },
    ],
    host: HOST_NAME,
  },
  {
    id: 'g3',
    name: '합정 골목 탐방 모임',
    dong: '합정동',
    interests: ['tour', 'walk'],
    schedule: '격주 토요일',
    time: '주말',
    activity: '골목 걷고 우리만의 산책 지도 그리기',
    members: [
      { name: '복순', sharesPhone: true },
      { name: '상철', sharesPhone: true },
      { name: '옥희', sharesPhone: false },
      { name: '재남', sharesPhone: true },
    ],
    host: HOST_NAME,
  },
]

export const SEED_MEETUPS: Record<string, Meetup> = {
  g1: {
    id: 'm1',
    date: '10월 13일 (화)',
    time: '오전 10시',
    place: '망원한강공원 망원나들목 입구',
    activity: '가을 하늘 사진 찍으며 한 바퀴',
    bring: '휴대폰, 편한 신발',
    hostComing: true,
  },
  g2: {
    id: 'm2',
    date: '10월 15일 (목)',
    time: '오후 2시',
    place: '성산동 주민센터 1층 북카페',
    activity: '좋아하는 시 한 편씩 가져와 읽기',
    bring: '없음',
    hostComing: true,
  },
  g3: {
    id: 'm3',
    date: '10월 17일 (토)',
    time: '오전 10시',
    place: '합정역 7번 출구 앞',
    activity: '골목 세 곳 걸어 보기',
    bring: '편한 신발',
    hostComing: true,
  },
}

/** 모임원들의 참석 응답 (예시) */
export const SEED_RSVPS: Record<string, Record<string, 'yes' | 'no'>> = {
  m1: { 영숙: 'yes', 정호: 'yes', 순자: 'no' },
  m2: { 경자: 'yes' },
  m3: { 복순: 'yes', 상철: 'yes' },
}

export const REPORT_REASONS = [
  '돈 이야기를 해요',
  '물건을 사라고 해요',
  '원하지 않는 연락이 와요',
  '다른 불편한 일이 있어요',
] as const
