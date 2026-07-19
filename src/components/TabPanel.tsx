import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface TabPanelProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const contentVariants = {
  enter: {
    opacity: 0,
    y: 6,
  },
  active: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12, ease: 'easeIn' as const },
  },
};

export default function TabPanel({
  tabs,
  defaultTab,
  activeTab: controlledTab,
  onTabChange,
}: TabPanelProps) {
  const [internalTab, setInternalTab] = useState(
    defaultTab ?? tabs[0]?.id ?? ''
  );
  const tabListRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledTab !== undefined;
  const currentTab = isControlled ? controlledTab : internalTab;

  const selectTab = useCallback(
    (tabId: string) => {
      if (!isControlled) {
        setInternalTab(tabId);
      }
      onTabChange?.(tabId);
    },
    [isControlled, onTabChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = tabs.findIndex((t) => t.id === currentTab);
      let nextIndex: number;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      const nextTab = tabs[nextIndex];
      if (nextTab) {
        selectTab(nextTab.id);
        // Focus the newly active tab button
        const buttons =
          tabListRef.current?.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]'
          );
        buttons?.[nextIndex]?.focus();
      }
    },
    [tabs, currentTab, selectTab]
  );

  const activeTabData = tabs.find((t) => t.id === currentTab);

  return (
    <div className="flex h-full flex-col">
      {/* Tab Bar */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Panel tabs"
        onKeyDown={handleKeyDown}
        className="glass-subtle flex shrink-0 items-stretch border-b border-border bg-bg-elevated"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3
                text-sm font-medium transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1
                focus-visible:ring-offset-[var(--color-bg-elevated)]
                ${
                  isActive
                    ? 'text-text'
                    : 'text-text-muted hover:text-text'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              {/* Active indicator */}
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--color-accent)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTabData && (
            <motion.div
              key={activeTabData.id}
              role="tabpanel"
              id={`tabpanel-${activeTabData.id}`}
              aria-labelledby={`tab-${activeTabData.id}`}
              tabIndex={0}
              variants={contentVariants}
              initial="enter"
              animate="active"
              exit="exit"
              className="custom-scrollbar absolute inset-0 overflow-y-auto"
            >
              {activeTabData.content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export type { Tab, TabPanelProps };
