interface Column<T> {
  key:       string;
  header:    string;
  render?:   (row: T) => React.ReactNode;
  width?:    string;
}

interface TableProps<T> {
  columns:    Column<T>[];
  data:       T[];
  loading?:   boolean;
  emptyText?: string;
  keyField:   keyof T;
}

export function Table<T>({
  columns,
  data,
  loading     = false,
  emptyText   = 'No data found',
  keyField,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                <div className="flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={String(row[keyField])}
                className={`
                  border-b border-slate-100 last:border-0
                  hover:bg-slate-50 transition-colors
                  ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                `}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {col.render
                      ? col.render(row)
                      : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}