import { ReactNode } from 'react';

interface Column {
  key: string;
  header: string | ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const Table = ({ 
  columns, 
  data, 
  isLoading = false,
  emptyMessage = 'No data to display'
}: TableProps) => {
  const renderCell = (row: any, column: Column) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return value;
  };
  
  const alignClass = (align: 'left' | 'center' | 'right' = 'left') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((column) => (
              <th 
                key={column.key}
                scope="col"
                className={`px-6 py-4 text-sm font-semibold text-gray-600 ${alignClass(column.align)}`}
                style={column.width ? { width: column.width } : {}}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {isLoading ? (
            <tr>
              <td 
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                <div className="flex justify-center items-center">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr 
                key={row.id || index}
                className="hover:bg-gray-25 transition-colors"
              >
                {columns.map((column) => (
                  <td 
                    key={`${row.id || index}-${column.key}`}
                    className={`px-6 py-4 text-sm text-gray-700 ${alignClass(column.align)}`}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;