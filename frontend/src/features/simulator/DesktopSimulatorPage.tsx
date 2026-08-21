import { useSearchParams } from 'react-router-dom'

import { BoltDesktopSimulator } from '@/features/bolt-desktop'
import { BoltCodeLab } from '@/features/bolt-simulator/BoltCodeLab'
import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'

export function DesktopSimulatorPage() {
  const [search] = useSearchParams()
  const desktopMode = search.get('mode') === 'desktop'

  if (desktopMode) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <BoltDesktopSimulator />
      </div>
    )
  }

  return (
    <PracticeKeyboardGate>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <BoltCodeLab />
      </div>
    </PracticeKeyboardGate>
  )
}
