import { useEffect, useState } from 'react'
import { useStore } from './store'
import { Toast } from './ui'
import { InterestStep, NameStep, Start } from './screens/Onboarding'
import { Groups, Welcome } from './screens/Groups'
import { Help, Home, Leave, Meet, ReportScreen, Send } from './screens/Group'
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

  // 모임이 없는데 모임 화면에 있으면 목록으로
  const needsGroup = ['welcome', 'home', 'send', 'meet', 'help', 'report', 'leave'].includes(screen)
  const current = needsGroup && !groupId ? 'groups' : screen

  const view = {
    start: <Start />,
    name: <NameStep />,
    interests: <InterestStep />,
    groups: <Groups />,
    welcome: <Welcome />,
    home: <Home />,
    send: <Send />,
    meet: <Meet />,
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
