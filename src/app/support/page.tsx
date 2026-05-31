import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | BossCare",
  description: "BossCare support information."
};

export default function SupportPage() {
  return (
    <main className="legalPage">
      <section className="legalCard">
        <p className="eyebrow">BossCare</p>
        <h1>Support</h1>
        <p>
          BossCare provides preliminary pet health screening from a clear pet photo and optional symptom notes. It does
          not replace a veterinarian.
        </p>

        <h2>Before using analysis</h2>
        <p>
          Use a clear photo of the pet&apos;s face, eyes, skin, or the area you want to check. Add symptom notes when
          possible so the analysis has more context.
        </p>

        <h2>Urgent cases</h2>
        <p>
          If your pet has breathing trouble, heavy bleeding, seizures, loss of consciousness, severe pain, eye trauma,
          or prolonged appetite loss, contact a veterinarian immediately.
        </p>

        <h2>Contact</h2>
        <p>
          For app support, use the App Store developer contact option for BossCare or contact the developer account
          associated with the app listing.
        </p>
      </section>
    </main>
  );
}
