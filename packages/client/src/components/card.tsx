import { PropsWithChildren } from 'react';

export const Card = ({ title, children, separateTitle = false }: PropsWithChildren<{ title: string; separateTitle?: boolean }>) => {
  if (separateTitle) {
    return (
      <div className="bg-background rounded-lg w-full">
        <h2 className="text-lg font-bold bg-primary text-white rounded-lg p-4 mb-4">{title}</h2>
        {children}
      </div>
    );
  }
  return (
    <div className="bg-background rounded-lg w-full">
      <div className="flex justify-between flex-col">
        <h2 className="text-lg font-bold bg-primary text-white rounded-t-lg p-4 ">{title}</h2>
        <div className="p-8 border-border-card border-1 border-t-0 rounded-b-lg">
          {children}
        </div>
      </div>
    </div>
  );
};
