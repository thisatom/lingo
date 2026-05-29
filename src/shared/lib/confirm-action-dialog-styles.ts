import type { CSSProperties } from 'react'
import { cn } from '@/shared/lib/utils'

/** Primary / destructive buttons — same in light and dark. */
export const CONFIRM_DIALOG_PRIMARY = '#599ce7'
export const CONFIRM_DIALOG_PRIMARY_BORDER = '#7eb3ef'
export const CONFIRM_DIALOG_DESTRUCTIVE = '#e5484d'
export const CONFIRM_DIALOG_DESTRUCTIVE_BORDER = '#f07575'
export const CONFIRM_DIALOG_CHECKBOX_CHECKED = CONFIRM_DIALOG_PRIMARY

export const confirmActionDialogContentClass = cn(
  'gap-0 overflow-hidden rounded-lg border p-0 shadow-xl',
  'border-[#d6d6d6] bg-white',
  'dark:border-[#303030] dark:bg-[#181818]',
  'data-[size=default]:sm:max-w-[440px] data-[size=sm]:max-w-[400px]'
)

export const confirmActionDialogTitleClass = cn(
  'text-[15px] font-semibold leading-snug text-[#171717]',
  'dark:text-[#ececec]'
)

export const confirmActionDialogDescriptionClass = cn(
  'text-[13px] leading-[1.45] text-[#525252]',
  'dark:text-[#a3a3a3]'
)

export const confirmActionDialogSeparatorClass = cn(
  'h-[2px] w-full shrink-0 bg-[#e8e8e8]',
  'dark:bg-[#202020]'
)

export const confirmActionDialogFooterCheckboxClass = cn(
  '!size-3.5 shrink-0 rounded-[3px] border border-solid shadow-none outline-none',
  '!border-[#c8c8c8] !bg-white',
  'focus-visible:!border-[#599ce7] focus-visible:ring-1 focus-visible:ring-[#599ce7]/30 focus-visible:ring-offset-0',
  'data-[state=checked]:!border-[#599ce7] data-[state=checked]:!bg-[#599ce7] data-[state=checked]:!text-white',
  'dark:!border-[#404040] dark:!bg-[#181818]',
  'dark:focus-visible:!border-[#599ce7]',
  'dark:data-[state=checked]:!border-[#599ce7] dark:data-[state=checked]:!bg-[#599ce7]',
  '[&_[data-slot=checkbox-indicator]_svg]:!size-2.5'
)

export const confirmActionDialogFooterLabelClass = cn(
  'cursor-pointer select-none text-[13px] leading-none text-[#525252]',
  'dark:text-[#a3a3a3]'
)

export const confirmActionDialogCloseClass = cn(
  'mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full',
  'text-[#6b6b6b] transition-colors hover:bg-[#ebebeb] hover:text-[#171717]',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c8c8c8]',
  'dark:text-[#737373] dark:hover:bg-[#252525] dark:hover:text-[#ececec]',
  'dark:focus-visible:ring-[#404040]'
)

export const confirmActionDialogHeaderClass = 'flex items-start gap-3 px-5 pt-3 pb-3'

export const confirmActionDialogCancelClass = cn(
  '!h-[21px] min-h-[21px] min-w-0 border-0 bg-transparent px-2.5 py-0 text-[13px] font-normal leading-none text-[#525252]',
  'shadow-none hover:bg-transparent hover:text-[#171717]',
  'focus-visible:ring-1 focus-visible:ring-[#c8c8c8]',
  'dark:text-[#a3a3a3] dark:hover:text-[#ececec]',
  'dark:focus-visible:ring-[#404040]'
)

export function confirmActionDialogPrimaryClass(variant: 'accent' | 'destructive' = 'accent') {
  return cn(
    '!h-[21px] min-h-[21px] min-w-[4.5rem] rounded-md border border-solid px-3 py-0 text-[13px] font-medium leading-none text-white shadow-none',
    'hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-0',
    variant === 'destructive'
      ? 'focus-visible:ring-[#e5484d]/50'
      : 'focus-visible:ring-[#599ce7]/50'
  )
}

export function confirmActionDialogPrimaryStyle(
  variant: 'accent' | 'destructive' = 'accent'
): CSSProperties {
  const isDestructive = variant === 'destructive'
  return {
    backgroundColor: isDestructive ? CONFIRM_DIALOG_DESTRUCTIVE : CONFIRM_DIALOG_PRIMARY,
    borderColor: isDestructive ? CONFIRM_DIALOG_DESTRUCTIVE_BORDER : CONFIRM_DIALOG_PRIMARY_BORDER
  }
}
