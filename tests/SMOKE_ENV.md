## Playwright Smoke Env

Set these environment variables before running real flow smoke tests:

- `E2E_BASE_URL` (optional, default: `http://127.0.0.1:5173`)
- `E2E_ASSESSMENT_URL` (required for assessment smoke), example: `http://127.0.0.1:5173/assessment/<companyId>/<slug>`
- `E2E_LOGIN_EMAIL` (required for login smoke)
- `E2E_LOGIN_PASSWORD` (required for login smoke)

Optional result form values:

- `E2E_RESULT_NAME`
- `E2E_RESULT_EMAIL`
- `E2E_RESULT_PHONE`
- `E2E_RESULT_LOCATION`

Run:

- `npm run e2e:smoke`
- `npm run e2e:headed`
