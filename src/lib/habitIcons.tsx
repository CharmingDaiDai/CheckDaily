import type { ComponentType, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Layers } from 'lucide-react'
import type { IconType } from 'react-icons'
import {
  GiHeartBeats,
  GiJumpingRope,
  GiPush,
} from 'react-icons/gi'
import {
  TbBarbell,
  TbStretching2,
} from 'react-icons/tb'
import {
  FaPersonBiking,
  FaPersonRunning,
  FaPersonSwimming,
} from 'react-icons/fa6'
import { cn } from '@/lib/utils'

interface ActionIconProps {
  className?: string
  size?: number
  color?: string
  strokeWidth?: number
}

function ActionCanvas({
  className,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.9,
  children,
}: ActionIconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const SitUpActionIcon = (props: ActionIconProps) => (
  <ActionCanvas {...props}>
    <path d="M3 17.5h18" />
    <circle cx="16.5" cy="6.3" r="1.5" />
    <path d="M15.4 7.8 12.9 10.4 9.9 10.4" />
    <path d="M9.9 10.4 7.5 8.7" />
    <path d="M9.9 10.4 8.2 13.6" />
    <path d="M8.2 13.6H5.4" />
  </ActionCanvas>
)

const PlankActionIcon = (props: ActionIconProps) => (
  <ActionCanvas {...props}>
    <path d="M3 17.5h18" />
    <circle cx="18.1" cy="10.2" r="1.4" />
    <path d="M16.8 10.9H9.8" />
    <path d="M9.8 10.9 6.9 12.7 5.3 15.2" />
    <path d="M11.7 10.9 10.1 14.9H12.5" />
  </ActionCanvas>
)

const SquatActionIcon = (props: ActionIconProps) => (
  <ActionCanvas {...props}>
    <path d="M3 17.5h18" />
    <circle cx="12" cy="5.2" r="1.5" />
    <path d="M12 6.9v3.2" />
    <path d="M12 10.1 9 12.2v3" />
    <path d="M12 10.1 15 12.2v3" />
    <path d="M9 15.2H6.9" />
    <path d="M15 15.2H17.1" />
    <path d="M12 8.7 15.6 9.8" />
  </ActionCanvas>
)

const HighKneesActionIcon = (props: ActionIconProps) => (
  <ActionCanvas {...props}>
    <path d="M3 17.5h18" />
    <circle cx="8.6" cy="5.3" r="1.5" />
    <path d="M8.7 6.9 10.5 9.4" />
    <path d="M10.5 9.4 13.7 8.6" />
    <path d="M10.5 9.4 13.4 11.3 12.8 14.4" />
    <path d="M10.5 9.4 7.4 11.7 6 15.2" />
    <path d="M12.2 14.4h2.2" />
  </ActionCanvas>
)
type IconFamily = 'lucide' | 'react-icons' | 'custom'

export type HabitIconOption = {
  key: string
  label: string
  Icon: ComponentType<any>
  family: IconFamily
  tone: string
}

function fromLucide(key: string, label: string, Icon: LucideIcon, tone: string): HabitIconOption {
  return { key, label, Icon, family: 'lucide', tone }
}

function fromReactIcon(key: string, label: string, Icon: IconType, tone: string): HabitIconOption {
  return { key, label, Icon, family: 'react-icons', tone }
}

function fromCustomIcon(key: string, label: string, Icon: ComponentType<ActionIconProps>, tone: string): HabitIconOption {
  return { key, label, Icon, family: 'custom', tone }
}

export const HABIT_ICON_OPTIONS: HabitIconOption[] = [
  fromReactIcon('pushup', '俯卧撑', GiPush, '#f97316'),
  fromCustomIcon('situp', '仰卧起坐', SitUpActionIcon, '#ef4444'),
  fromCustomIcon('plank', '平板支撑', PlankActionIcon, '#f59e0b'),
  fromReactIcon('jump-rope', '跳绳', GiJumpingRope, '#ec4899'),
  fromCustomIcon('squat', '深蹲', SquatActionIcon, '#a855f7'),
  fromCustomIcon('high-knees', '高抬腿', HighKneesActionIcon, '#6366f1'),
  fromReactIcon('run', '跑步', FaPersonRunning, '#3b82f6'),
  fromReactIcon('cycling', '骑行', FaPersonBiking, '#06b6d4'),
  fromReactIcon('swim', '游泳', FaPersonSwimming, '#14b8a6'),
  fromReactIcon('cardio', '有氧训练', GiHeartBeats, '#22c55e'),
  fromReactIcon('mobility', '拉伸放松', TbStretching2, '#84cc16'),
  fromReactIcon('training', '综合训练', TbBarbell, '#f59e0b'),
]

export const COMBO_ICON_OPTIONS: HabitIconOption[] = [
  fromLucide('combo', '运动组合', Layers, '#f97316'),
  ...HABIT_ICON_OPTIONS,
]

const HABIT_ICON_MAP = new Map(HABIT_ICON_OPTIONS.map((option) => [option.key, option]))
const COMBO_ICON_MAP = new Map(COMBO_ICON_OPTIONS.map((option) => [option.key, option]))

export const DEFAULT_HABIT_ICON_KEY = HABIT_ICON_OPTIONS[0].key
export const DEFAULT_COMBO_ICON_KEY = COMBO_ICON_OPTIONS[0].key

export function isPresetHabitIcon(icon: string | null | undefined) {
  return !!icon && HABIT_ICON_MAP.has(icon)
}

export function isPresetComboIcon(icon: string | null | undefined) {
  return !!icon && COMBO_ICON_MAP.has(icon)
}

export function getHabitIconOption(icon: string | null | undefined) {
  if (!icon) return undefined
  return HABIT_ICON_MAP.get(icon) ?? COMBO_ICON_MAP.get(icon)
}

export function getHabitIconLabel(icon: string | null | undefined, fallback = '项目') {
  const option = getHabitIconOption(icon)
  if (option) return option.label
  return icon || fallback
}

interface HabitIconProps {
  icon: string | null | undefined
  className?: string
  size?: number
  color?: string
  strokeWidth?: number
  fallback?: string
}

export function HabitIcon({
  icon,
  className,
  size,
  color,
  strokeWidth = 2.2,
  fallback = '📌',
}: HabitIconProps) {
  const option = getHabitIconOption(icon)
  if (option) {
    const Icon = option.Icon
    if (option.family === 'lucide') {
      return (
        <Icon
          className={cn('shrink-0', className)}
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      )
    }

    if (option.family === 'custom') {
      return (
        <Icon
          className={cn('shrink-0', className)}
          size={size ?? 18}
          color={color}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      )
    }

    return (
      <Icon
        className={cn('shrink-0', className)}
        size={size ?? 18}
        color={color}
        aria-hidden="true"
      />
    )
  }

  return (
    <span
      className={cn('inline-flex items-center justify-center leading-none', className)}
      style={color ? { color } : undefined}
    >
      {icon || fallback}
    </span>
  )
}
