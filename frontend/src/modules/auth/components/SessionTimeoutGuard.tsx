import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { SessionWarningModal } from './SessionWarningModal';

export function SessionTimeoutGuard({ children }: { children: React.ReactNode }) {
  const { showModal, timeLeft, handleForceLogout, renewSession } = useSessionTimeout();

  return (
    <>
      {children}
      <SessionWarningModal 
        show={showModal} 
        timeLeft={timeLeft} 
        onLogout={() => handleForceLogout(true)} 
        onRenew={() => renewSession(true)} 
      />
    </>
  );
}
