import React, { createContext, useContext, useId } from 'react';

interface TabsContextType {
  activeTab: string;
  onTabChange: (id: string) => void;
  baseId: string;
  variant: 'line' | 'pills';
}

const TabsContext = createContext<TabsContextType | null>(null);

export interface TabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
  variant?: 'line' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onTabChange,
  children,
  variant = 'line',
  className = '',
}) => {
  const baseId = useId();

  return (
    <TabsContext.Provider value={{ activeTab, onTabChange, baseId, variant }}>
      <div className={`space-y-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  const ctx = useContext(TabsContext);
  const variant = ctx?.variant || 'line';

  const containerStyles =
    variant === 'line'
      ? 'border-b border-slate-200 dark:border-slate-800 gap-6'
      : 'p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 gap-1';

  return (
    <div
      role="tablist"
      className={`flex items-center overflow-x-auto ${containerStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const TabTrigger: React.FC<TabTriggerProps> = ({
  value,
  icon,
  badge,
  children,
  className = '',
  ...props
}) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabTrigger must be used within Tabs');

  const isActive = ctx.activeTab === value;
  const tabId = `${ctx.baseId}-tab-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;

  const variantStyles =
    ctx.variant === 'line'
      ? isActive
        ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold pb-2.5'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent pb-2.5'
      : isActive
      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm rounded-lg py-1.5 px-3'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1.5 px-3 rounded-lg';

  return (
    <button
      role="tab"
      id={tabId}
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      onClick={() => ctx.onTabChange(value)}
      className={`inline-flex items-center gap-2 text-xs sm:text-sm transition-all duration-150 cursor-pointer focus-ring shrink-0 ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </button>
  );
};

export interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabContent: React.FC<TabContentProps> = ({
  value,
  children,
  className = '',
  ...props
}) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabContent must be used within Tabs');

  const isActive = ctx.activeTab === value;
  const tabId = `${ctx.baseId}-tab-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      tabIndex={0}
      className={`focus:outline-none animate-fade-in ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
