import { useSSOCallback } from '../hooks/useSSOCallback';
import { SSOLoadingScreen } from '../components/SSOLoadingScreen';

export function SSOCallbackPage() {
  useSSOCallback();

  return <SSOLoadingScreen />;
}
