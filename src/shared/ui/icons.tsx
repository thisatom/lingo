/**
 * App icons — VS Code Codicons (@vscode/codicons).
 * Drop-in replacements for former lucide-react imports.
 */
import { Codicon, type CodiconProps } from '@/shared/ui/codicon'
import { cn } from '@/shared/lib/utils'

export type IconProps = Omit<CodiconProps, 'name'>

function icon(name: string) {
  const Icon = (props: IconProps) => <Codicon name={name} {...props} />
  return Icon
}

export const Add = icon('add')
export const ArrowDown = icon('arrow-down')
export const ArrowLeft = icon('arrow-left')
export const ArrowRight = icon('arrow-right')
export const ArrowUp = icon('arrow-up')
export const Calendar = icon('calendar')
export const Check = icon('check')
export const CheckIcon = Check
export const ChevronDown = icon('chevron-down')
export const ChevronDownIcon = ChevronDown
export const ChevronRightIcon = icon('chevron-right')
export const ChevronUpIcon = icon('chevron-up')
export const Clock = icon('clock')
export const Copy = icon('copy')
export const Cpu = icon('chip')
export const Edit = icon('edit')
export const ExternalLink = icon('link-external')
export const Eye = icon('eye')
export const EyeOff = icon('eye-closed')
export const FileText = icon('file-text')
export const Filter = icon('list-filter')
export const Globe = icon('globe')
export const List = icon('list-unordered')
export const ListFilter = icon('list-filter')
export const Loader2Icon = icon('loading')
export const Mic = icon('mic')
export const MoreHorizontal = icon('ellipsis')
export const PanelLeft = icon('layout-sidebar-left')
export const PanelLeftIcon = PanelLeft
/** Primary sidebar visible — collapse/hide action */
export const PanelLeftClose = icon('layout-sidebar-left-off')
/** Primary sidebar hidden — expand/show action */
export const PanelLeftOpen = PanelLeft
export const Paperclip = icon('attach')
export const Pencil = icon('edit')
export const Pin = icon('pinned')
export const RefreshCw = icon('refresh')
export const Reply = icon('reply')
export const RotateCw = icon('refresh')
export const Search = icon('search')
export const SearchIcon = Search
export const Settings = icon('settings-gear')
export const Square = icon('debug-stop')
export const Trash2 = icon('trash')
export const User = icon('account')
export const Volume2 = icon('unmute')
export const WandSparkles = icon('sparkle')
export const X = icon('close')
export const XIcon = X

export const ArrowDownAZ = icon('sort-precedence')

export function ArrowUpAZ({ className, ...props }: IconProps) {
  return <Codicon name="sort-precedence" className={cn('rotate-180', className)} {...props} />
}
export const CircleIcon = icon('circle-outline')
export const CornerDownLeft = icon('send')
export const GripVerticalIcon = icon('gripper')
export const MessageSquarePlus = icon('add')
/** New chat — sidebar & actions */
export const NewChat = icon('new-session')

export function ChevronsUpDown(props: IconProps) {
  return <Codicon name="arrow-swap" {...props} />
}
