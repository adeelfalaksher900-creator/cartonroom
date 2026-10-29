# GatherShelf

## Field map

| Devpost field | Prepared value |
| --- | --- |
| Project name | GatherShelf |
| Tagline | Turn pantry stock and household choices into a clear, reviewable packing plan. |
| Try it out | https://gathershelf.vercel.app/ |
| Source code | https://github.com/adeelfalaksher900-creator/cartonroom/tree/gathershelf-rebuild |
| Built with | JavaScript, HTML, CSS, IndexedDB, Lucide, Node.js, Vercel |
| Thumbnail | Prepared separately: 1536 × 1024 PNG, 3:2. Not uploaded yet. |
| Video and gallery | Reserved for the team's later review and authorization. |

**Preparation status:** This file is the prepared copy. A signed-in Devpost session is required to save it to an actual Devpost draft. No Devpost upload or final submission is claimed.

## Inspiration

A household chooses four bags of rice. Another household chooses four. The pantry has five. A spreadsheet can hold those numbers, but volunteers still need a clear way to decide what to pack, preserve the original choices and remember what remains unfilled.

That practical gap is the focus of GatherShelf. A nationwide survey of food pantries identified inventory management among the digital features pantry staff wanted. Client-choice guidance also describes an inventory-list approach in which households choose items and volunteers pack them. These sources support the problem; they do not establish results for GatherShelf.

## What it does

GatherShelf gives a small pantry one workspace for stock, household requests, packing and distribution history. A volunteer can:

- Record available quantities, counting units, categories and best-before dates.
- Find stock with combined search, category and availability filters.
- Enter the specific items a household requests using a non-identifying reference.
- Review a whole-unit packing plan and its shortages, then adjust proposed amounts without rewriting requests.
- Confirm a distribution so stock and outstanding requests update together.
- Reopen the recorded distribution, print a packing list, export CSV reports and download or restore a JSON backup.

Different batches retain their dates in request labels, packing controls and newly recorded history. Unfilled quantities stay open for the next distribution.

## How it works

For each item, the planner uses largest-remainder proportional allocation. Five units against two equal four-unit requests produce allocations of three and two; stable request IDs resolve the tie. The result is a transparent starting rule. Volunteers review it and retain the final decision.

The flow is **stock → household choices → review and adjust → confirm → history**. Recording is one IndexedDB transaction: the application checks the workspace revision, validates the plan against current stock and demand, then updates stock, outstanding requests and history together. An old confirmation is rejected if another tab has changed the workspace.

## How we built it

The frontend uses semantic HTML, CSS and JavaScript modules. Business rules, input validation and persistence are separate modules, with no third-party runtime scripts or external API calls. Vercel serves the application over HTTPS. Records remain in this browser; no account is needed.

The workspace has bounded, restorable backups, CSV formula neutralization, escaped display values and a restrictive content security policy. Background tab updates preserve stock-search focus and expanded history. Distribution detail tables are created when opened rather than rendering every historical row on startup.

The [repository README](https://github.com/adeelfalaksher900-creator/cartonroom/blob/gathershelf-rebuild/README.md) includes setup instructions and an architecture diagram. The [verification report](https://github.com/adeelfalaksher900-creator/cartonroom/blob/gathershelf-rebuild/docs/TESTING.md) records the checks and their limits.

## Challenges we ran into

The hardest engineering problem was keeping stock and requests consistent when two tabs were open. A plan that looked valid when a confirmation opened could be stale a moment later. Revision checks inside the write transaction prevent the old plan from silently replacing newer records.

We also needed to preserve the distinction between what a household asked for and what a volunteer packed. Manual adjustments change the plan while the original request remains intact until a distribution is recorded. Backup size and write capacity use the same byte budget so an ordinary app-generated backup remains importable.

## Accomplishments

Twenty automated tests pass, including 1,000 generated allocation scenarios. They cover stock conservation, original request bounds, stale plans, malformed backups, UTF-8 capacity, batch dates, CSV export, storage retry recovery and aborted reads.

Browser testing exercised desktop and 390px mobile workflows. One desktop check recorded seven units from two dated stock batches, exported four matching history rows and restored the actual downloaded backup. A mobile workflow recorded three units and reopened its history through the More menu. These are functional checks using synthetic records, not evidence of field outcomes.

## What we learned

Small operational details matter: a clear batch date, a useful shortage message, a safe retry, a retained search cursor and a backup that can actually be restored. Local storage keeps setup light, but its one-device boundary must stay clear. Mathematical consistency is useful; it cannot decide a household's needs.

## What's next

Test the workflow with pantry workers and households, compare task completion and errors against their current method, evaluate assistive-technology use, and investigate carefully controlled multi-user synchronization. These are future steps, not completed studies.

## Operating boundaries

GatherShelf is a single-device pantry workspace. It does not automatically synchronize devices or assess nutrition, food safety, allergies or eligibility. Volunteers must verify product labels, dates, quantities and suitability and apply their pantry's policies. No measured time saving, health outcome, security certification or guaranteed winning score is claimed.

## Research

- [Current Use and Demand for Digital Tools to Enhance Food Pantry Management](https://pubmed.ncbi.nlm.nih.gov/39931051/)
- [Regional Food Bank client-choice manual](https://regionalfoodbank.net/wp-content/uploads/Client-Choice-Manual.pdf)

## Team fields

Use the existing registered team and only confirmed contributions. Adeel Falak Sher provided project direction and review requests. No unconfirmed development role or teammate contribution should be invented. Answer any required assistance-disclosure fields accurately.
