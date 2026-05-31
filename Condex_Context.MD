# Codex Context - BossCare

## Project

- Project path: `/Users/mrk/Pet_AI`
- Git remote: `git@github.com:nghienvothuat-a11y/Pet_AI.git`
- Branch: `main`
- Web production: `https://pet-ai-sooty.vercel.app`

## App Identity

- App name: `BossCare`
- iOS bundle id: `com.phamduckien.petai`
- Apple Team ID: `D5UM5ZR38A`
- App Store Connect app name: `BossCare`
- Current uploaded TestFlight build: `4`

## Structure

- Web app: repo root
- Mobile app: `mobile/`
- iOS workspace: `mobile/ios/PetAIMobile.xcworkspace`
- iOS export options: `mobile/ios/ExportOptions.plist`

## Current Product State

- App has been renamed from Pet AI to BossCare on web and mobile.
- UI has a cute pet-care style.
- Loading screen includes the app logo, loading bar, and running dog icon.
- Image picking works from the plus/add-image control.
- Camera support was fixed for iPhone/TestFlight.
- Symptom text input was added above the camera and image picker buttons.
- Analysis sends both image and symptom text to the backend.
- Result UI is short by default.
- Predicted disease is emphasized.
- Extra details are collapsed behind detail sections.
- Language selector exists on web and mobile.
- Default language is English.
- Vietnamese is also supported.

## Recent Git State

- Latest important commit pushed: `d9ed764 Rename app to BossCare and add language selector`
- Git status was clean after TestFlight upload.

## TestFlight

- Build `4` was archived and uploaded successfully using Xcode.
- Upload result: `Upload succeeded`
- Xcode warning seen during upload:
  - Missing dSYM for `hermes.framework`
  - This warning did not block the upload.
- After upload, App Store Connect/TestFlight may need a few minutes to process the build.

## Useful Commands

Run web locally:

```bash
cd /Users/mrk/Pet_AI
npm run dev
```

Run mobile on iOS simulator:

```bash
cd /Users/mrk/Pet_AI/mobile
npx expo run:ios
```

Open iOS project in Xcode:

```bash
open /Users/mrk/Pet_AI/mobile/ios/PetAIMobile.xcworkspace
```

Check git:

```bash
cd /Users/mrk/Pet_AI
git status
```

## Suggested Prompt For New Codex Session

Use this when opening a new terminal or new Codex session:

```text
Mở dự án BossCare ở /Users/mrk/Pet_AI, đọc Condex_Context.MD trước rồi tiếp tục làm việc từ trạng thái hiện tại.
```
