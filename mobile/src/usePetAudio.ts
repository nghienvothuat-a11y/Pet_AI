import { useEffect, useRef } from "react";
import { Audio } from "expo-av";

const DOG_RESULT_SOUND = require("../assets/sounds/dog-bark.caf");
const CAT_RESULT_SOUND = require("../assets/sounds/cat-meow.caf");
const BACKGROUND_MUSIC = require("../assets/sounds/chill-loop.caf");

const RESULT_SOUND_VOLUME = 0.35;
const BACKGROUND_MUSIC_VOLUME = 0.16;

export function usePetAudio({
  isAppReady,
  backgroundMusicEnabled,
  soundEffectsEnabled
}: {
  isAppReady: boolean;
  backgroundMusicEnabled: boolean;
  soundEffectsEnabled: boolean;
}) {
  const resultSoundRef = useRef<Audio.Sound | null>(null);
  const backgroundMusicRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      resultSoundRef.current?.unloadAsync().catch(() => undefined);
      resultSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (soundEffectsEnabled) {
      return;
    }

    resultSoundRef.current?.unloadAsync().catch(() => undefined);
    resultSoundRef.current = null;
  }, [soundEffectsEnabled]);

  useEffect(() => {
    if (!isAppReady || !backgroundMusicEnabled) {
      backgroundMusicRef.current?.unloadAsync().catch(() => undefined);
      backgroundMusicRef.current = null;
      return;
    }

    let isCancelled = false;

    async function startBackgroundMusic() {
      try {
        await configureAudioMode();

        const { sound } = await Audio.Sound.createAsync(BACKGROUND_MUSIC, {
          isLooping: true,
          shouldPlay: true,
          volume: BACKGROUND_MUSIC_VOLUME
        });

        if (isCancelled) {
          await sound.unloadAsync();
          return;
        }

        backgroundMusicRef.current = sound;
      } catch (soundError) {
        console.warn("Could not play background music", soundError);
      }
    }

    void startBackgroundMusic();

    return () => {
      isCancelled = true;
      backgroundMusicRef.current?.unloadAsync().catch(() => undefined);
      backgroundMusicRef.current = null;
    };
  }, [backgroundMusicEnabled, isAppReady]);

  async function playResultSound(petTypeGuess: string) {
    if (!soundEffectsEnabled) {
      return;
    }

    const soundAsset = petTypeGuess === "cat" ? CAT_RESULT_SOUND : DOG_RESULT_SOUND;

    try {
      await resultSoundRef.current?.unloadAsync();
      resultSoundRef.current = null;
      await configureAudioMode();

      const { sound } = await Audio.Sound.createAsync(soundAsset, {
        shouldPlay: true,
        volume: RESULT_SOUND_VOLUME
      });

      resultSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => undefined);
          if (resultSoundRef.current === sound) {
            resultSoundRef.current = null;
          }
        }
      });
    } catch (soundError) {
      console.warn("Could not play result sound", soundError);
    }
  }

  return { playResultSound };
}

async function configureAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true
  });
}
