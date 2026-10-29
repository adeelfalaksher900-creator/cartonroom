# GatherShelf

**A calmer way for food pantries to turn the stock they have into the things people ask for.**

## Inspiration

When donations change from day to day, pantry volunteers have to reconcile what is on the shelf with each household's preferences. Client-choice models let people select items and volunteers assemble bags; the practical work of planning those bags can still be difficult when an item is scarce.

## What it does

GatherShelf is a single-device workspace for recording stock, adding household requests and reviewing an item-by-item packing plan. It highlights shortages, lets a volunteer adjust packed quantities without rewriting the original requests, and allows recording only after review. Unfilled requests stay open. The workspace can be backed up locally and distribution history exported.

## How we built it

The application uses semantic HTML, CSS, JavaScript modules and IndexedDB. Search, availability and category filters work together; stock and distribution history can be exported as CSV. An integer largest-remainder algorithm shares scarce units in proportion to requests for each item, with stable tie handling. The current stock and requests are checked again inside a transactional write before a distribution is recorded. Fourteen unit tests cover conservation, stale-plan rejection, filtering, export and validation. Browser checks exercise desktop and mobile distribution workflows, export and restore; the test results are documented in the repository.

## Challenges

We needed the allocation to be understandable and reproducible while avoiding claims that any mathematical rule can determine a household's needs. We also needed to prevent stock from being reduced twice when another tab changes the workspace.

## Accomplishments and lessons

The product brings inventory, requested quantities, a reviewable plan, history and backup into one flow without requiring an account. A local workspace offers data control but does not provide automatic synchronization, so the interface needs to explain backups and its one-device boundary clearly.

## What’s next

Validate the workflow with pantry workers and households, test accessibility with assistive technologies, explore safe multi-user synchronization, and improve support for pantry-specific distribution policies.

## Boundaries

A packing plan is not a food safety, allergy, nutritional, or eligibility assessment. Volunteers must verify labels, dates and suitability and apply their own rules. No user-study results or measured time savings are claimed.

**Built with:** JavaScript, HTML, CSS, IndexedDB, Node.js test runner.
