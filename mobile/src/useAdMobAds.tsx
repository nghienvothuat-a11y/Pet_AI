import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import mobileAds, {
  AdEventType,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  TestIds
} from "react-native-google-mobile-ads";

const configuredBannerUnitId = Constants.expoConfig?.extra?.admobBannerUnitId;
const configuredInterstitialUnitId = Constants.expoConfig?.extra?.admobInterstitialUnitId;
const configuredUseTestAds = Constants.expoConfig?.extra?.useAdMobTestAds;
const shouldUseTestAds = configuredUseTestAds === true;

let adMobInitializationPromise: Promise<unknown> | null = null;

function initializeAdMob() {
  if (!adMobInitializationPromise) {
    adMobInitializationPromise = mobileAds().initialize();
  }

  return adMobInitializationPromise;
}

export const ADMOB_BANNER_UNIT_ID =
  shouldUseTestAds
    ? TestIds.BANNER
    : typeof configuredBannerUnitId === "string" && configuredBannerUnitId
    ? configuredBannerUnitId
    : TestIds.BANNER;

export const ADMOB_INTERSTITIAL_UNIT_ID =
  shouldUseTestAds
    ? TestIds.INTERSTITIAL
    : typeof configuredInterstitialUnitId === "string" && configuredInterstitialUnitId
    ? configuredInterstitialUnitId
    : TestIds.INTERSTITIAL;

export function useAdMobInterstitial() {
  const [isLoaded, setIsLoaded] = useState(false);
  const interstitialRef = useRef<InterstitialAd | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const interstitial = useMemo(
    () =>
      InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true
      }),
    []
  );

  useEffect(() => {
    interstitialRef.current = interstitial;

    function clearRetryTimeout() {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }

    function scheduleLoadRetry() {
      clearRetryTimeout();
      retryTimeoutRef.current = setTimeout(() => {
        interstitial.load();
      }, 30000);
    }

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      clearRetryTimeout();
      setIsLoaded(true);
    });
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setIsLoaded(false);
      interstitial.load();
    });
    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn("Could not load interstitial ad", error);
      setIsLoaded(false);
      scheduleLoadRetry();
    });

    initializeAdMob()
      .then(() => {
        interstitial.load();
      })
      .catch((error) => {
        console.warn("Could not initialize AdMob", error);
      });

    return () => {
      clearRetryTimeout();
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      interstitialRef.current = null;
    };
  }, [interstitial]);

  function showInterstitial() {
    if (!isLoaded || !interstitialRef.current) {
      interstitialRef.current?.load();
      return;
    }

    interstitialRef.current.show().catch((error) => {
      console.warn("Could not show interstitial ad", error);
      setIsLoaded(false);
      interstitialRef.current?.load();
    });
  }

  return { showInterstitial };
}

export function BottomAdBanner() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    initializeAdMob()
      .then(() => {
        if (isMounted) {
          setIsInitialized(true);
        }
      })
      .catch((error) => {
        console.warn("Could not initialize AdMob", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.bannerContainer}>
      {isInitialized ? (
        <BannerAd
          unitId={ADMOB_BANNER_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={(error) => {
            console.warn("Could not load banner ad", error);
          }}
        />
      ) : null}
    </View>
  );
}

/*
 * Keep the current TestFlight build on Google test ads so the ad surfaces can be
 * verified before AdMob starts serving live inventory for the new app/ad units.
 */
export const ADMOB_BUILD_USES_TEST_ADS = shouldUseTestAds;

const styles = StyleSheet.create({
  bannerContainer: {
    minHeight: 56,
    backgroundColor: "#FFF8EF",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1DFCC"
  }
});
