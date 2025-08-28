
import { ShieldCheck, Lock, CheckCircle } from 'lucide-react';

export const SecurityBadge = () => {
  return (
    <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full">
            <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">SSL Secured</h3>
            <p className="text-sm text-green-600 dark:text-green-400">256-bit encryption</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Data Protected</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">GDPR Compliant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-800 dark:text-purple-300">Verified</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">Security audited</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          This site is secured with industry-standard SSL encryption and follows strict security compliance protocols to protect your data and privacy.
        </p>
      </div>
    </div>
  );
};
