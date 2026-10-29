# Verification — 29 October 2026

## Automated tests

`npm test`: 14 tests pass. They cover integer allocation and stock conservation (including 1,000 generated stock/demand combinations), shortages, outstanding requests, stale and modified plans, manual plan bounds, combined search/category/status filtering, sorting, invalid backups, edit/delete guards, backup round trips and CSV formula neutralization.

## Deployed browser journeys

Synthetic records were used; no real household information was entered.

| Check | Observed result |
| --- | --- |
| Desktop stock and requests | Added 5 bags of rice and two household requests for 4 bags each. |
| Combined filters | Search for rice plus the Protein category correctly showed no matches; Clear filters restored the list. |
| Allocation | Packing showed 5 of 8 requested units and the correct stock shortfall. |
| Manual edits | An 8-unit packing allocation against 5 in stock was rejected. A 2/3 split was accepted and survived navigation between screens. |
| Concurrent tabs | Stock was changed to 6 while the first tab held an older 5-unit distribution confirmation. The old confirmation was rejected. |
| Distribution and history | A refreshed 6-unit plan recorded successfully. Stock became 0, pending requests totaled 2, and history recorded 6 units. |
| Downloaded CSV | The real downloaded history CSV was parsed; two household rows totaled exactly 6 units. |
| Downloaded JSON | Real backup contents were parsed: 2 stock items, 2 open requests, 1 history entry, 6 recorded units and 2 pending units. |
| Restore | A malformed JSON file was rejected. The valid downloaded backup restored and showed the expected counts. |
| Mobile journey | At 390px, stock → request → packing → distribution → More → history worked. The recorded history showed 3 units. |
| Keyboard | Availability selection retained focus and exposed aria-pressed. Escape closed the mobile navigation dialog. |
| Print | A real packing PDF was generated. It was one page; extracted text contained the expected household reference, item and 3-of-3 quantities. |
| Injection handling | A stock item containing literal `<b>` markup displayed as text; no element was created from it. |

The browser's synthetic records were cleared after a backup was downloaded and verified.

## Layout and accessibility

- Home and stock: no document-level horizontal overflow at 390, 768 or 1440px.
- Home heading: two rendered lines at all three widths.
- Final axe-core audit of mobile stock and its add-item dialog: 0 violations, 0 incomplete checks.
- Mobile packing and history audits: 0 violations, 0 incomplete checks.
- Findings fixed during the review: mobile icon-only link name, stock availability group role, placeholder contrast, transient notification opacity and focus restoration after filter changes.

These checks cover the listed screens and interactions. They are not a full assistive-technology, WCAG conformance or cross-browser certification.

## Security boundaries and remaining validation

Display values are HTML-escaped. Content security policy restricts resources to the same origin; there are no third-party runtime scripts, credentials, analytics, server-side household records or external API calls. Backup imports are schema-checked and size-limited. IndexedDB revision checks and transactions protect against stale writes. CSV exports escape spreadsheet formulas.

Independent penetration testing, actual browser permission/storage-failure tests, large-dataset performance evaluation, cross-browser testing and a pantry-operator field study have not been completed. No measured time savings, health outcomes, security certification or winning score is claimed. Automatic cross-device synchronization, nutrition, allergy, safety and eligibility assessment are outside the product scope.
