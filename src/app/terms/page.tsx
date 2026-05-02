import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${brand.name}.`,
};

const EFFECTIVE_DATE = "May 2, 2026";

export default function TermsPage() {
  return (
    <article className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-14">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            Legal
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-cream-100 mb-4">
            Terms of <span className="font-display-italic text-gold-shine">Service</span>
          </h1>
          <p className="text-cream-200/55 text-sm">
            Effective {EFFECTIVE_DATE}
          </p>
        </header>

        <div className="prose-legal text-cream-200/80 leading-relaxed space-y-8 text-[15px]">
          <p className="text-cream-100/90">
            Welcome to {brand.name}. These Terms of Service (the &ldquo;<strong>Terms</strong>&rdquo;) form a binding contract between you (&ldquo;<strong>you</strong>&rdquo; or the &ldquo;<strong>Customer</strong>&rdquo;) and {brand.name} (&ldquo;<strong>{brand.name}</strong>,&rdquo; &ldquo;<strong>we</strong>,&rdquo; &ldquo;<strong>us</strong>,&rdquo; or &ldquo;<strong>our</strong>&rdquo;) and govern your access to and use of the {brand.name} website, the personalized songwriting service, and any related products, features, and content (together, the &ldquo;<strong>Service</strong>&rdquo;). Please read these Terms carefully. By using the Service, you agree to be bound by them.
          </p>

          <p className="bg-ink-900/60 border border-gold-700/15 rounded-lg p-5 text-cream-200/85">
            <strong className="text-cream-100">Plain-English summary (not a substitute for the Terms):</strong> You can use {brand.name} to create personalized songs. You must be 18 or older. You promise that the photos and details you upload are yours to share. We use AI (Anthropic) to draft lyrics and we tell you when something is a draft. Once your song is delivered, it&rsquo;s yours to keep and share for personal use. We don&rsquo;t use your song for our marketing without your permission. If something goes wrong, our liability is limited to what you paid us. Disputes are handled by arbitration in the state listed in Section 18.
          </p>

          <Section id="1" title="1. Eligibility and Acceptance">
            <p>
              You must be at least eighteen (18) years old and have the legal capacity to enter into a contract to use the Service. By using the Service, you represent and warrant that you meet these requirements. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization, and &ldquo;you&rdquo; refers to both you individually and that organization.
            </p>
            <p>
              The Service is intended for personal, non-commercial use unless we expressly agree otherwise in writing. Practitioners (e.g., therapists, clinicians, planners) using the Service in their work agree to the additional terms communicated as part of our practitioner program.
            </p>
          </Section>

          <Section id="2" title="2. Description of the Service">
            <p>
              {brand.name} is a personalized songwriting service. You provide written answers, optional photographs, recipient details, and other information about a person, relationship, or moment (collectively, your &ldquo;<strong>Inputs</strong>&rdquo;). Depending on the tier you select, we use a combination of artificial-intelligence systems and human songwriters and producers to produce lyrics, audio recordings, lyric sheets, and related deliverables (collectively, the &ldquo;<strong>Deliverables</strong>&rdquo;).
            </p>
            <p>
              The current tiers and what each includes are described on the pricing section of our site. We may change, add, or retire tiers at our discretion; changes will not retroactively affect orders that have already been accepted.
            </p>
          </Section>

          <Section id="3" title="3. Orders, Payment, and Taxes">
            <p>
              <strong>Order acceptance.</strong> Submitting an order through the Service is an offer by you to purchase a Deliverable. An order is accepted when we charge your payment method (or, for the free Lyric Preview tier, when we generate the draft lyrics). We may decline or cancel any order at our discretion, including for suspected fraud, content that violates Section 6, or capacity reasons; if we cancel, we will refund any amount charged.
            </p>
            <p>
              <strong>Payment.</strong> Paid tiers are processed by Stripe, our payment processor, in U.S. dollars. By providing payment information, you authorize Stripe and us to charge the amount shown at checkout, including applicable taxes. You agree to provide current, complete, and accurate billing information.
            </p>
            <p>
              <strong>Taxes.</strong> Prices shown do not include taxes unless stated. You are responsible for any sales, use, value-added, or similar taxes assessed on your purchase, except taxes imposed on our net income.
            </p>
            <p>
              <strong>Chargebacks.</strong> If you initiate a chargeback or payment dispute without first contacting us in good faith at <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">{brand.contact.email}</a>, we may suspend your access and revoke any license granted under Section 8.
            </p>
          </Section>

          <Section id="4" title="4. Revisions and Refunds">
            <p>
              Each paid tier includes a defined number of revision rounds, as listed on the pricing section at the time of purchase. A &ldquo;revision&rdquo; means changes to lyrics, vocal style, instrumentation, mix, or arrangement of an existing Deliverable; it does not include re-writing the song from a substantially different premise.
            </p>
            <p>
              <strong>Refunds for non-delivery.</strong> If we fail to deliver the Deliverable within the turnaround window stated for your tier (subject to extensions for revisions you request, force majeure under Section 19, or information we&rsquo;ve requested from you and not received), you may request a full refund within fourteen (14) days of the missed window.
            </p>
            <p>
              <strong>Refunds for dissatisfaction.</strong> Because each Deliverable is custom-made for you, we do not offer refunds based on subjective dissatisfaction once your included revision rounds have been used. We will, however, work in good faith to address concerns raised before your revisions are exhausted. If you believe a Deliverable is materially defective (e.g., wrong recipient name, corrupted audio, broken file), notify us within thirty (30) days of delivery and we will repair or replace it.
            </p>
            <p>
              <strong>Lyric Preview.</strong> The free Lyric Preview tier produces an AI-drafted lyric only. There is nothing to refund. The preview is a draft and is not a substitute for a paid Deliverable.
            </p>
          </Section>

          <Section id="5" title="5. Use of Artificial Intelligence">
            <p>
              You acknowledge and agree that {brand.name} uses third-party artificial-intelligence services, including without limitation Anthropic&rsquo;s Claude models, to draft and assist in producing the Deliverables. AI outputs may contain inaccuracies, surprising creative choices, or details that differ from your expectations. You should review every Deliverable carefully before sharing it.
            </p>
            <p>
              <strong>No professional advice.</strong> A song is a creative work, not professional advice. The Service is not a substitute for therapy, counseling, medical care, legal advice, financial advice, or any licensed professional service, even when used by, or in collaboration with, a licensed practitioner.
            </p>
            <p>
              <strong>Sensitivity content.</strong> You acknowledge that the Service is frequently used for memorials, grief, illness, estrangement, and other emotionally sensitive contexts. We strive for care and craft, but you remain responsible for evaluating the appropriateness of any Deliverable before sharing it with the recipient or any third party.
            </p>
          </Section>

          <Section id="6" title="6. Your Inputs and Responsibilities">
            <p>
              <strong>Ownership of Inputs.</strong> You retain all rights you have in your Inputs.
            </p>
            <p>
              <strong>License to us.</strong> You grant {brand.name} a worldwide, non-exclusive, royalty-free license to host, store, reproduce, modify, transmit, and use your Inputs for the limited purpose of providing, improving, and supporting the Service, including transmitting your Inputs to third-party processors used to generate or deliver the Deliverable. This license ends when we delete your Inputs in accordance with our Privacy Policy, except that we may retain de-identified, aggregated information indefinitely.
            </p>
            <p>
              <strong>Your warranties.</strong> You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>You own or have the right to share every photograph and other piece of content you submit, including the rights to any people pictured in those photographs;</li>
              <li>Your Inputs do not infringe any copyright, trademark, right of publicity, right of privacy, or other right of any third party;</li>
              <li>Your Inputs are not unlawful, defamatory, harassing, threatening, sexually explicit involving any minor, or otherwise objectionable; and</li>
              <li>You will not submit personal data of another person (including the recipient of the song) unless you have a lawful basis to do so under applicable privacy law.</li>
            </ul>
            <p>
              <strong>Prohibited uses.</strong> You will not use the Service to (a) impersonate a real person without their consent in a way intended to deceive; (b) generate sexual content involving any identifiable real person; (c) generate content intended to harass, dox, or threaten a real person; (d) violate intellectual-property or publicity rights; or (e) violate any law.
            </p>
          </Section>

          <Section id="7" title="7. Photographs of Real People">
            <p>
              You may upload photographs of yourself and others. If a photograph depicts a person other than you, you represent and warrant that you have the right to share the image with us for the limited use described in these Terms and our Privacy Policy. If you cannot make that representation, do not upload the photograph.
            </p>
            <p>
              We do not use photographs to perform facial recognition, biometric identification, or training of any artificial-intelligence model. Photographs are used only to inform the human and AI work needed to produce your Deliverable, and they are stored, transmitted, and deleted as described in our <Link href="/privacy" className="text-gold-300 hover:text-gold-200 underline underline-offset-4">Privacy Policy</Link>.
            </p>
          </Section>

          <Section id="8" title="8. Ownership of Deliverables and License to You">
            <p>
              Subject to your full payment and your continued compliance with these Terms, on delivery of a paid Deliverable to you, {brand.name} grants you a perpetual, worldwide, non-exclusive, royalty-free, transferable license to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Reproduce, perform, display, and distribute the Deliverable for personal, non-commercial purposes (e.g., private listening, sharing with the recipient, playing at a wedding, funeral, birthday, or other private gathering);</li>
              <li>Create copies for backup; and</li>
              <li>Share the Deliverable on your own personal social-media accounts.</li>
            </ul>
            <p>
              <strong>Commercial use.</strong> Commercial use of a Deliverable (including without limitation use in advertising, monetized streaming releases, broadcast use, and use in connection with the sale of goods or services) requires a separate written license from us. Contact <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">{brand.contact.email}</a>.
            </p>
            <p>
              <strong>Free Lyric Previews.</strong> Free Lyric Preview Deliverables are licensed to you for personal use only and may not be commercially exploited.
            </p>
            <p>
              <strong>Our retained rights.</strong> We do not use your Deliverables in our marketing, public portfolio, or training data without your prior written consent. We may retain technical copies for archival, dispute-resolution, and legal-compliance purposes.
            </p>
            <p>
              <strong>Underlying systems.</strong> Nothing in these Terms transfers ownership of the Service itself, our software, our prompts, our musical templates, or our trademarks (collectively, the &ldquo;<strong>{brand.name} IP</strong>&rdquo;), all of which remain our exclusive property.
            </p>
          </Section>

          <Section id="9" title="9. Acceptable Use">
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Reverse-engineer, decompile, or attempt to extract source code or model weights from the Service;</li>
              <li>Use the Service to build a competing product or to train any machine-learning model;</li>
              <li>Probe, scan, or test the vulnerability of the Service, or interfere with its operation, except as part of a coordinated security disclosure under Section 19;</li>
              <li>Access the Service through automated means, scrape it, or impose unreasonable load on it;</li>
              <li>Submit malicious code, files, or links;</li>
              <li>Misrepresent your identity or affiliation; or</li>
              <li>Use the Service in any manner that violates applicable law.</li>
            </ul>
          </Section>

          <Section id="10" title="10. Third-Party Services">
            <p>
              The Service relies on third-party services, including without limitation Anthropic (AI processing), Stripe (payments), Resend (email delivery), and Vercel (hosting). Your use of those services through us is subject to their own terms; we are not responsible for their acts or omissions, except as required by applicable law. Links from the Service to third-party websites are provided for convenience only.
            </p>
          </Section>

          <Section id="11" title="11. Practitioner Use">
            <p>
              If you use the Service in your work as a licensed clinician, therapist, planner, or other practitioner with or on behalf of a client, you represent that: (i) you have the consents needed to share that client&rsquo;s information with us; (ii) you alone are responsible for clinical judgments, diagnoses, and the appropriateness of any Deliverable for that client; and (iii) you will not represent the Service as a healthcare service, an FDA-regulated product, or a treatment.
            </p>
          </Section>

          <Section id="12" title="12. Disclaimer of Warranties">
            <p>
              EXCEPT AS EXPRESSLY STATED IN THESE TERMS AND TO THE FULLEST EXTENT PERMITTED BY LAW, THE SERVICE AND ALL DELIVERABLES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION ANY WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, OR THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. WE DO NOT WARRANT THAT AI-GENERATED CONTENT WILL BE ACCURATE, APPROPRIATE, OR FREE OF ARTIFACTS, AND YOU AGREE TO REVIEW EACH DELIVERABLE BEFORE SHARING IT.
            </p>
          </Section>

          <Section id="13" title="13. Limitation of Liability">
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>IN NO EVENT WILL {brand.name.toUpperCase()} OR ITS OFFICERS, EMPLOYEES, CONTRACTORS, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST GOODWILL, LOST DATA, OR EMOTIONAL DISTRESS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</li>
              <li>OUR TOTAL CUMULATIVE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE IN ANY TWELVE-MONTH PERIOD WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU ACTUALLY PAID US FOR THE SERVICE IN THAT PERIOD, OR (B) ONE HUNDRED U.S. DOLLARS ($100).</li>
            </ul>
            <p>
              Some jurisdictions do not allow the exclusion of certain warranties or the limitation of certain damages, so some of the above may not apply to you. Nothing in these Terms limits liability that cannot lawfully be limited.
            </p>
          </Section>

          <Section id="14" title="14. Indemnification">
            <p>
              You will defend, indemnify, and hold harmless {brand.name} and its officers, employees, contractors, and agents from and against any third-party claim, loss, liability, damage, or expense (including reasonable attorneys&rsquo; fees) arising out of or relating to (a) your Inputs; (b) your breach of these Terms or applicable law; (c) your misuse of any Deliverable; or (d) your infringement of a third party&rsquo;s rights. We will promptly notify you of the claim and reasonably cooperate with your defense; you will not settle any claim that imposes any obligation or admission on us without our prior written consent.
            </p>
          </Section>

          <Section id="15" title="15. Termination">
            <p>
              We may suspend or terminate your access to the Service at any time, with or without notice, including if we reasonably believe you have violated these Terms. You may stop using the Service at any time. Sections that by their nature should survive termination — including Sections 6 (Your Inputs), 8 (Ownership and License), 12 (Disclaimers), 13 (Limitation of Liability), 14 (Indemnification), 18 (Governing Law and Disputes), and 19 (Miscellaneous) — survive.
            </p>
          </Section>

          <Section id="16" title="16. Changes to the Service or to These Terms">
            <p>
              We may update the Service and these Terms from time to time. If we make a material change to these Terms, we will update the &ldquo;Effective&rdquo; date above and, where reasonable, notify you by email or by a notice in the Service. Your continued use of the Service after the change becomes effective is your acceptance of the updated Terms. If you do not agree, your sole remedy is to stop using the Service.
            </p>
          </Section>

          <Section id="17" title="17. Communications and Notice">
            <p>
              You agree that we may send you operational, transactional, and account-related communications by email at the address you provide. Marketing emails are sent only with your consent and you can unsubscribe at any time. Notices to us must be sent to <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">{brand.contact.email}</a>.
            </p>
          </Section>

          <Section id="18" title="18. Governing Law and Dispute Resolution">
            <p>
              <strong>Governing law.</strong> These Terms are governed by the laws of the State of Delaware, without regard to its conflict-of-laws principles. The United Nations Convention on Contracts for the International Sale of Goods does not apply.
            </p>
            <p>
              <strong>Informal resolution first.</strong> Before filing any claim, you agree to contact us at <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">{brand.contact.email}</a> with the details of the dispute, and to negotiate in good faith for at least sixty (60) days.
            </p>
            <p>
              <strong>Arbitration.</strong> Any unresolved dispute will be finally resolved by binding individual arbitration administered by the American Arbitration Association (&ldquo;AAA&rdquo;) under its Consumer Arbitration Rules. The seat of arbitration is Wilmington, Delaware. Arbitration may be conducted by telephone, online, or written submission, at the arbitrator&rsquo;s discretion. Judgment on the award may be entered in any court of competent jurisdiction.
            </p>
            <p>
              <strong>Class waiver.</strong> YOU AND {brand.name.toUpperCase()} AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE ACTION.
            </p>
            <p>
              <strong>Exceptions.</strong> Either party may bring an individual action in small-claims court instead of arbitration, and either party may seek injunctive or equitable relief in court to protect intellectual-property rights.
            </p>
            <p>
              <strong>Opt-out.</strong> You may opt out of the arbitration agreement by emailing <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">{brand.contact.email}</a> within thirty (30) days of first accepting these Terms with the subject line &ldquo;Arbitration Opt-Out.&rdquo;
            </p>
          </Section>

          <Section id="19" title="19. Miscellaneous">
            <p>
              <strong>Entire agreement.</strong> These Terms, together with the Privacy Policy and any tier-specific terms presented at checkout, are the entire agreement between you and us.
            </p>
            <p>
              <strong>Severability.</strong> If any part of these Terms is held unenforceable, the rest remains in effect.
            </p>
            <p>
              <strong>No waiver.</strong> Our failure to enforce a right is not a waiver of that right.
            </p>
            <p>
              <strong>Assignment.</strong> You may not assign these Terms without our prior written consent. We may assign them in connection with a merger, acquisition, or sale of substantially all assets.
            </p>
            <p>
              <strong>Force majeure.</strong> Neither party is liable for delays caused by events beyond its reasonable control (including natural disasters, internet outages, or third-party-service outages), provided the affected party uses commercially reasonable efforts to perform.
            </p>
            <p>
              <strong>Headings.</strong> Section headings are for convenience and have no legal effect.
            </p>
          </Section>

          <Section id="20" title="20. Contact">
            <p>
              Questions about these Terms? Write to{" "}
              <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">
                {brand.contact.email}
              </a>.
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-gold-700/15 text-center text-sm text-cream-200/50">
          See also the{" "}
          <Link href="/privacy" className="text-gold-300 hover:text-gold-200 underline underline-offset-4">
            Privacy Policy
          </Link>.
        </div>
      </div>
    </article>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="font-display text-2xl text-cream-100 mb-4">
        <a href={`#${id}`} className="hover:text-gold-200 transition-colors">
          {title}
        </a>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
