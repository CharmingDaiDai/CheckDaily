import { WifiOff } from 'lucide-react'
import { useOnline } from '@/hooks/useOnline'

export function OfflineBanner() {
  const online = useOnline()
  if (online) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 py-1.5 px-4 animate-fade-in">
      <WifiOff className="w-3 h-3 shrink-0" />
      当前处于离线模式，数据可能不是最新
    </div>
  )
}
