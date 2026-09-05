import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import { api } from '@/shared/lib';
import { STORAGE_KEYS, SESSION } from '@/shared/constants';

export function useSessionTimeout() {
  const { logout, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION.GRACE_LIMIT);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastActivityUpdateRef = useRef<number>(0);

  const handleForceLogout = useCallback(async (broadcast = true) => {
    if (broadcast && channelRef.current) {
      try {
        channelRef.current.postMessage('logout');
      } catch (e) {
        console.error('Error broadcasting logout', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRED, 'true');

    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Backend logout failed or token already invalid', e);
    }

    logout();
  }, [logout]);

  const renewSession = useCallback((broadcast = true) => {
    const nowStr = Date.now().toString();
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, nowStr);
    setShowModal(false);
    setTimeLeft(SESSION.GRACE_LIMIT);

    if (broadcast && channelRef.current) {
      try {
        channelRef.current.postMessage('keep_alive');
      } catch (e) {
        console.error('Error broadcasting keep_alive', e);
      }
    }
  }, []);

  const registerActivity = useCallback(() => {
    if (!isAuthenticated) return;
    
    const now = Date.now();
    if (now - lastActivityUpdateRef.current > 3000) {
      lastActivityUpdateRef.current = now;
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
      
      if (showModal) {
        renewSession(true);
      }
    }
  }, [isAuthenticated, showModal, renewSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY)) {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    }

    try {
      const channel = new BroadcastChannel(STORAGE_KEYS.SESSION_CHANNEL);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data === 'keep_alive') {
          setShowModal(false);
          setTimeLeft(SESSION.GRACE_LIMIT);
        } else if (event.data === 'logout') {
          handleForceLogout(false);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((name) => window.addEventListener(name, registerActivity, { passive: true }));

    const interval = setInterval(() => {
      const lastActivity = Number(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY) || Date.now());
      const now = Date.now();
      const diff = now - lastActivity;

      if (diff >= SESSION.INACTIVITY_LIMIT) {
        setShowModal(true);
        const timePassedSinceLimit = Math.floor((diff - SESSION.INACTIVITY_LIMIT) / 1000);
        const secondsRemaining = Math.max(0, SESSION.GRACE_LIMIT - timePassedSinceLimit);
        setTimeLeft(secondsRemaining);

        if (secondsRemaining <= 0) {
          clearInterval(interval);
          handleForceLogout(true);
        }
      } else if (showModal) {
        setShowModal(false);
      }
    }, 1000);

    return () => {
      events.forEach((name) => window.removeEventListener(name, registerActivity));
      clearInterval(interval);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [isAuthenticated, registerActivity, handleForceLogout, showModal]);

  return { showModal, timeLeft, handleForceLogout, renewSession };
}
