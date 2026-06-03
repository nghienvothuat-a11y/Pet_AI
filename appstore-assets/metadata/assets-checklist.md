# Distribution Assets

## App Icon

- `appstore-assets/icon/app-icon-1024.png`
- Size: 1024 x 1024 px
- Source: `UI/Icon.png`
- Synced to: `mobile/assets/icon.png` and `mobile/ios/PetAIMobile/Images.xcassets/AppIcon.appiconset/AppIcon.png`

## Logo

- `appstore-assets/icon/bosscare-logo.png`
- Source: `mobile/assets/logo-ai-paw.png`

## iPhone 6.9-inch Screenshots

Apple currently accepts iPhone 6.9-inch portrait screenshots at 1320 x 2868 px.

- `appstore-assets/screenshots/final/01-bosscare-home-en-6.9.png`
- `appstore-assets/screenshots/final/02-bosscare-vietnamese-6.9.png`
- `appstore-assets/screenshots/final/03-bosscare-symptoms-6.9.png`

## Build Configuration

- Bundle ID: `com.phamduckien.petai`
- Version: `1.0.0`
- Build number: `8`
- AdMob iOS App ID: `ca-app-pub-7806638519709442~7620954816`
- Banner unit: `ca-app-pub-7806638519709442/2642440398`
- Interstitial unit: `ca-app-pub-7806638519709442/6060765050`
- Production distribution should use `expo.extra.useAdMobTestAds: false`.

## App Store Connect Sections To Update

- App Information: name, subtitle, categories, content rights.
- Pricing and Availability / Distribution: confirm countries and price tier.
- App Privacy: disclose OpenAI analysis processing, local scan history, camera/photo permissions, AdMob advertising data, and microphone purpose string.
- iOS App Version: upload the three 6.9-inch screenshots from `appstore-assets/screenshots/final/`.
- App Review Information: paste `appstore-assets/metadata/review-notes.md`.

## App Store Connect Fields Still Needing Owner Input

- Review contact first name
- Review contact last name
- Review contact phone
- Review contact email
- Final support contact email, if different from Apple developer account email
