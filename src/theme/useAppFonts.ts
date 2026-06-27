import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium_Italic,
} from '@expo-google-fonts/newsreader';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

/**
 * Loads the KIVO (warm editorial) font families:
 *  - Newsreader — editorial SERIF for screen titles / headlines / key numbers.
 *  - Figtree    — clean SANS for body, labels, UI (400 / 500 / 600 / 700).
 *  - JetBrains Mono — monospace for code / tokens / numeric chips.
 *
 * Returns `[loaded, error]` like expo-font's useFonts.
 */
export function useAppFonts() {
  return useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium_Italic,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
}
