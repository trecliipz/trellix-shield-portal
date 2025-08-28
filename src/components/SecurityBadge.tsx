import { ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const SecurityBadge = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full text-green-600 dark:text-green-400 transition-all duration-300 hover:scale-105 cursor-pointer">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Secure SSL</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>This site is protected with SSL encryption</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};