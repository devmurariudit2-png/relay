const fs = require('fs');

// The e2e tests were mixed up with the backend tests.
// The memory says: "To prevent test runner conflicts, keep Playwright E2E tests (`.spec.js` files) in a dedicated `e2e/` directory outside of the `Relay-main/` workspace, ensuring Vitest does not erroneously pick them up and crash during backend tests."
if (!fs.existsSync('e2e')) {
  fs.mkdirSync('e2e');
}

// Move auth.spec.js if it exists in Relay-main/services
if (fs.existsSync('Relay-main/services/auth.spec.js')) {
  fs.renameSync('Relay-main/services/auth.spec.js', 'e2e/auth.spec.js');
}

// Check other .spec.js files
const glob = require('child_process').execSync('find Relay-main -name "*.spec.js"').toString().trim().split('\n').filter(Boolean);
for (const file of glob) {
  const filename = file.split('/').pop();
  fs.renameSync(file, `e2e/${filename}`);
}

// The memory also says: "The GitHub Actions CI pipeline (.github/workflows/ci.yml) requires dummy Supabase environment variables (e.g., SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) to be explicitly set in the backend test step to prevent Vitest initialization crashes."
// And: "The GitHub Actions CI pipeline (.github/workflows/ci.yml) requires an explicit step to install '@rolldown/binding-linux-x64-gnu --no-save -w Relay-main' prior to executing backend tests to resolve missing Vitest native binding errors."
// And: "In GitHub Actions, the Playwright E2E job requires `@playwright/test` to be explicitly installed (e.g., `npm install @playwright/test --no-save`) prior to running `npx playwright install` and executing the tests."

let ci = fs.readFileSync('.github/workflows/ci.yml', 'utf8');

ci = ci.replace(
  'run: npm test -w Relay-main',
  `run: npm install @rolldown/binding-linux-x64-gnu --no-save -w Relay-main && npm test -w Relay-main
        env:
          SUPABASE_URL: dummy
          SUPABASE_SERVICE_ROLE_KEY: dummy`
);

ci = ci.replace(
  'run: npx playwright install --with-deps chromium',
  `run: npm install @playwright/test --no-save && npx playwright install --with-deps chromium`
);

ci = ci.replace(
  'run: npx playwright test',
  `run: npx playwright test
        env:
          VITE_SUPABASE_URL: dummy
          VITE_SUPABASE_ANON_KEY: dummy`
);

fs.writeFileSync('.github/workflows/ci.yml', ci);

console.log('Fixed tests and CI config');
