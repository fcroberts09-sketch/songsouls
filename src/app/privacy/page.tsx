import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${brand.name} collects, uses, and protects your information.`,
};

const EFFECTIVE_DATE = "May 2, 2026";

export default function PrivacyPage() {
  return (
    <article className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-14">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            Legal
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-cream-100 mb-4">
            Privacy <span className="font-display-italic text-gold-shine">Policy</span>
          </h1>
          <p className="text-cream-200/55 text-sm">
            Effective {EFFECTIVE_DATE}
          </p>
        </header>

        <div className="prose-legal text-cream-200/80 leading-relaxed space-y-8 text-[15px]">
          <p className="text-cream-100/90">
            This Privacy Policy explains how {brand.name} (&ldquo;<strong>{brand.name}</strong>,&rdquo; &ldquo;<strong>we</strong>,&rdquo; &ldquo;<strong>us</strong>,&rdquo; or &ldquo;<strong>our</strong>&rdquo;) collects, uses, shares, and protects information about you when you use our website and personalized songwriting service (the &ldquo;<strong>Service</strong>&rdquo;). It applies to the songsouls.ai website, the create flow, our email communications, and any product or feature that links to this Policy. Capitalized terms not defined here have the meanings given in our <Link href="/terms" className="text-gold-300 hover:text-gold-200 underline underline-offset-4">Terms of Service</Link>.
          </p>

          <p className="bg-ink-900/60 border border-gold-700/15 rounded-lg p-5 text-cream-200/85">
            <strong className="text-cream-100">Plain-English summary (not a substitute for the Policy):</strong> We collect what you give us — the email and details you type, the photos you upload, the answers you write — plus standard technical data needed to run the site and prevent abuse. We use it to make your song and to operate our business. We share it only with the processors named in Section 4 (e.g., Anthropic, Stripe, Resend, Vercel), each of which has its own contract with us. We don&rsquo;t sell your information, we don&rsquo;t use your photos for facial recognition, and we don&rsquo;t train AI models on your story. You have rights — including access, deletion, and correction — and can exercise them at <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">{brand.contact.email}</a>.
          </p>

          <Section id="1" title="1. Scope and Roles">
            <p>
              For information you submit through the Service, {brand.name} acts as the &ldquo;controller&rdquo; (or &ldquo;business&rdquo; under California law) — meaning we decide why and how it&rsquo;s processed. Where we provide the Service to a practitioner under the practitioner program and the practitioner is acting as a controller for their client&rsquo;s information, the practitioner is responsible for the lawful basis to share that information with us; we will act as a processor (or service provider) under appropriate written terms.
            </p>
          </Section>

          <Section id="2" title="2. Information We Collect">
            <p>
              <strong>Information you provide directly.</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Order intake.</strong> Your email address and name; the recipient&rsquo;s name and your relationship to them; the occasion; the requested delivery date; any free-text answers you write about the recipient and your relationship; any optional note to us; and your selected genre and tier.</li>
              <li><strong>Photographs.</strong> Photos you choose to upload as part of the intake (up to three per order, capped at approximately six megabytes each). Photos are stored alongside the order to inform the songwriting work.</li>
              <li><strong>Lyric drafts.</strong> Drafts you generate using the Lyric Preview, which we keep with the order so a human songwriter can build on them.</li>
              <li><strong>Communications.</strong> The contents of emails you send us, and our replies.</li>
            </ul>
            <p>
              <strong>Information collected automatically.</strong> Like most websites, we collect a limited set of technical information needed to run the site, prevent abuse, and improve performance:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Connection data.</strong> Your IP address (used for rate-limiting, abuse prevention, and approximate geolocation), basic request headers (user-agent, referrer), and timestamps. The IP is derived from the standard <code className="text-cream-100/90 bg-ink-900/70 px-1.5 py-0.5 rounded text-[13px]">x-forwarded-for</code> header set by our hosting provider.</li>
              <li><strong>Hosting and operational logs.</strong> Server logs generated by Vercel and our application, used for diagnostics and security.</li>
            </ul>
            <p>
              <strong>Information collected from payment.</strong> When you check out, Stripe collects your payment-method details directly. We do not see or store your full card number; we receive a payment-success record and a Stripe customer or session identifier so we can reconcile your order.
            </p>
            <p>
              <strong>What we do not collect.</strong> We do not knowingly collect biometric identifiers, government-ID numbers, exact precise location data, or special-category data (such as health, religion, or sexual orientation), except to the extent you choose to write about such topics in your free-text answers. If you write personal narrative content about yourself or the recipient, we treat the surrounding context as ordinary intake content rather than as a separate special category.
            </p>
          </Section>

          <Section id="3" title="3. How We Use Information">
            <p>
              We use the information described in Section 2 to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Generate, refine, and deliver the Deliverable you ordered;</li>
              <li>Operate the Service, including hosting, performance, security, fraud prevention, and rate-limiting;</li>
              <li>Process payments and prevent payment fraud;</li>
              <li>Send transactional emails about your order (e.g., confirmations, drafts, completed deliveries, revision requests);</li>
              <li>Respond to your questions or support requests;</li>
              <li>Comply with our legal obligations and enforce our Terms; and</li>
              <li>Improve the Service in the aggregate, using de-identified or aggregated information.</li>
            </ul>
            <p>
              We do not use your photos, your free-text answers, or any other content you submit to train any artificial-intelligence model. We do not engage in &ldquo;automated decision-making&rdquo; that produces legal or similarly significant effects on you.
            </p>
            <p>
              <strong>Legal bases (EEA / UK).</strong> Where applicable law (such as the GDPR or UK GDPR) requires it, we rely on the following legal bases: (i) <em>contract</em> — to provide the Service you ordered; (ii) <em>legitimate interests</em> — to operate, secure, and improve the Service; (iii) <em>legal obligation</em> — to keep records and respond to lawful requests; and (iv) <em>consent</em> — for marketing communications you opt into, which you can withdraw at any time.
            </p>
          </Section>

          <Section id="4" title="4. Service Providers and How We Share Information">
            <p>
              We share information only with vendors that need it to provide the Service, and only under written contracts requiring confidentiality and security. Our primary subprocessors are:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Anthropic, PBC.</strong> AI processing of your free-text intake (recipient name, relationship, occasion, and your written answers) to draft lyrics. Photos are <strong>not</strong> sent to Anthropic. Inputs sent to Anthropic are not used by Anthropic to train its models when accessed through the API on which our integration is built.</li>
              <li><strong>Stripe, Inc.</strong> Payment processing. Stripe collects your payment-method information directly under its own privacy policy. We receive only the order metadata needed for reconciliation.</li>
              <li><strong>Resend, Inc.</strong> Sending transactional emails to you and notification emails to our operations team. Resend receives the email addresses, message contents, and delivery metadata necessary to send and track those emails.</li>
              <li><strong>Vercel, Inc.</strong> Hosting and edge delivery of the Service. Vercel processes web traffic to operate the site. The Service is hosted in U.S. regions.</li>
            </ul>
            <p>
              <strong>Other sharing.</strong> We may also share information (a) with our professional advisors (lawyers, accountants, auditors); (b) in response to a lawful legal process, after evaluating its scope and validity; (c) to enforce our Terms or protect the rights, property, or safety of {brand.name} or others; or (d) in connection with a corporate transaction (merger, acquisition, financing, sale of assets, bankruptcy), in which case we will require any successor to honor this Policy or notify you and offer a choice.
            </p>
            <p>
              <strong>No sale of personal information.</strong> We do not sell your personal information for money, and we do not &ldquo;share&rdquo; it for cross-context behavioral advertising as those terms are defined under the California Consumer Privacy Act (&ldquo;CCPA&rdquo;).
            </p>
          </Section>

          <Section id="5" title="5. Cookies and Similar Technologies">
            <p>
              The {brand.name} site itself uses only essential cookies and local storage required for the Service to function (for example, holding your in-progress create flow). We do not use third-party advertising cookies or cross-site tracking pixels on our pages. When you proceed to checkout, you are redirected to a Stripe-hosted page that uses cookies set by Stripe under its own privacy policy.
            </p>
          </Section>

          <Section id="6" title="6. Data Retention">
            <p>
              We retain order information for as long as necessary to deliver the Service, resolve disputes, comply with legal obligations, and enforce our agreements. In practice that means:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Active orders.</strong> Retained until the Deliverable has been delivered and any revision window has closed.</li>
              <li><strong>Completed orders.</strong> Retained for up to seven (7) years for tax, accounting, and dispute-resolution purposes (and longer if a legal hold applies).</li>
              <li><strong>Photos.</strong> Photos are deleted within ninety (90) days of completion of the order, unless you ask us to keep them on file (for example, to make follow-on songs).</li>
              <li><strong>Lyric drafts.</strong> Retained with the order under the schedule above.</li>
              <li><strong>Server logs.</strong> Retained for up to thirty (30) days for diagnostics and security, then deleted or aggregated.</li>
              <li><strong>Marketing data.</strong> Retained until you unsubscribe.</li>
            </ul>
            <p>
              You can ask us to delete your information sooner; see Section 8.
            </p>
          </Section>

          <Section id="7" title="7. Security">
            <p>
              We use reasonable administrative, technical, and physical measures to protect information in our custody, including encryption in transit (HTTPS/TLS), encryption at rest where supported by our hosts, rate-limiting on sensitive endpoints, restricted access to operational systems, and contracts with our subprocessors that require security commitments. No system is perfectly secure, and we cannot guarantee absolute security. If we discover a breach affecting your personal information, we will notify you and applicable regulators as required by law.
            </p>
          </Section>

          <Section id="8" title="8. Your Privacy Rights">
            <p>
              Depending on where you live, you may have the following rights with respect to your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Access.</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Correction.</strong> Ask us to correct information that is inaccurate.</li>
              <li><strong>Deletion.</strong> Ask us to delete your information, subject to legal exceptions (for example, financial-record retention).</li>
              <li><strong>Portability.</strong> Receive your information in a structured, machine-readable format.</li>
              <li><strong>Objection / Restriction.</strong> Object to, or ask us to restrict, certain processing.</li>
              <li><strong>Withdraw consent.</strong> Where we process information based on consent, withdraw that consent at any time.</li>
              <li><strong>Non-discrimination.</strong> We will not deny you the Service, charge a different price, or provide a different level of quality because you exercised a privacy right.</li>
            </ul>
            <p>
              To exercise any of these rights, email{" "}
              <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">
                {brand.contact.email}
              </a>{" "}
              with the subject line &ldquo;Privacy Request.&rdquo; We will verify your request, typically by confirming control of the email address tied to your order, and respond within the timelines required by applicable law (generally forty-five (45) days under U.S. state laws and one (1) month under the GDPR, with permitted extensions). You may designate an authorized agent in writing to act on your behalf.
            </p>
            <p>
              <strong>California (CCPA/CPRA).</strong> California residents have the rights described above. We have not sold or shared personal information for cross-context behavioral advertising in the preceding twelve (12) months. The categories of personal information we collect, the purposes for which we use them, and the categories of recipients are described in Sections 2, 3, and 4.
            </p>
            <p>
              <strong>Other U.S. states.</strong> If you live in Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA), or another U.S. state with a comprehensive privacy law, you have the rights described above to the extent that law applies. You may appeal a denial of a request by replying to our response email; we will respond to your appeal within the timeline required by your state&rsquo;s law.
            </p>
            <p>
              <strong>EEA / UK / Switzerland.</strong> If you are located in the EEA, the United Kingdom, or Switzerland, you also have the right to lodge a complaint with your local supervisory authority. Where required, our representative information will be provided on request.
            </p>
          </Section>

          <Section id="9" title="9. International Transfers">
            <p>
              We are based in the United States, and our hosting and most subprocessors operate in the United States. If you access the Service from outside the U.S., your information will be transferred to and processed in the U.S. and other countries that may have different data-protection laws than your own. Where required, we use Standard Contractual Clauses or other approved transfer mechanisms with our subprocessors.
            </p>
          </Section>

          <Section id="10" title="10. Children">
            <p>
              The Service is not directed to children, and you must be at least eighteen (18) years old to place an order. We do not knowingly collect personal information from anyone under thirteen (13). If you believe a child has provided us personal information, contact us at <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">{brand.contact.email}</a> and we will delete it.
            </p>
            <p>
              If a song is being created <em>about</em> a child (for example, a parent commissioning a song for their child), the parent or legal guardian is responsible for the lawful basis to share that child&rsquo;s information with us.
            </p>
          </Section>

          <Section id="11" title="11. Marketing Communications">
            <p>
              We send marketing emails only to people who have opted in. Every marketing email contains an unsubscribe link. Transactional emails about your orders are sent regardless and can be turned off only by ending your relationship with us.
            </p>
          </Section>

          <Section id="12" title="12. Do Not Track">
            <p>
              Some browsers send a &ldquo;Do Not Track&rdquo; (DNT) signal. There is no industry-standard response to DNT, and we do not currently change our practices in response to a DNT signal. We honor verifiable opt-out requests under applicable law as described in Section 8.
            </p>
          </Section>

          <Section id="13" title="13. Changes to This Policy">
            <p>
              We may update this Policy from time to time. If we make a material change, we will update the &ldquo;Effective&rdquo; date above and, where reasonable, notify you by email or through the Service. We encourage you to revisit this page periodically.
            </p>
          </Section>

          <Section id="14" title="14. Contact Us">
            <p>
              For privacy questions or to exercise your rights, write to{" "}
              <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">
                {brand.contact.email}
              </a>{" "}
              with the subject line &ldquo;Privacy Request.&rdquo;
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-gold-700/15 text-center text-sm text-cream-200/50">
          See also the{" "}
          <Link href="/terms" className="text-gold-300 hover:text-gold-200 underline underline-offset-4">
            Terms of Service
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
