# App Review Notes

BossCare does not require login or a demo account.

How to test:

1. Open the app.
2. Keep English selected or switch to Vietnamese.
3. Tap "Choose photo" or "Take photo".
4. Select or capture a clear photo of a dog or cat.
5. Optionally enter symptoms in the text field.
6. Tap "Analyze health".
7. The app sends the image and optional symptom text to the server endpoint and returns a preliminary screening result.

Important safety context:

BossCare is a preliminary pet health screening tool. It does not provide a definitive diagnosis, treatment, medication, or dosage instructions. The app tells users to contact a veterinarian for urgent or serious symptoms.

Data handling:

The MVP does not create user accounts and does not intentionally store uploaded pet photos or analysis results in a database. Images and optional symptom notes are processed to generate the requested analysis.

The mobile app can store scan history locally on the device. Users can delete local scan history from inside the app. The app uses Google AdMob for banner and interstitial ad placements.

Permissions:

Camera and photo library permissions are used to capture or choose pet photos. The iOS build includes a microphone purpose string because camera/audio SDK components may reference microphone APIs; BossCare does not record audio for analysis.

Backend:

Production API endpoint: https://pet-ai-sooty.vercel.app/api/analyze

Reviewer notes:

If the analysis is slow, please wait up to 30 seconds after tapping "Analyze health". Network access is required because the app uses a backend AI analysis service.
