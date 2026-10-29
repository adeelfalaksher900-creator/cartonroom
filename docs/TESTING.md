# Verification — 29 October 2026

## Automated checks

**20 tests pass; 0 fail.** GitHub Actions also checks the syntax of every runtime JavaScript module. The verified test commit is `a0679ddfe630edab1654835fb4eef6d694206aaf`; its [pull-request run](https://github.com/adeelfalaksher900-creator/gathershelf/actions/runs/40906109571) passed. Runtime files match the Vercel production release; subsequent documentation edits do not change application behavior. PR #1 was merged with the user's authorization at `9986c260fa7fd24397ea15d9f325936be7693eb8`; the repository is now named `gathershelf`, and main remains protected.

Coverage includes integer allocation and conservation across 1,000 generated stock/demand combinations, request bounds, shortages, outstanding demand, stale/tampered plans, manual adjustments, combined filtering and sorting, edit/delete guards, invalid dates and IDs, duplicate history IDs, UTF-8 backup capacity, batch dates, export, backup round trips and CSV formula neutralization. Storage regressions verify that two failed opens do not poison a third attempt and that an aborted read rejects instead of loading forever.

## Browser feature matrix

Tests used synthetic pantry records in isolated browser contexts, without real household information.

| Feature | Observed check |
| --- | --- |
| Home navigation | Header and guide links opened their targets. The mobile menu's Your data link reached `#your-data` and closed the menu after its stacking fix. |
| Home calculator | Keyboard stock values of 0 and 24 produced 0-of-16 and 16-of-16 results; an out-of-range request showed a validation explanation. |
| Stock creation | Required blank name rejected; valid quantities, units, categories and dates saved. |
| Stock editing and removal | Quantity updates persisted. Requested stock could not be removed. Unrequested test stock was removed successfully. |
| Search and combined filters | Non-matching search/category/availability returned the correct empty state. Clear filters restored records and search focus. |
| Actual sorting | Quantity sorting placed the 4-unit item before the 1-unit item; date sorting placed the dated batch before the undated item. |
| Requests | Add, edit, cancel removal and confirmed removal worked. Two same-name rice batches had distinct date labels and accessible names. |
| Packing | Two households requesting 12 units across two dated batches received a 7-unit plan from available stock. |
| Manual adjustments | An 8-unit proposal against 5 units in one batch was rejected. A valid 6-unit custom plan applied; Reset restored the 7-unit proportional plan. |
| Confirmation | Cancel preserved the workspace; confirming the reviewed 7-unit distribution recorded it. |
| Concurrent tabs | A prior stale confirmation was rejected. In the final regression, a stock update retained another tab's search text, focus and caret position. |
| History | Closed records initially contained no table rows; opening a record rendered its four rows. A second-tab update preserved the open record and focused summary. |
| Actual history CSV | Download parsed to four rows totaling exactly 7 units, with both `2026-11-01` and `2026-12-01` batch dates. |
| Actual JSON backup | Download parsed to 2 stock items, 2 open requests and 1 distribution; pending demand totaled 5, recorded units 7. After restocking, on-hand stock totaled 1. |
| Restore | The exact downloaded compact backup restored after confirmation, showing the expected 2/2/1 counts. An earlier malformed file was rejected. |
| Mobile core journey | At 390px: stock → request → packing → record → More → history worked, recording 3 units. Escape closed the More dialog. |
| Mobile backup | After scrolling the settings controls into view, the download completed; its parsed JSON contained the expected single test stock item. |
| Clear workspace | Cancel preserved the test records; confirmed clear produced zero stock, requests and history. |
| Print | A packing PDF was generated on the release. A preceding PDF content check found one page with the household reference, item and 3-of-3 quantities. No physical printer was tested. |
| Literal markup | A stock label containing `<b>` rendered as text rather than creating an element. |
| Keyboard | Availability selection exposed aria-pressed and retained focus. Dialog Escape and focus restoration were exercised on the listed flows. |

Not every physical device, assistive technology, operating system or failure timing is covered by these journeys.

## Responsive layout and accessibility

- Final home and stock screens had no document-level horizontal overflow at 390, 768 and 1440px.
- Final homepage axe audit: **0 violations, 0 incomplete checks**.
- Guide, stock/add-item form, packing, history and settings audits on the exercised builds returned no violations; the listed stock/form, history, guide and settings runs also had no incomplete checks.
- The final mobile request form had **0 violations and 1 incomplete color-contrast check** for its explanatory paragraph. Axe could not determine the background because of overlapping-element detection. The observed text is `#657184` on white, with a calculated 4.94:1 contrast ratio. This is a manually reviewed check, not a claim that the automated audit was fully clean.
- Fixed findings: mobile menu stacking behind animated hero text; mobile icon-only link name; availability group semantics; placeholder contrast; search focus and expanded-history preservation; batch labels in request and adjustment forms; dialog save/dismiss race protection.
- Reduced-motion styles disable decorative motion. Entrance animations release their temporary transform layers after completion.

These checks do not establish WCAG conformance or full screen-reader/cross-browser coverage.

## Security and data handling

Source review checked display escaping, imported IDs, validation, write boundaries and exports. Prototype-key identifiers are rejected. Backups are schema checked and limited by UTF-8 bytes. Every saved write fits the same 5 MB budget as its compact export; over-capacity writes abort. History is never silently truncated to make a save fit. State and history-count limits have explicit messages and are explained in Settings and the guide.

The live homepage returned HTTP 200 with the configured content security policy, nosniff, referrer policy and a permissions policy disabling camera, microphone and geolocation. The application has no third-party runtime dependencies, credentials, external API calls, analytics or server-side household records. No package installation or dependency audit was required for runtime packages because there are none. This is not a supply-chain certification.

Storage retry and transaction-abort behavior was tested with controlled API failures. Actual browser permission-denial, disk-exhaustion, cross-browser failure handling, a full independent penetration test, large real-world workspaces and a pantry-operator field study remain outside the verified evidence. Backups are plaintext; device/browser access must be controlled by the pantry.

No measured time saving, health outcome, security certification or winning score is claimed.
