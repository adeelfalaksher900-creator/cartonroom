# Interface reference map

GatherShelf uses a split marketing page and a compact operations workspace. The source is plain HTML/CSS and browser modules; the redesign retains the IndexedDB database, stock and request data, allocation engine, distribution transaction and backup format.

## Mobbin references inspected

| Reference | Applied structure |
| --- | --- |
| [Dropbox product hero](https://mobbin.com/sites/sections/396326c7-6b5f-4ff3-9545-3233ac9eb337) | Dark left text panel, prominent primary action, large right product area, full-width composition. |
| [Shopify inventory](https://mobbin.com/screens/d9deb551-88bf-4c93-91b3-43ef6659ccef) | Compact navigation, stock table, an availability row, search/filter toolbar, right-aligned numeric data and export controls. |
| [Linear project list](https://mobbin.com/screens/3d3a4fae-d824-440a-961b-001c6b715a4a) | Quiet neutral navigation, restrained row actions and a clear hierarchy for operational work. |
| [Squarespace product creation](https://mobbin.com/flows/a6f2928b-4639-4b93-a49f-3d029a57d8d3) | Grouped form fields, clear cancel/save actions and explicit creation states. |
| [eBay collection screen](https://mobbin.com/screens/6e67734b-3308-461b-b979-de406bb91dea) | Mobile search and filtering with readable item rows and a clear add action. |

All copy, the GatherShelf mark and product behavior are specific to GatherShelf. No Mobbin screen images or third-party branding are distributed in the application.

## System

- Colors: saturated blue for actions and allocation quantities; dark neutral marketing panel; white operational surfaces; amber only for shortages.
- Typography: one system sans family, two-line hero, compact application titles and tabular quantities.
- Icons: locally bundled Lucide SVG symbols obtained through Supericons. No Unicode pictograms in navigation or action buttons.
- Motion: small hero entrances, transform feedback on actions, one-time section reveals and native progress updates. Operational text and notifications stay fully opaque. Reduced-motion preference disables motion.
- Mobile: five primary navigation destinations with a More dialog; stock and packing tables become labeled rows; native forms retain at least 44px controls.

## Verification

See [testing notes](TESTING.md). The home calculator executes the same proportional allocation engine as the workspace. It is an explicitly labeled example and does not populate or alter a real pantry's records.
