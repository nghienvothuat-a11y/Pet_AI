import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | BossCare",
  description: "BossCare privacy policy for app review and users."
};

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <section className="legalCard">
        <p className="eyebrow">BossCare</p>
        <h1>Privacy Policy</h1>
        <p>Last updated: June 2, 2026</p>

        <h2>What BossCare does</h2>
        <p>
          BossCare helps users perform a preliminary pet health screening by sending a pet photo and optional symptom
          text to an AI analysis service. BossCare is not a veterinary diagnosis tool and does not replace professional
          veterinary care.
        </p>

        <h2>Information we process</h2>
        <p>
          When you request an analysis, the app processes the pet photo you choose or take, optional symptom text, the
          selected language, and basic technical request data needed to operate the service.
        </p>
        <p>
          On the mobile app, BossCare can also save scan history locally on your device. A local history item may include
          the copied pet photo, symptom text, selected language, analysis result, risk level, and scan date.
        </p>

        <h2>How information is used</h2>
        <p>
          The submitted photo and symptom text are used only to generate the pet health screening result and operate,
          secure, and improve the service.
        </p>

        <h2>Third-party processing</h2>
        <p>
          BossCare uses OpenAI services to analyze submitted images and text. Submitted content may be processed by
          OpenAI according to its applicable service terms and privacy commitments.
        </p>
        <p>
          BossCare uses Google AdMob to show ads in the mobile app. AdMob may process device, app, advertising, and
          diagnostic data to deliver, measure, and improve ads according to Google&apos;s policies.
        </p>

        <h2>Storage</h2>
        <p>
          BossCare does not create user accounts and does not store your scan history in BossCare cloud storage. Mobile
          scan history is stored locally inside the app storage area on your device so you can review previous scans.
          You can delete local scan history from inside the app.
        </p>
        <p>
          When you request an AI analysis, the selected photo and symptom text are temporarily sent to the BossCare
          backend and OpenAI to generate the screening result. BossCare does not intentionally keep those uploaded photos
          or results in a server-side user history database.
        </p>

        <h2>Device permissions</h2>
        <p>
          BossCare may request camera access to take pet photos and photo library access to choose pet photos. Saving
          scan history inside the app&apos;s local storage does not require additional photo library or cloud storage
          permission.
        </p>
        <p>
          The iOS app includes a microphone usage description because camera and audio SDK components may reference
          microphone APIs. BossCare does not record audio for pet health analysis.
        </p>

        <h2>Children</h2>
        <p>BossCare is intended for general audiences and does not knowingly collect personal information from children.</p>

        <h2>Contact</h2>
        <p>
          For privacy questions or support, contact the developer through the App Store support link for BossCare.
        </p>
      </section>
    </main>
  );
}
