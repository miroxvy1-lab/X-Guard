import { useCallback } from 'react';
import { playDeniedAccessSound, playSystemLockoutSound, playUnlockSound } from '../utils/audio';

export type SecuritySoundType = 'invalid_password' | 'forced_lockout' | 'success_auth';

export function useSecurityAudio() {
  const triggerSecuritySound = useCallback((type: SecuritySoundType) => {
    try {
      switch (type) {
        case 'invalid_password':
          // Invalid password entry - low-pitched sawtooth dual buzz
          playDeniedAccessSound();
          break;
        case 'forced_lockout':
          // Forced system lockout siren - alternating warning frequency buzzer
          playSystemLockoutSound();
          break;
        case 'success_auth':
          // Successful authentication - cheerful rising three-tone chime
          playUnlockSound();
          break;
        default:
          break;
      }
    } catch (error) {
      console.warn('Failed to trigger security sound cue:', error);
    }
  }, []);

  return { triggerSecuritySound };
}
