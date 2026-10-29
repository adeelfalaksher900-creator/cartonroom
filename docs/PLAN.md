# Cartonroom: product and technical plan

## Research and concept selection

Next Byte Hacks V5 accepts a new software project developed during 6–31 October. The official rules specify four equally weighted criteria: innovation, technical complexity, functionality and presentation. Its overview and rules disagree about video length; a future video of 2–3 minutes satisfies both. The overview says students only and above the age of majority, while the rules say worldwide and 13+. Eligibility needs organizer confirmation, especially for people between school and university. Screenshots and a video remain a later phase at the owner's request.

Five candidate directions were considered: (1) a food rescue allocation planner, (2) a family discharge checklist, (3) an outage readiness planner, (4) a reusable-goods repair parts inventory, and (5) a carton selection and packing planner. Food rescue products already include inventory and constraint-aware picking, while clinical transitions require higher-stakes validation. Outage checklists and repair inventories have meaningful use cases but depend on reliable local service information or supply-chain integrations. Carton selection has a directly measurable output, an understandable technical problem, and supports an honest working local-first product without a paid API.

Research: the multiple-bin 3D packing literature discusses the tension between dimensional fit and the selection of shipping boxes (https://pmc.ncbi.nlm.nih.gov/articles/PMC10588690/). Existing tools include Packwire (https://packwire.com/box-size-optimizer) and Fits In The Box (https://fitsinthebox.com/faq/); this is not a claim of novelty. The intended distinction is a private, no-account workflow for small sellers using their own box sizes, with geometric placements and readable reasons rather than rates or claims about carrier quotes. Validate the usefulness with real sellers before claiming time or cost savings.

## User and acceptance criteria

A seller enters packaged item dimensions, quantities, weights and orientation rules, adds the inner sizes and maximum content weights of their available boxes, and receives a feasible packing plan. Each placement must be inside a box, non-overlapping, fully supported from below and within its content-weight limit. Remaining items must be named. A visual must derive from the same placements as the list. Input errors, missing options, storage failure and no-fit outcomes must be explained. The seller can export their data; the app does not send it to a server.

## Technical decisions and limits

A static ES-module web application performs bounded deterministic 3D packing in the browser. Its model uses centimeters and kilograms; UI allows inches and pounds. A greedy heuristic searches support-checked candidate corners under several item orderings and chooses a small feasible box when all remaining goods fit; otherwise it maximizes the number placed, then favors less interior volume. It does not prove optimality. Padding is included on every item side. Treat shapes as rigid rectangular envelopes. The plan does not model cushioning compression, fragile stacking, carrier restrictions, package tare, or carrier pricing. The seller must verify fit and select proper protective packaging. Boxes are assumed to be available in unlimited quantity. Browser local storage is optional, not a backup and not a shared account system. Explicit JSON import/export supplies portability.

No external analytics, third-party API keys, backend, or user accounts. This minimizes risk for a single-device packing workflow; teams that need multi-device collaboration need a future secured backend. Bound item counts and dimensions to keep UI responsive. Validate imported data using the same schema as form data; do not render user text as HTML. Apply restrictive static response headers where deployment supports them. Test adversarial geometry, orientation, weight, support, split plans, oversized items, and generated invariants. Browser verification must cover the actual user journey on the published site, mobile and keyboard.

## References

- Official overview: https://next-byte-hacks-v5.devpost.com/
- Official rules: https://next-byte-hacks-v5.devpost.com/rules
- Schedule: https://next-byte-hacks-v5.devpost.com/details/dates
- Prior V3 winners: https://next-byte-hacks-v3.devpost.com/project-gallery
