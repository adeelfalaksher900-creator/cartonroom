# Cartonroom

Tagline: Find the right fit for the things you ship.

## Inspiration

For a small shop, packing often starts with the boxes already on a shelf. A seller has to choose one, make the products fit, and leave room for protection. Guessing can mean repacking or using a larger carton than necessary. We wanted a practical way to make that decision before the tape comes out.

## What it does

Cartonroom lets a seller enter products, quantities, dimensions, weights, upright restrictions and the inside sizes and content-weight limits of their available boxes. It produces a packing plan with a numbered isometric layout, a list of item positions, and a clear list of any items the planner could not place. Users can change measurement units, add padding, print a plan, and export or import a workspace backup.

The example order is optional. Workspaces stay in the browser; they are not uploaded to an application server.

## How we built it

The frontend is HTML, CSS and JavaScript. The geometry engine treats products as padded rectangular envelopes. It tests orientations and candidate positions, rejecting placements that exceed a box's boundaries, overlap another envelope, lack full envelope support, or exceed the maximum content weight. Several deterministic item orders are tried for each box. The planner prefers a smaller box that holds all remaining items, or otherwise one that holds the most. It repeats until it places the order or no remaining item fits the available boxes.

The visual and placement list use the engine's same coordinates. User inputs and imported files are validated. The Vercel deployment serves a static application with a restrictive content security policy; there are no application credentials or third-party runtime dependencies.

## Challenges and lessons

It was important to distinguish a valid arrangement from the assumption that an item fits because its volume is small enough. An item must also fit in each dimension, respect its allowed orientations, avoid overlap, and rest on supported surfaces. Converting between centimeters and inches also needed enough precision to avoid losing small values when editing.

Packing plans are only as useful as the measurements and real handling rules supplied by a seller. The solver checks support for padded envelopes rather than the physical product inside the padding. It does not model fragility, compression, box tare, load distribution, shipping tariffs or guaranteed optimum solutions. Users need to verify their physical pack.

## What we accomplished

The live workflow allows users to enter a real order and box set, create a plan, edit their data, refresh the page, and export and restore a backup. The geometry test suite covers exact fits, permitted rotations, protective padding, weight limits, split orders, unsupported placement, invalid inputs and 60 deterministic generated scenarios. User time or cost savings have not been measured.

## What’s next

Test the workflow with small sellers and refine the packing rules based on their actual packaging materials. Explore stock quantities, stable stacking rules and shared workspaces only after validating their needs. Add carrier-specific rates only with reliable integrations and clear coverage.

Built with: JavaScript, HTML, CSS, SVG, Vercel.

Live website: https://cartonroom.vercel.app/

Submission note: screenshots and the demo video are intentionally pending the owner's review. The overview says 1–3 minutes, while the rules say 2–5 minutes; target 2–3 minutes to satisfy both. The overview and rules differ on student eligibility; seek organizer clarification before submission.
