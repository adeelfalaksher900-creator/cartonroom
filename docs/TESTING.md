# Verification notes

## Automated

`npm test` exercises stock conservation, proportional allocation, unfilled requests, revision and tamper checks, manual overrides, backup validation and CSV injection escaping. One property-style test covers 1,000 generated demand/stock combinations.

## Deployed browser journey

On the deployed site, a browser test added 3 bags of rice, recorded two requests for 2 bags each, observed the shortage and 3-unit plan, recorded it, and saw the remaining 1-unit request and distribution history. The stock quantity was edited, the manual quantity adjustment was tested, a backup downloaded and restored, and restored totals inspected. Synthetic test records were cleared after backup.

## Remaining verification

Full mobile and keyboard coverage, print output, CSV file contents, cross-tab conflict behavior in a real browser, browser storage failure scenarios and independent penetration testing have not been completed. No pantry worker or household study has been conducted. Design and accessibility need evaluation with actual users and assistive technologies. The software does not guarantee food safety or assess nutrition or eligibility.
