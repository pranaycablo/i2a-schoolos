import React, { useState, useRef, useEffect } from 'react';
import { School, ChevronDown, Check, Search, Building2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Badge } from '../../design-system/components/Badge';

export const MultiTenantSelector: React.FC = () => {
  const { activeTenant, tenants, loginToSchool, currentRole } = useSchool();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isMultiSchoolAdmin = ['SUPER_ADMIN', 'TRUSTEE', 'DIRECTOR'].includes(currentRole);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectSchool = (schoolId: string) => {
    if (schoolId !== activeTenant?.id) {
      loginToSchool(schoolId, currentRole);
    }
    setIsOpen(false);
    setSearch('');
  };

  // If single school user, render clean non-interactive indicator
  if (!isMultiSchoolAdmin && tenants.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
        <School className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
          {activeTenant?.name || 'School Portal'}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs transition-colors focus-ring cursor-pointer"
      >
        <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px] sm:max-w-[180px]">
            {activeTenant?.name || 'Select School'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {activeTenant?.id} • {activeTenant?.city}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in"
        >
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Switch Institution / Branch
              </span>
              <Badge variant="brand" size="sm">
                {tenants.length} Branches
              </Badge>
            </div>
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city, ID..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTenants.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching institutions found
              </div>
            ) : (
              filteredTenants.map((t) => {
                const isSelected = t.id === activeTenant?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectSchool(t.id)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate">{t.name}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{t.id}</span>
                        <span>•</span>
                        <span>{t.board}</span>
                        <span>•</span>
                        <span>{t.city}</span>
                      </div>
                    </div>
                    <Badge
                      variant={t.subscriptionStatus === 'ACTIVE' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {t.subscriptionStatus}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
