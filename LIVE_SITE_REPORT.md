# Live Site Findings Report

## Target

https://idavidov.eu

## Latest v1.1 validation

- 3 passed
- 2 failed

Header validation and axe scanning run independently in v1.1. The previous combined-test result is superseded; this run executes the axe scan even when a header assertion fails.

## Findings

### Missing security headers

The homepage response did not contain expected `Content-Security-Policy`, `X-Frame-Options`, and `X-Content-Type-Options` headers.

This is a defense-in-depth finding, not evidence by itself of an exploitable vulnerability. Confirm current headers and review the site's hosting/application configuration before reporting it as a current issue.

### Critical axe violation: invalid `aria-controls`

A “Load more posts” button referenced an `aria-controls` ID that axe could not find in the document at scan time. The invalid ARIA relationship can prevent assistive technologies from understanding which content the control affects.

The finding should be verified against the page's intended dynamic behavior and retested after any fix.

## Scope limitations

- The public-site example does not test authentication or protected business flows.
- It does not test API contracts, tenant isolation, export limits, or pricing authorization.
- Keyboard checks verify real Tab-key movement, but are not a complete manual WCAG audit.
