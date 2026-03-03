import { useState } from 'react';

export default function ResponsiveTable({ 
  data, 
  columns, 
  onRowClick, 
  selectable = false, 
  selectedItems = new Set(),
  onSelectionChange,
  mobileCardRenderer 
}) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSelectAll = () => {
    if (selectedItems.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(item => item.id || item.student_id)));
    }
  };

  const handleItemSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    onSelectionChange(newSelected);
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              {selectable && (
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                </th>
              )}
              {columns.map(column => (
                <th 
                  key={column.key}
                  className={`p-4 text-left font-semibold text-gray-700 ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr 
                key={item.id || item.student_id || index}
                className={`border-b hover:bg-gray-50 transition ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {selectable && (
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id || item.student_id)}
                      onChange={() => handleItemSelect(item.id || item.student_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td key={column.key} className="p-4">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {selectable && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItems.size === data.length && data.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Select All ({selectedItems.size})</span>
            </label>
          </div>
        )}
        
        {sortedData.map((item, index) => (
          <div 
            key={item.id || item.student_id || index}
            className={`bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 ${
              onRowClick ? 'cursor-pointer hover:border-blue-400' : ''
            }`}
            onClick={() => onRowClick && onRowClick(item)}
          >
            {selectable && (
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id || item.student_id)}
                  onChange={() => handleItemSelect(item.id || item.student_id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded mr-2"
                />
                <span className="text-sm text-gray-600">Select</span>
              </div>
            )}
            
            {mobileCardRenderer ? mobileCardRenderer(item) : (
              <div className="space-y-2">
                {columns.map(column => (
                  <div key={column.key} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">{column.label}:</span>
                    <span className="text-sm text-gray-900">
                      {column.render ? column.render(item) : item[column.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}