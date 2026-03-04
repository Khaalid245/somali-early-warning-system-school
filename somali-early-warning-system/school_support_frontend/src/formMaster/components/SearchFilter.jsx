import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function SearchFilter({ onSearch, onFilter, filters = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    riskLevel: filters.riskLevel || '',
    status: filters.status || '',
    classroom: filters.classroom || '',
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilter?.(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { riskLevel: '', status: '', classroom: '' };
    setLocalFilters(emptyFilters);
    setSearchTerm('');
    onFilter?.(emptyFilters);
    onSearch?.('');
  };

  const activeFilterCount = Object.values(localFilters).filter(v => v).length;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="p-4">
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by student name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {(searchTerm || activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              title="Clear all filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Risk Level Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Risk Level
                </label>
                <select
                  value={localFilters.riskLevel}
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Case Status
                </label>
                <select
                  value={localFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_parent">Awaiting Parent</option>
                  <option value="escalated_to_admin">Escalated</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Classroom Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Classroom
                </label>
                <select
                  value={localFilters.classroom}
                  onChange={(e) => handleFilterChange('classroom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Classrooms</option>
                  {/* Classrooms will be populated dynamically */}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
