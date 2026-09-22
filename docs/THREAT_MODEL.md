# Threat model (v0, Phase 0)

Assume adversarial input. Prior crowdsourced price apps were poisoned by emulators (Waze "ghost riders", 2015) and by parties with a commercial motive (gas station owners on GasBuddy). Ours will be too.

## Adversaries
| Adversary | Goal | Capability |
|---|---|---|
| Retailer or its agency | Seed fake low prices so our "lowest seen" is wrong and discredits us in front of a regulator | Money, engineers, emulator farms, knowledge of their own page structure |
| Competitor | Poison or scrape our data, or trigger a retailer takedown | Same as above, less inside knowledge |
| Troll | Submit absurd prices, spam, offensive text in labels | Free time, rooted devices |
| User gaming a leaderboard or unlock threshold | Fabricate observations to raise their own standing | One or a few devices |
| Plaintiff or regulator (not hostile, but adversarial in court) | Challenge chain of custody | Discovery, expert witnesses |

## Controls (implemented phase in brackets)
- Content hash + per-device HMAC key + nonce; replay rejected. [1]
- Device attestation: App Attest, Play Integrity, signed extension install token. Unattested rows cannot set a minimum. [2]
- Capture provenance ranking: extension DOM and API baseline > clean-room > screenshot > share URL > manual. Manual never sets a minimum. [1]
- Plausibility: z-score against the rolling distribution; hard bounds against list price; outliers quarantined. [1]
- Corroboration: at least 3 distinct attested devices before "lowest seen" is shown; k ≥ 10 for any export. [1]
- Velocity and pattern: per-device rate limits, identical-content bursts, emulator and rooted signatures, ASN and VPN reputation. [1, 2]
- Location coherence: coarse GPS vs claimed metro vs IP geolocation, soft signal only. [2]
- Append-only integrity review chain; human review queue; every override attributed. [0 schema, 1 UI]
- Control twins on every baseline run give a measured noise floor, so a claim of personalization is a rate above that floor, not a single row. [1]
- Distributional cards: the product never asserts "someone saw $X" from one observation. [1]
- Periodic ground-truth panel (paid, instructed, fixed basket) with published agreement statistics. [3]

## Non-goals
Protecting against a retailer changing its page for our extension's fingerprint (we detect and report blocking as a signal, we do not evade it). Protecting a user who screenshots their own personal data into the app beyond the redaction step.
