import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';

/**
 * Loads the STEEP font families:
 *  - Fraunces (editorial serif) for screen titles / headlines ONLY.
 *  - Inter (clean sans, weights 400 / 500 only) for everything else.
 *
 * Poppins has been removed. Returns `[loaded, error]` like expo-font's useFonts.
 */
export function useAppFonts() {
  return useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
  });
}
