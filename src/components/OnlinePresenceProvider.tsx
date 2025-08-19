import { useOnlinePresence } from '@/hooks/useOnlinePresence';

export const OnlinePresenceProvider = ({ children }: { children: React.ReactNode }) => {
  useOnlinePresence();
  return <>{children}</>;
};