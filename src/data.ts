// 모든 사람·가게·모임·강좌·만남은 데모용 가상 데이터입니다.

export const DEMO_INVITE_CODE = '1013'

export const DONGS = ['망원동', '성산동', '합정동', '연남동'] as const

export const INTERESTS = [
  { id: 'photo', label: '휴대폰 사진', emoji: '📷' },
  { id: 'walk', label: '산책', emoji: '🚶' },
  { id: 'book', label: '책·이야기', emoji: '📖' },
  { id: 'craft', label: '꽃·공예', emoji: '🌸' },
  { id: 'music', label: '노래·음악', emoji: '🎵' },
  { id: 'share', label: '생활 지식 나눔', emoji: '🤝' },
] as const

export const TIMES = ['평일 오전', '평일 오후', '주말'] as const

export type Member = {
  name: string
  /** 전화번호 공개에 동의했는지 (번호 자체는 데모에서 다루지 않음) */
  sharesPhone: boolean
}

/** 안부와 만남을 이어 가는 작은 고정 모임 */
export type Group = {
  id: string
  name: string
  dong: string
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
  /** 모임원이 제안한 만남이면 제안한 사람 이름 */
  proposedBy?: string
}

/** 누가 여는 강좌·모임인지 */
export type HostType = 'center' | 'shop' | 'instructor' | 'neighbor'

export const HOST_TYPE: Record<HostType, { label: string; emoji: string }> = {
  center: { label: '복지관', emoji: '🏛️' },
  shop: { label: '동네 가게', emoji: '🏪' },
  instructor: { label: '이웃 강사', emoji: '🧑‍🏫' },
  neighbor: { label: '주민 제안', emoji: '🙋' },
}

/** 둘러보기 탭에 올라가는 강좌·모임 */
export type Program = {
  id: string
  kind: 'class' | 'group'
  title: string
  emoji: string
  interests: string[]
  dong: string
  place: string
  hostType: HostType
  hostName: string
  hostIntro: string
  schedule: string
  time: string
  capacity: number
  taken: number
  cost: string
  desc: string
  /** kind=group: 이 모임의 id / kind=class: 수강 후 이어지는 모임 id */
  groupId?: string
  /** 진행자가 방금 올린 것 */
  isNew?: boolean
}

export const HOST_NAME = '이수진'
export const HOST_ORG = '마포 행복복지관 (가상)'

export const SEED_GROUPS: Group[] = [
  {
    id: 'g1',
    name: '망원 사진 산책 모임',
    dong: '망원동',
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
    members: [
      { name: '복순', sharesPhone: true },
      { name: '상철', sharesPhone: true },
      { name: '옥희', sharesPhone: false },
      { name: '재남', sharesPhone: true },
    ],
    host: HOST_NAME,
  },
  {
    id: 'g4',
    name: '망원 꽃 한 송이 모임',
    dong: '망원동',
    members: [
      { name: '춘자', sharesPhone: true },
      { name: '덕희', sharesPhone: true },
    ],
    host: HOST_NAME,
  },
]

export const SEED_PROGRAMS: Program[] = [
  {
    id: 'p1',
    kind: 'class',
    title: '휴대폰 사진 기초 4주',
    emoji: '📷',
    interests: ['photo'],
    dong: '망원동',
    place: '마포 행복복지관 2층 강의실',
    hostType: 'center',
    hostName: '마포 행복복지관 · 한도윤 강사',
    hostIntro: '동네 사진관을 30년 운영했어요. 휴대폰 하나로 충분합니다.',
    schedule: '10월 20일부터 매주 화요일 오전 10시 · 4회',
    time: '평일 오전',
    capacity: 12,
    taken: 9,
    cost: '무료',
    desc: '사진 찍기, 확대하기, 가족에게 보내기까지. 마지막 주에는 망원한강공원에서 함께 찍어요.',
    groupId: 'g1',
  },
  {
    id: 'p2',
    kind: 'class',
    title: '가을 꽃 한 다발 만들기',
    emoji: '💐',
    interests: ['craft'],
    dong: '망원동',
    place: '들꽃상회 (망원시장 옆 꽃집)',
    hostType: 'shop',
    hostName: '들꽃상회 · 오세영 플로리스트',
    hostIntro: '망원동에서 12년째 꽃집을 하고 있어요. 꽃 이름부터 천천히 알려 드려요.',
    schedule: '10월 23일, 30일 목요일 오후 2시 · 2회',
    time: '평일 오후',
    capacity: 6,
    taken: 4,
    cost: '재료비 20,000원 (첫날 가게에서 직접)',
    desc: '제철 꽃으로 작은 다발을 만들고, 집에서 오래 두는 법을 배워요. 만든 꽃은 가져가요.',
    groupId: 'g4',
  },
  {
    id: 'p3',
    kind: 'class',
    title: '나무 도마 만들기 원데이',
    emoji: '🪵',
    interests: ['craft'],
    dong: '연남동',
    place: '연남 목공방 결',
    hostType: 'shop',
    hostName: '목공방 결 · 정우진 목수',
    hostIntro: '공방 문을 동네 어르신들께 처음 열어 봐요. 위험한 공구는 쓰지 않아요.',
    schedule: '10월 25일 토요일 오전 10시 · 1회 (2시간)',
    time: '주말',
    capacity: 6,
    taken: 2,
    cost: '재료비 30,000원 (현장에서 직접)',
    desc: '사포질과 오일 바르기로 내 도마를 완성해요. 앉아서 할 수 있어요.',
  },
  {
    id: 'p4',
    kind: 'class',
    title: '손글씨 엽서 쓰기',
    emoji: '✍️',
    interests: ['share', 'book'],
    dong: '성산동',
    place: '성산동 주민센터 1층 북카페',
    hostType: 'instructor',
    hostName: '김말순 님 (은퇴 서예 교사, 성산동 주민)',
    hostIntro: '40년 동안 붓글씨를 가르쳤어요. 은퇴하고 나니 가르치던 때가 그리워서 제안했어요.',
    schedule: '11월 4일부터 매주 화요일 오후 2시 · 3회',
    time: '평일 오후',
    capacity: 8,
    taken: 3,
    cost: '무료 (붓펜은 복지관이 빌려 드려요)',
    desc: '붓펜으로 안부 엽서를 써서 마지막 날 서로 주고받아요.',
    groupId: 'g2',
  },
  {
    id: 'p5',
    kind: 'group',
    title: '망원 사진 산책 모임',
    emoji: '🚶',
    interests: ['photo', 'walk'],
    dong: '망원동',
    place: '망원한강공원 일대',
    hostType: 'center',
    hostName: `마포 행복복지관 · 진행자 ${HOST_NAME}`,
    hostIntro: '처음 몇 번은 제가 함께 나가요. 그다음부터는 모임 분들이 돌아가며 정해요.',
    schedule: '격주 화요일 오전 10시',
    time: '평일 오전',
    capacity: 6,
    taken: 4,
    cost: '무료',
    desc: '한강 따라 걸으며 휴대폰으로 사진 찍기. 사진 기초 강좌를 들은 분들이 많아요.',
    groupId: 'g1',
  },
  {
    id: 'p6',
    kind: 'group',
    title: '성산 책과 차 모임',
    emoji: '📖',
    interests: ['book', 'share'],
    dong: '성산동',
    place: '성산동 주민센터 북카페',
    hostType: 'center',
    hostName: `마포 행복복지관 · 진행자 ${HOST_NAME}`,
    hostIntro: '짧은 글 한 편이면 충분해요. 다 못 읽어 와도 괜찮아요.',
    schedule: '매달 첫째·셋째 목요일 오후 2시',
    time: '평일 오후',
    capacity: 6,
    taken: 3,
    cost: '무료',
    desc: '동네 카페에서 짧은 글을 함께 읽고 이야기 나눠요.',
    groupId: 'g2',
  },
  {
    id: 'p7',
    kind: 'group',
    title: '합정 골목 탐방 모임',
    emoji: '🗺️',
    interests: ['walk', 'share'],
    dong: '합정동',
    place: '합정역 일대',
    hostType: 'neighbor',
    hostName: '상철 님 (합정동 주민) 제안',
    hostIntro: '이 동네에서 50년 살았어요. 사라진 가게 이야기, 남은 골목 이야기 들려 드릴게요.',
    schedule: '격주 토요일 오전 10시',
    time: '주말',
    capacity: 6,
    taken: 4,
    cost: '무료',
    desc: '골목을 걷고 우리만의 산책 지도를 그려요.',
    groupId: 'g3',
  },
  {
    id: 'p8',
    kind: 'group',
    title: '망원 꽃 한 송이 모임',
    emoji: '🌸',
    interests: ['craft', 'walk'],
    dong: '망원동',
    place: '들꽃상회 앞 · 망원 유수지 공원',
    hostType: 'shop',
    hostName: '들꽃상회와 함께하는 모임',
    hostIntro: '꽃 강좌를 들은 분들이 이어 가는 모임이에요. 한 달에 한 번 가게에서 제철 꽃 이야기를 해 드려요.',
    schedule: '매달 둘째 목요일 오후 2시',
    time: '평일 오후',
    capacity: 6,
    taken: 2,
    cost: '무료 (꽃을 사지 않아도 돼요)',
    desc: '동네 꽃과 나무를 보며 걷고, 가끔 가게에 들러 차 한 잔.',
    groupId: 'g4',
  },
]

export const SEED_MEETUPS: Record<string, Meetup[]> = {
  g1: [
    {
      id: 'm1',
      date: '10월 13일 (화)',
      time: '오전 10시',
      place: '망원한강공원 망원나들목 입구',
      activity: '가을 하늘 사진 찍으며 한 바퀴',
      bring: '휴대폰, 편한 신발',
      hostComing: true,
    },
  ],
  g2: [
    {
      id: 'm2',
      date: '10월 15일 (목)',
      time: '오후 2시',
      place: '성산동 주민센터 1층 북카페',
      activity: '좋아하는 시 한 편씩 가져와 읽기',
      bring: '없음',
      hostComing: true,
    },
  ],
  g3: [
    {
      id: 'm3',
      date: '10월 17일 (토)',
      time: '오전 10시',
      place: '합정역 7번 출구 앞',
      activity: '골목 세 곳 걸어 보기',
      bring: '편한 신발',
      hostComing: true,
    },
  ],
  g4: [
    {
      id: 'm4',
      date: '11월 13일 (목)',
      time: '오후 2시',
      place: '들꽃상회 앞',
      activity: '늦가을 꽃 이야기 듣고 유수지 공원 걷기',
      bring: '없음',
      hostComing: true,
    },
  ],
}

/** 모임원들의 참석 응답 (예시) */
export const SEED_RSVPS: Record<string, Record<string, 'yes' | 'no'>> = {
  m1: { 영숙: 'yes', 정호: 'yes', 순자: 'no' },
  m2: { 경자: 'yes' },
  m3: { 복순: 'yes', 상철: 'yes' },
  m4: { 춘자: 'yes' },
}

/** 회원이 만남을 제안할 때 고르는 선택지. 장소는 공개된 곳만 둡니다. */
export const MEET_DATES = ['10월 20일 (화)', '10월 22일 (목)', '10월 25일 (토)', '10월 27일 (화)'] as const
export const MEET_TIMES = ['오전 10시', '오전 11시', '오후 2시', '오후 4시'] as const
export const PUBLIC_PLACES: Record<string, string[]> = {
  망원동: ['망원한강공원 망원나들목 입구', '망원시장 입구', '들꽃상회 앞 (꽃집)', '망원 유수지 공원 정자'],
  성산동: ['성산동 주민센터 1층 북카페', '성미산 입구', '마포구청역 1번 출구'],
  합정동: ['합정역 7번 출구 앞', '절두산 순교성지 입구', '당인리 문화공간 앞'],
  연남동: ['경의선숲길 연남동 입구', '연남 목공방 결 앞', '홍대입구역 3번 출구'],
}

export const REPORT_REASONS = [
  '돈 이야기를 해요',
  '물건을 사라고 해요',
  '원하지 않는 연락이 와요',
  '다른 불편한 일이 있어요',
] as const

