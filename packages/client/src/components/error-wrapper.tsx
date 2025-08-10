import { cn } from "@/lib/utils";

export const ErrorWrapper = ({ 
  children, 
  className 
}: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <div className={cn(
      "w-full p-6 rounded-lg border border-negative-red/20 bg-negative-red/5",
      "flex flex-col items-center justify-center gap-3 text-center",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-negative-red/10 flex items-center justify-center">
        <svg 
          className="w-6 h-6 text-negative-red" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-negative-red">Something went wrong</h3>
        <p className="text-sm text-negative-red/80">{children}</p>
      </div>
    </div>
  );
};