# Architecture Diagram

```text
+------------------------------------------------------------------------------------------+
|                              CrossSQA Test Architecture                                     |
+------------------------------------------------------------------------------------------+

                                    +-------------------+
                                    |   Runtime Env    |
                                    | BASE_URL         |
                                    | API_BASE_URL     |
                                    | LOGIN selectors  |
                                    +---------+---------+
                                              |
                                              v
 +------------------------------------------------------------------------------------------+
 |                                   Site Adapter Layer                                        |
 | tests/config/site.config.ts                                                              |
 | - baseURL                                                                               |
 | - requiredRoutes                                                                        |
 | - loginPage                                                                             |
 | - protectedPage                                                                         |
 | - expectedTitleText                                                                     |
 | - auth                                                                                  |
 | - securityHeaders                                                                      |
 | - api                                                                                   |
 +--------------------------------------------+-------------------------------------------+
                                              |
                                              v
 +------------------------------------------------------------------------------------------+
 |                                 Reusable Test Layer                                        |
 | tests/helpers/qa.ts                                                                      |
 | tests/helpers/auth.ts                                                                    |
 | tests/helpers/api.ts                                                                     |
 | - gotoAndCollectErrors                                                                   |
 | - runAxeScan                                                                            |
 | - assertFormLabels                                                                      |
 | - assertKeyboardNavigation                                                              |
 | - assertSecurityHeaders                                                                  |
 | - assertNoBrokenRoutes                                                                  |
 | - expectJsonResponse                                                                     |
 | - expectSchemaShape                                                                      |
 +--------------------------------------------+-------------------------------------------+
                                              |
                                              v
 +------------------------------------------------------------------------------------------+
 |                               Page Object / Fixture Layer                                  |
 | tests/pages/BasePage.ts                                                                  |
 | tests/pages/LoginPage.ts                                                                  |
 | tests/pages/HomePage.ts                                                                   |
 | tests/fixtures/testData.ts                                                               |
 | - navigation helpers                                                                      |
 | - login actions                                                                          |
 | - home validation                                                                       |
 | - valid/invalid data builders                                                            |
 +--------------------------------------------+-------------------------------------------+
                                              |
                                              v
 +------------------------------------------------------------------------------------------+
 |                                    Test Suite Layer                                        |
 | tests/smoke.spec.ts                                                                      |
 | tests/security.spec.ts                                                                    |
 | tests/accessibility.spec.ts                                                              |
 | tests/api.spec.ts                                                                        |
 | tests/juice-shop.spec.ts                                                                 |
 |                                                                                          |
 | - core smoke checks                                                                      |
 | - page validation                                                                        |
 | - security headers and auth checks                                                       |
 | - axe and keyboard checks                                                                 |
 | - API contract/regression checks                                                          |
 | - local Juice Shop adapter checks                                                        |
 +--------------------------------------------+-------------------------------------------+
                                              |
                                              v
 +------------------------------------------------------------------------------------------+
 |                              Playwright Browser Matrix                                     |
 | - chromium                                                                               |
 | - firefox                                                                                |
 | - webkit                                                                                |
 | - mobile-chrome                                                                          |
 | - tablet-ipad                                                                           |
 +------------------------------------------------------------------------------------------+

                     Application Under Test (web app / API under validation)
``` 

## How it works

1. Runtime environment variables define the app and API endpoints.
2. The adapter layer translates app-specific setup into a standard contract.
3. Shared helpers perform UI/API checks without hardcoding app selectors.
4. Page objects and fixtures keep tests readable and reusable.
5. The browser matrix runs the same suite across desktop, mobile, and tablet devices.
6. Smoke, security, accessibility, and API suites validate critical risk areas.

## Key principle

The system separates:
- generic test logic
- app-specific config
- page actions and data creation

This keeps the test suite maintainable across many applications.
