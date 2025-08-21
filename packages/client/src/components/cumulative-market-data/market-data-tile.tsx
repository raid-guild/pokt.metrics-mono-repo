import { cn } from "@/lib/utils";

export const MarketDataTile = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="bg-bg-gray rounded-lg p-4 flex flex-col gap-2 justify-center items-center">
      {children}
    </div>
  );
};

export const MarketDataTileTitle = ({ children }: React.PropsWithChildren) => {
  return (
    <h3 className="w-full text-xs text-muted-text flex items-center justify-center gap-2 font-rubik">
      {children}
    </h3>
  );
};

export const MarketDataTileValue = ({ children, className }: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <div className={cn("text-md text-center font-normal flex justify-center items-center h-full", className)}>{children}</div>
  );
};

export const MarketDataTileSkeleton = () => {
  return (
    <div className="bg-bg-gray rounded-lg py-4 flex flex-col gap-2 justify-center items-center">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
      </div>
      <div className="w-20 h-6 bg-gray-300 rounded animate-pulse"></div>
    </div>
  );
};
