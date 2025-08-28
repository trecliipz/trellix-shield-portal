
import { ShieldCheck, Lock, CheckCircle } from 'lucide-react';

export const SecurityBadge = () => {
  return (
    <div className="w-full bg-card border border-border rounded-lg p-6 mb-8 modern-card">
      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">SSL Secured</h3>
            <p className="text-sm text-muted-foreground">256-bit encryption</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Data Protected</h3>
            <p className="text-sm text-muted-foreground">GDPR Compliant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Verified</h3>
            <p className="text-sm text-muted-foreground">Security audited</p>
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
