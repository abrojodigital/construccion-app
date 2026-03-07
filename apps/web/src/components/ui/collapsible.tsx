'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

const CollapsibleContext = React.createContext<{
  open: boolean;
  toggle: () => void;
}>({ open: false, toggle: () => {} });

function Collapsible({ open: controlledOpen, defaultOpen = false, onOpenChange, children, className }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const toggle = React.useCallback(() => {
    if (isControlled) {
      onOpenChange?.(!open);
    } else {
      setInternalOpen((prev) => !prev);
    }
  }, [isControlled, open, onOpenChange]);

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div className={className}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

function CollapsibleTrigger({ children, className }: CollapsibleTriggerProps) {
  const { open, toggle } = React.useContext(CollapsibleContext);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn('flex w-full items-center justify-between', className)}
    >
      {children}
      <ChevronDown
        className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
      />
    </button>
  );
}

function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const { open } = React.useContext(CollapsibleContext);

  if (!open) return null;

  return <div className={className}>{children}</div>;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
