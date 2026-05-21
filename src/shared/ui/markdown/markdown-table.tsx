import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { typography } from '@/shared/ui/typography'

export function MarkdownTable({ children }: { children?: ReactNode }) {
  return (
    <div className={typography.tableWrap}>
      <table className={typography.table}>{children}</table>
    </div>
  )
}

export function MarkdownTableHead({ children }: { children?: ReactNode }) {
  return <thead className={typography.tableHead}>{children}</thead>
}

export function MarkdownTableBody({ children }: { children?: ReactNode }) {
  return <tbody className={typography.tableBody}>{children}</tbody>
}

export function MarkdownTableRow({ children }: { children?: ReactNode }) {
  return <tr className={typography.tableRow}>{children}</tr>
}

export function MarkdownTableHeaderCell({ children, align }: { children?: ReactNode; align?: string }) {
  return (
    <th className={cn(typography.tableTh, align === 'center' && 'text-center', align === 'right' && 'text-right')}>
      {children}
    </th>
  )
}

export function MarkdownTableCell({ children, align }: { children?: ReactNode; align?: string }) {
  return (
    <td className={cn(typography.tableTd, align === 'center' && 'text-center', align === 'right' && 'text-right')}>
      {children}
    </td>
  )
}
