# Solace Relay

**From a request for help to a confirmed next step.**

Solace Relay is a staff-facing County coordination layer for homelessness-response systems. It helps outreach workers, 211 specialists, Housing Resource Center staff, providers, and County administrators coordinate referrals and keep service information current.

This repository is a **hackathon MVP prototype** that uses **synthetic data only**. It is not connected to live County, HMIS, 211, provider, or messaging systems.

## What it is / is not

**Is:** an operational layer that closes the gap between a request for help and a confirmed next step — recording minimum necessary requirements, identifying compatible services, confirming provider capacity, coordinating intake details, and learning why referrals succeed or fail.

**Is not:** a public shelter map, consumer resource directory, generic advice chatbot, replacement for Coordinated Entry / HMIS / 211, an algorithm that decides who deserves housing, or a system that exposes domestic-violence shelter locations.

The participant does not need to use the full application. Staff and providers are the primary users; the person experiencing homelessness is the beneficiary.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build
npm start
npm run lint
```

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Lucide icons
- Recharts
- localStorage persistence
- Deterministic local “agents” (no API keys, no outbound messages)

## Roles

Use the **role switcher** in the header:

| Role | Focus |
|------|--------|
| Outreach Worker | Placement requests, matching, referrals, handoff cards |
| Provider | Incoming referrals, accept/decline/clarify, capacity updates |
| County Operations Manager | Active referrals, stale data, agent tasks, escalations |
| County Analyst | Unmet-need ledger, outcomes, freshness metrics |

Role changes and operational state persist in `localStorage` for the browser session.

## Pages

1. **Overview** — metrics, activity feed, how it works
2. **Placement Requests** — minimum necessary requirements (no names)
3. **Provider Options** — transparent matching + Relay Assistant
4. **Referral Tracking** — status, timeline, handoff card
5. **Provider Portal** — respond + edit service profiles
6. **Agent Control Center** — supervised agent cycle
7. **County Insights** — unmet-need ledger + charts
8. **Data Connections** — simulated CE / HMIS / 211 / export mappings
9. **Safety and Governance** — product principles

Banner on every page: *Prototype using synthetic data — not connected to live County systems.*

## Demo scenario (~3 minutes)

1. Click **Load demo scenario** (header or Overview).
2. Review the pre-filled placement request (single adult, emergency shelter, women-only, wheelchair, English, needs transportation, tonight, missing ID).
3. Submit → compatible providers (Harbor House should be selectable).
4. Select Harbor House → draft referral → **Send referral request**.
5. Switch role to **Provider** → Provider Portal → **Accept** (capacity 3→2).
6. Switch to **County Operations Manager** → Overview / Referrals show accepted + next step.
7. Switch to **Outreach Worker** → open referral → handoff card → mark handoff confirmed.
8. **Agent Control Center** → **Run agent cycle** → stale providers + unanswered referral tasks.
9. **County Insights** → unmet-need ledger and outcome charts.

**Reset data** in the header restores the synthetic seed dataset.

## Matching logic

Rule-based, explainable matching on service type, household, accessibility, gender/safety, pet, language, transportation, intake timing, documents, capacity, and confirmation freshness.

Needs are classified as Hard requirement / Operational barrier / Preference / Unknown.

The system **never** scores deservingness, moral worth, predicted success, compliance, or likelihood of keeping housing. Stale provider data is labeled **Needs confirmation**, not unavailable.

Protected safety pathway requests only surface providers that support secure-contact coordination; confidential locations are never shown.

## Agents

Local mocked agents (Provider Registry, Referral Coordination, Capacity Verification, Data Quality, Unmet-Need Insight, Safety Guardrail):

- Propose actions with plain-language reasoning
- Require human approval for sensitive actions
- Write audit events to the activity log
- Never invent capacity, expose confidential locations, auto-publish ambiguous updates, or make eligibility decisions

Freshness policy: emergency / overnight services use a shorter confirmation window than routine services.

## Synthetic data

Eight providers (Harbor House, Bridgeway Family Center, North Star Safe Parking, Cedar Grove Respite, East Bay Welcome Center, Lighthouse Youth Services, Safe Harbor Night Intake, Hearthline Support Network) and eight seed referrals with mixed statuses. All names and regions are fictional.

## Privacy & safety

- No real PII collection
- No exact DV shelter locations
- Safety notice on placement form
- Printable handoff cards are privacy-safe
- No external API keys required

## Project structure

```
src/
  app/                 # App Router pages
  components/          # Shell + UI primitives
  lib/                 # types, seed data, matching, agents, store
```

## Acceptance notes

All nine navigations work; major buttons update local state; role switch preserves data; demo flow is end-to-end; accept decreases capacity; decline creates unmet-need events; agent cycles create visible tasks; empty/loading states included.

---

Solace Relay helps one person receive a confirmed next step today while turning every failed referral into evidence for how the County can improve the system tomorrow.
