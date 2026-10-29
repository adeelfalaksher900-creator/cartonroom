# GatherShelf — saved Devpost draft

**Status:** Saved on Devpost, not submitted. The project preview is https://devpost.com/software/gathershelf. The saved overview contains the 3:2 thumbnail. The details contain the story below, seven technology tags, the live application, renamed GitHub repository, and 15 images with matching captions. The YouTube field awaits the user's link.

| Field | Saved value |
| --- | --- |
| Name | GatherShelf |
| Pitch | Turn pantry stock and household choices into a clear, reviewable packing plan. |
| Live application | https://gathershelf.vercel.app/ |
| Source | https://github.com/adeelfalaksher900-creator/gathershelf |
| Built with | javascript, html5, css3, indexeddb, node.js, vercel, lucide |
| Video | A 2:31, 1920 × 1080 walkthrough is prepared for the user's YouTube upload. |
| Gallery | 15 authentic, captioned application images. |

## Inspiration

Two households each ask for four bags of rice. The pantry has five. Recording those numbers is only the beginning: a volunteer needs a clear packing decision, a way to preserve the original choices, and a record of what remains unfilled.

GatherShelf supports that practical client-choice workflow for small community food pantries, with no account or server setup. Inventory tools already exist; our focus is the handoff from household choices to a reviewable, quantity-safe packing plan on one device.

## What it does

- Tracks stock quantities, counting units, categories and optional best-before dates.
- Combines search, category and availability filters, with sorting and CSV export.
- Records the exact items and quantities requested using non-identifying household references.
- Calculates whole-unit proportional allocations and makes shortages explicit.
- Lets a volunteer adjust the plan within stock and original-request bounds.
- Records a distribution, preserves unfilled requests, and provides history, printing, CSV and full JSON backup/restore.

The workflow is **stock → household choices → review and adjust → confirm → history**. The household chooses the items; the volunteer retains the final decision.

## How we built it

| Layer | Implementation |
| --- | --- |
| Interface | Semantic HTML, responsive CSS and JavaScript modules; locally bundled Lucide icons |
| Allocation | Largest-remainder proportional allocation for each item, with stable request IDs resolving ties |
| Validation | Whole quantities, original-request bounds, stock conservation and bounded backup imports |
| Persistence | IndexedDB with revision checks inside atomic write transactions |
| Delivery | Vercel HTTPS hosting and restrictive security headers |
| Verification | Twenty automated tests, including 1,000 generated allocation cases, plus browser workflows |

A confirmation is checked against the saved workspace revision. If another tab has changed the records, the old confirmation is rejected. Stock, outstanding requests and history are then updated together when a current plan is confirmed.

The workspace escapes displayed values, neutralizes spreadsheet formulas in CSV exports, and rejects oversized or malformed backups. Search focus and expanded history are retained during background updates.

See the [architecture and setup instructions](https://github.com/adeelfalaksher900-creator/gathershelf#architecture) and the [verification report](https://github.com/adeelfalaksher900-creator/gathershelf/blob/main/docs/TESTING.md).

## Challenges we ran into

A packing plan can become stale while its confirmation is open. Checking only the screen was insufficient; the revision must be checked inside the storage transaction. We also kept original household requests separate from temporary packing adjustments, and aligned save limits with the backup format so app-generated backups remain restorable.

## Accomplishments

In the recorded browser workflow, thirteen requested units produce a nine-unit plan. An over-stock adjustment is rejected, a valid eight-unit custom plan can be applied and reset, and a real second-tab stock update causes the old confirmation to fail safely. After reviewing the current plan, recording nine units leaves four requested units open.

The actual downloaded history CSV contains four packing lines totalling nine units. The downloaded backup contains three stock items, two open requests and one distribution, and is restored successfully through the interface. Automated checks cover allocation invariants, stale plans, validation, CSV formula injection, UTF-8 backup capacity, batch dates and storage failure recovery. Desktop and mobile workflows were also checked. These are functional checks using synthetic records; field outcomes have not yet been measured.

## What we learned

Operational details matter: clear counting units, visible dates, recoverable errors, retained search focus, and a backup that can actually be restored. A transparent calculation helps volunteers review a decision; it does not determine a household's needs.

## What is next

Evaluate the workflow with pantry volunteers and households, compare task completion and errors against their current methods, broaden assistive-technology testing, and investigate controlled multi-user synchronization.

## Practical boundaries

Records stay in this browser and do not synchronize automatically. Keep regular backups and use household references. Volunteers remain responsible for labels, dates, allergens, suitability and pantry policies; GatherShelf allocates requested quantities and does not assess food safety or eligibility.

## Research

- [Current Use and Demand for Digital Tools to Enhance Food Pantry Management](https://pubmed.ncbi.nlm.nih.gov/39931051/)
- [Regional Food Bank client-choice manual](https://regionalfoodbank.net/wp-content/uploads/Client-Choice-Manual.pdf)
