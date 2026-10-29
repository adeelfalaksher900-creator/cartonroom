# GatherShelf product and technical notes

## Audience and need

Small food pantry volunteers who assemble bags based on the things households choose. A U.S. study found inventory management among the software features pantry staff wanted. The Regional Food Bank's client-choice manual describes an inventory-list model in which clients choose and volunteers pack. These establish a plausible need; they do not validate this particular product.

Sources:
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11810111/
- https://regionalfoodbank.net/wp-content/uploads/Client-Choice-Manual.pdf
- Existing products: https://dignifeed.com/product and https://www.openpantry.food/ — they already address related pantry management and allocation problems. We do not claim the concept is unprecedented.

## Idea comparison

1. Recall tracker: live official data is useful but many consumer recall trackers already exist and matches cannot guarantee a product is safe.
2. Pantry choice and allocation: direct operational problem, clear source evidence, understandable demonstration and a feasible algorithm without accounts. Existing commercial products mean differentiation is an open, local, reviewable workflow, not invention of pantry software.
3. Informal shop credit ledger: practical, but many established competitors; errors and records have financial implications.
4. Accessible route planner: valuable but safety depends on local map coverage and real-world validation that cannot be assumed.
5. Repair assistant: existing tools and hallucinated repair advice create unacceptable verification challenges without manufacturer documentation.

## Acceptance criteria

- A worker can enter stock and item-level household requests without an account.
- The allocator never packs more than available or more than a household requested.
- Distribution uses a revision-checked transaction; stale plans fail and unfilled requests remain.
- Users can inspect history and export and restore records, with a clear single-device limitation.
- The interface works on desktop and mobile and supports keyboard controls.

## Design and accessibility

Original interface design uses clear navigation, generous spacing, high-contrast actions and plain status text. Mobbin references were consulted for hierarchy, inventory lists, and creation flows; no third-party screenshots or visual assets are included. Reduced-motion preference disables decorative transitions.

## Implementation

Browser modules and semantic HTML; IndexedDB transactional storage, revision checks and BroadcastChannel refresh between tabs; whole-unit largest-remainder allocation by requested item; strict input and backup validation; escaped display text; CSV formula neutralization; content security policy and no external integrations.

### Allocation caveats

A proportion of requested quantities is not a measure of nutritional value, need, equity, or allergy safety. A tie uses a stable request ID. Users should follow their own allocation rules, check food labels and dates, and revise requests as needed before recording. Results have not been studied with pantry operators and no time-saving or health outcome is claimed.

## Judging self-assessment

- Innovation: combines known inventory, client choice and transparent per-item allocation; none are novel in isolation. Real-world differentiation is not validated.
- Technical complexity: deterministic integer allocation, transactional persistence, revision control, backup validation and conservation tests.
- Functionality: depends on browser testing and deployed verification; list any unverified flows separately.
- Presentation: screenshots and video are explicitly reserved for the user's later approval. A Devpost entry is incomplete without them.

## Delivery constraints

Single-device storage only. No synchronization, permissions, support for simultaneous offline devices, inventory reconciliation with physical shelves, dietary decision system, labeling verification, or real-world study. Passwords, accounts, analytics and third-party feeds are not part of the product.
