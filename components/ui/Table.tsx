import {
  forwardRef,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type TableAlignment = "left" | "center" | "right";

const alignmentClasses: Record<TableAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export interface TableContainerProps
  extends HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

export const TableContainer = forwardRef<
  HTMLDivElement,
  TableContainerProps
>(function TableContainer(
  {
    className,
    compact = false,
    children,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={joinClasses(
        "w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        compact ? "text-sm" : "",
        className
      )}
      {...props}
    >
      <div className="w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
});

export interface TableProps
  extends TableHTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<
  HTMLTableElement,
  TableProps
>(function Table(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <table
      ref={ref}
      className={joinClasses(
        "w-full min-w-full border-collapse text-left text-sm",
        className
      )}
      {...props}
    >
      {children}
    </table>
  );
});

export interface TableHeaderProps
  extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(function TableHeader(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <thead
      ref={ref}
      className={joinClasses(
        "border-b border-slate-200 bg-slate-50",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
});

export interface TableBodyProps
  extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(function TableBody(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <tbody
      ref={ref}
      className={joinClasses(
        "divide-y divide-slate-100 bg-white",
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  );
});

export interface TableFooterProps
  extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  TableFooterProps
>(function TableFooter(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <tfoot
      ref={ref}
      className={joinClasses(
        "border-t border-slate-200 bg-slate-50 font-medium text-slate-700",
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
});

export interface TableRowProps
  extends HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
  selected?: boolean;
}

export const TableRow = forwardRef<
  HTMLTableRowElement,
  TableRowProps
>(function TableRow(
  {
    className,
    clickable = false,
    selected = false,
    children,
    ...props
  },
  ref
) {
  return (
    <tr
      ref={ref}
      className={joinClasses(
        "transition-colors duration-150",
        clickable
          ? "cursor-pointer hover:bg-slate-50"
          : "hover:bg-slate-50/70",
        selected ? "bg-blue-50 hover:bg-blue-50" : "",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
});

export interface TableHeadProps
  extends Omit<
    ThHTMLAttributes<HTMLTableCellElement>,
    "align"
  > {
  align?: TableAlignment;
}

export const TableHead = forwardRef<
  HTMLTableCellElement,
  TableHeadProps
>(function TableHead(
  {
    className,
    align = "left",
    children,
    ...props
  },
  ref
) {
  return (
    <th
      ref={ref}
      className={joinClasses(
        "whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
});

export interface TableHeaderCellProps
  extends TableHeadProps {}

export const TableHeaderCell = forwardRef<
  HTMLTableCellElement,
  TableHeaderCellProps
>(function TableHeaderCell(
  {
    className,
    ...props
  },
  ref
) {
  return (
    <TableHead
      ref={ref}
      className={className}
      {...props}
    />
  );
});

export interface TableCellProps
  extends Omit<
    TdHTMLAttributes<HTMLTableCellElement>,
    "align"
  > {
  align?: TableAlignment;
}

export const TableCell = forwardRef<
  HTMLTableCellElement,
  TableCellProps
>(function TableCell(
  {
    className,
    align = "left",
    children,
    ...props
  },
  ref
) {
  return (
    <td
      ref={ref}
      className={joinClasses(
        "px-5 py-4 align-middle text-sm text-slate-700",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
});

export interface TableCaptionProps
  extends HTMLAttributes<HTMLTableCaptionElement> {}

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(function TableCaption(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <caption
      ref={ref}
      className={joinClasses(
        "px-5 py-4 text-left text-sm text-slate-500",
        className
      )}
      {...props}
    >
      {children}
    </caption>
  );
});

export interface TableEmptyProps
  extends Omit<
    TdHTMLAttributes<HTMLTableCellElement>,
    "align"
  > {
  title?: string;
  description?: string;
  colSpan?: number;
  align?: TableAlignment;
}

export function TableEmpty({
  title = "Nenhum registro encontrado",
  description = "Os registros aparecerão aqui quando estiverem disponíveis.",
  colSpan = 1,
  align = "center",
  className,
  children,
  ...props
}: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        align={align}
        className={joinClasses(
          "px-6 py-14",
          className
        )}
        {...props}
      >
        {children ?? (
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
              —
            </div>

            <p className="mt-4 font-semibold text-slate-800">
              {title}
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export interface TableMessageProps
  extends Omit<
    TdHTMLAttributes<HTMLTableCellElement>,
    "align"
  > {
  title?: string;
  description?: string;
  colSpan?: number;
  align?: TableAlignment;
}

export function TableMessage({
  title = "Nenhum registro encontrado",
  description = "Não há dados para exibir.",
  colSpan = 1,
  align = "center",
  className,
  children,
  ...props
}: TableMessageProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        align={align}
        className={joinClasses(
          "px-6 py-14",
          className
        )}
        {...props}
      >
        {children ?? (
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
              —
            </div>

            <p className="mt-4 font-semibold text-slate-800">
              {title}
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

TableContainer.displayName = "TableContainer";
Table.displayName = "Table";
TableHeader.displayName = "TableHeader";
TableBody.displayName = "TableBody";
TableFooter.displayName = "TableFooter";
TableRow.displayName = "TableRow";
TableHead.displayName = "TableHead";
TableHeaderCell.displayName = "TableHeaderCell";
TableCell.displayName = "TableCell";
TableCaption.displayName = "TableCaption";

export default Table;