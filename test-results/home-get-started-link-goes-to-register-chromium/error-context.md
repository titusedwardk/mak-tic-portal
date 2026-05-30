# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> get started link goes to register
- Location: tests/e2e/home.spec.ts:10:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*register/
Received string:  "http://localhost:3000/"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    12 × unexpected value "http://localhost:3000/"

```

```yaml
- banner:
  - text: M Mak-TIC
  - navigation:
    - link "Showcase":
      - /url: /showcase
    - link "Sign In":
      - /url: /login
    - link "Get Started":
      - /url: /register
      - button "Get Started"
- main:
  - text: The Future of African Innovation
  - heading "Turn your research into a commercial reality." [level=1]
  - paragraph: Makerere University Technology & Innovation Center empowers students, alumni, and researchers to build, fund, and scale breakthrough ideas.
  - link "Submit a Project":
    - /url: /register
    - button "Submit a Project"
  - link "Explore Showcase":
    - /url: /showcase
    - button "Explore Showcase"
  - heading "Access Funding" [level=3]
  - paragraph: Apply for university grants, seed capital, and external innovation challenges directly through the portal.
  - heading "Expert Mentorship" [level=3]
  - paragraph: Connect with industry experts, alumni, and faculty. Get your business model refined by the best.
  - heading "AI-Powered Evaluation" [level=3]
  - paragraph: Get instant automated feedback, market viability scores, and SDG tracking powered by Google Gemini AI.
- contentinfo:
  - paragraph: © 2026 Makerere University Technology & Innovation Center (Mak-TIC). All rights reserved.
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('has title', async ({ page }) => {
  4  |   await page.goto('/');
  5  | 
  6  |   // Expect a title "to contain" a substring.
  7  |   await expect(page).toHaveTitle(/Mak-TIC/);
  8  | });
  9  | 
  10 | test('get started link goes to register', async ({ page }) => {
  11 |   await page.goto('/');
  12 | 
  13 |   // Click the Get Started link
  14 |   await page.click('text=Get Started');
  15 | 
  16 |   // The Get Started link points to /register
> 17 |   await expect(page).toHaveURL(/.*register/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  18 | });
  19 | 
```