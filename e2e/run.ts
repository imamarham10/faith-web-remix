import { launchBrowser, closeBrowser } from './helpers/setup';

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

interface TestResult {
  name: string;
  suite: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface TestSuite {
  name: string;
  tests: Array<{ name: string; fn: () => Promise<void> }>;
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  beforeEach?: () => Promise<void>;
  afterEach?: () => Promise<void>;
}

const suites: TestSuite[] = [];
let currentSuite: TestSuite | null = null;

// Global test registration functions
export function describe(name: string, fn: () => void): void {
  currentSuite = { name, tests: [] };
  fn();
  suites.push(currentSuite);
  currentSuite = null;
}

export function it(name: string, fn: () => Promise<void>): void {
  if (!currentSuite) throw new Error('it() must be called inside describe()');
  currentSuite.tests.push({ name, fn });
}

export function beforeAll(fn: () => Promise<void>): void {
  if (!currentSuite) throw new Error('beforeAll() must be called inside describe()');
  currentSuite.beforeAll = fn;
}

export function afterAll(fn: () => Promise<void>): void {
  if (!currentSuite) throw new Error('afterAll() must be called inside describe()');
  currentSuite.afterAll = fn;
}

export function beforeEach(fn: () => Promise<void>): void {
  if (!currentSuite) throw new Error('beforeEach() must be called inside describe()');
  currentSuite.beforeEach = fn;
}

export function afterEach(fn: () => Promise<void>): void {
  if (!currentSuite) throw new Error('afterEach() must be called inside describe()');
  currentSuite.afterEach = fn;
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
    },
    toContain(expected: any) {
      if (typeof actual === 'string') {
        if (!actual.includes(expected)) throw new Error(`Expected "${actual}" to contain "${expected}"`);
      } else if (Array.isArray(actual)) {
        if (!actual.includes(expected)) throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`);
    },
    toBeLessThan(expected: number) {
      if (actual >= expected) throw new Error(`Expected ${actual} to be less than ${expected}`);
    },
    toMatch(pattern: RegExp) {
      if (!pattern.test(actual)) throw new Error(`Expected "${actual}" to match ${pattern}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
    },
    not: {
      toBe(expected: any) {
        if (actual === expected) throw new Error(`Expected value to not be ${JSON.stringify(expected)}`);
      },
      toBeNull() {
        if (actual === null) throw new Error(`Expected non-null value`);
      },
      toBeTruthy() {
        if (actual) throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      },
      toContain(expected: any) {
        if (typeof actual === 'string' && actual.includes(expected))
          throw new Error(`Expected "${actual}" to not contain "${expected}"`);
      },
    },
  };
}

async function runAllTests(): Promise<void> {
  console.log(`\n${BOLD}${CYAN}========================================${RESET}`);
  console.log(`${BOLD}${CYAN}  Faith E2E Test Suite (Puppeteer)${RESET}`);
  console.log(`${BOLD}${CYAN}========================================${RESET}\n`);

  // Import all test files (this registers the suites)
  const testFiles = [
    './tests/auth.test',
    './tests/navigation.test',
    './tests/settings.test',
    './tests/quran.test',
    './tests/dhikr.test',
    './tests/prayers.test',
    './tests/calendar.test',
    './tests/names.test',
    './tests/feelings.test',
    './tests/duas.test',
  ];

  console.log(`${CYAN}Loading test files...${RESET}`);
  for (const file of testFiles) {
    try {
      await import(file);
      console.log(`  ${GREEN}✓${RESET} ${file}`);
    } catch (err: any) {
      console.log(`  ${RED}✗${RESET} ${file} — ${err.message}`);
    }
  }

  console.log(`\n${CYAN}Launching browser...${RESET}`);
  await launchBrowser();

  const results: TestResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const suite of suites) {
    console.log(`\n${BOLD}  ${suite.name}${RESET}`);

    if (suite.beforeAll) {
      try {
        await suite.beforeAll();
      } catch (err: any) {
        console.log(`    ${RED}beforeAll failed: ${err.message}${RESET}`);
        suite.tests.forEach((t) => {
          totalSkipped++;
          console.log(`    ${YELLOW}○ SKIP${RESET} ${t.name}`);
        });
        if (suite.afterAll) await suite.afterAll().catch(() => {});
        continue;
      }
    }

    for (const test of suite.tests) {
      if (suite.beforeEach) {
        try {
          await suite.beforeEach();
        } catch (err: any) {
          console.log(`    ${YELLOW}○ SKIP${RESET} ${test.name} (beforeEach failed)`);
          totalSkipped++;
          continue;
        }
      }

      const start = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - start;
        totalPassed++;
        results.push({ name: test.name, suite: suite.name, passed: true, duration });
        console.log(`    ${GREEN}✓ PASS${RESET} ${test.name} ${CYAN}(${duration}ms)${RESET}`);
      } catch (err: any) {
        const duration = Date.now() - start;
        totalFailed++;
        results.push({ name: test.name, suite: suite.name, passed: false, error: err.message, duration });
        console.log(`    ${RED}✗ FAIL${RESET} ${test.name} ${CYAN}(${duration}ms)${RESET}`);
        console.log(`           ${RED}${err.message}${RESET}`);
      }

      if (suite.afterEach) {
        await suite.afterEach().catch(() => {});
      }
    }

    if (suite.afterAll) {
      await suite.afterAll().catch(() => {});
    }
  }

  await closeBrowser();

  // Summary
  console.log(`\n${BOLD}${CYAN}========================================${RESET}`);
  console.log(`${BOLD}  Test Results${RESET}`);
  console.log(`${CYAN}========================================${RESET}`);
  console.log(`  ${GREEN}Passed:  ${totalPassed}${RESET}`);
  console.log(`  ${RED}Failed:  ${totalFailed}${RESET}`);
  if (totalSkipped > 0) console.log(`  ${YELLOW}Skipped: ${totalSkipped}${RESET}`);
  console.log(`  Total:   ${totalPassed + totalFailed + totalSkipped}`);
  console.log(`${CYAN}========================================${RESET}\n`);

  if (totalFailed > 0) {
    console.log(`${BOLD}${RED}Failed Tests:${RESET}`);
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ${RED}✗${RESET} [${r.suite}] ${r.name}`);
      console.log(`    ${RED}${r.error}${RESET}`);
    });
    console.log('');
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error(`${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
