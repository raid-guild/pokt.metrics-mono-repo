import { PropsWithChildren } from 'react';

import { cn } from '../lib/utils';

export const Card = ({ title, children, separateTitle = false, className }: PropsWithChildren<{ title: string; separateTitle?: boolean, className?: string; }>) => {
  if (separateTitle) {
    return (
      <div className={cn("bg-background rounded-lg w-full", className)}>
        <h2 className="text-lg font-bold font-rubik bg-primary text-white rounded-lg p-4 mb-4">{title}</h2>
        {children}
      </div>
    );
  }
  return (
    <div className={cn("bg-background rounded-lg w-full", className)}>
      <div className="flex justify-between flex-col">
        <h2 className="text-lg font-bold font-rubik bg-primary text-white rounded-t-lg p-4 ">{title}</h2>
        <div className="p-8 border-bg-gray border-1 border-t-0 rounded-b-lg">
          {children}
        </div>
      </div>
    </div>
  );
};
