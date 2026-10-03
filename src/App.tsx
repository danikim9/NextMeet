import { useEffect, useState } from 'react'
import { useStore } from './store'
import { Toast } from './ui'
import { InterestStep, NameStep, Start } from './screens/Onboarding'
import { Explore, JobDetail, ProgramDetail, Propose, Welcome } from './screens/Explore'
import { Help, Home, Leave, Meet, ProposeMeet, ReportScreen, Send } from './screens/Group'
import { Host } from './screens/Host'

function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const { screen, groupId } = useStore()

  if (hash === '#/host') return <Host />

  // 모임이 없는데 모임 전용 화면에 있으면 둘러보기로
  const needsGroup = ['welcome', 'send', 'proposeMeet', 'report', 'leave'].includes(screen)
  const current = needsGroup && !groupId ? 'explore' : screen

  const view = {
    start: <Start />,
    name: <NameStep />,
    interests: <InterestStep />,
    explore: <Explore />,
    program: <ProgramDetail />,
    job: <JobDetail />,
    propose: <Propose />,
    welcome: <Welcome />,
    home: <Home />,
    send: <Send />,
    meet: <Meet />,
    proposeMeet: <ProposeMeet />,
    help: <Help />,
    report: <ReportScreen />,
    leave: <Leave />,
  }[current]

  return (
    <div className="app">
      {view}
      <Toast />
    </div>
  )
}
