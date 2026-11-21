// The site adapter is the single place where app-specific behavior is defined. This keeps the reusable
// test suite independent from framework-specific selectors or business logic.
export type SiteRoute = {
  path: string;
  name: string;
  expectedText?: string[];
  expectedHeading?: string;
};

export type SiteLoginPage = {
  path: string;
  emailSelector: string;
  passwordSelector: string;
  submitSelector?: string;
};

export type ProtectedPage = {
  path: string;
  expectedTitleText?: string;
  protectedContentSelector?: string;
};

export type SecurityScenario = {
  name: string;
  path: string;
  expectedStatus: Array<401 | 403>;
};

export type ApiSuccessStatus = 200 | 201 | 202 | 203 | 204;

export type ApiPaginationConfig = {
  pageParameter: string;
  pageSizeParameter: string;
  sortParameter: string;
  orderParameter: string;
  pageSize: number;
  sortField: string;
  order: 'asc' | 'desc';
  pageMetadataPath: string;
  pageSizeMetadataPath: string;
  totalMetadataPath: string;
  itemsPath?: string;
};

export type AccessibilityConfig = {
  reducedMotionProbe?: {
    selector: string;
    cssProperty: string;
    expectedValue: string;
  };
  liveRegion?: {
    triggerSelector: string;
    regionSelector: string;
    expectedText: string;
  };
  dialog?: {
    openSelector: string;
    dialogSelector: string;
    closeSelector: string;
  };
};

export type TenantResource = {
  token: string;
  resourcePath: string;
};

export type ApiConfig = {
  baseURL: string;
  healthPath?: string;
  listPath?: string;
  detailPath?: string;
  missingDetailPath?: string;
  createPath?: string;
  profilePath?: string;
  resourcePathTemplate?: string;
  mutationsEnabled: boolean;
  createdStatuses: ApiSuccessStatus[];
  updatedStatuses: ApiSuccessStatus[];
  deletedStatuses: ApiSuccessStatus[];
  pagination?: ApiPaginationConfig;
  tenantIsolation?: {
    tenantA: TenantResource;
    tenantB: TenantResource;
  };
};

export type SiteAdapter = {
  baseURL: string;
  requiredRoutes: SiteRoute[];
  loginPage: SiteLoginPage;
  protectedPage: ProtectedPage;
  expectedTitleText: string;
  securityHeaders: string[];
  accessibility?: AccessibilityConfig;
  auth: {
    username?: string;
    password?: string;
    loginPath: string;
    emailSelector: string;
    passwordSelector: string;
  };
  securityScenarios?: SecurityScenario[];
  api: ApiConfig;
};

const defaultBaseUrl = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const defaultApiBaseUrl = process.env.API_BASE_URL ?? `${defaultBaseUrl}/api`;
const tenantValues = [
  process.env.TENANT_A_TOKEN,
  process.env.TENANT_A_RESOURCE_PATH,
  process.env.TENANT_B_TOKEN,
  process.env.TENANT_B_RESOURCE_PATH,
];
const configuredTenantValues = tenantValues.filter(Boolean).length;

if (configuredTenantValues > 0 && configuredTenantValues < tenantValues.length) {
  throw new Error('Tenant isolation requires TENANT_A_TOKEN, TENANT_A_RESOURCE_PATH, TENANT_B_TOKEN, and TENANT_B_RESOURCE_PATH.');
}

const tenantIsolation = configuredTenantValues === tenantValues.length
  ? {
      tenantA: { token: tenantValues[0]!, resourcePath: tenantValues[1]! },
      tenantB: { token: tenantValues[2]!, resourcePath: tenantValues[3]! },
    }
  : undefined;

if (tenantIsolation && (
  tenantIsolation.tenantA.token === tenantIsolation.tenantB.token
  || tenantIsolation.tenantA.resourcePath === tenantIsolation.tenantB.resourcePath
)) {
  throw new Error('Tenant isolation requires distinct tenant tokens and resource paths.');
}

export const siteAdapter: SiteAdapter = {
  baseURL: defaultBaseUrl,
  expectedTitleText: process.env.EXPECTED_TITLE_TEXT ?? 'Application',
  requiredRoutes: [
    { path: '/', name: 'home', expectedText: ['Welcome', 'Sign in'], expectedHeading: 'Home' },
    { path: '/login', name: 'login', expectedText: ['Login', 'Email', 'Password'], expectedHeading: 'Login' },
    { path: '/dashboard', name: 'dashboard', expectedText: ['Dashboard'], expectedHeading: 'Dashboard' },
  ],
  loginPage: {
    path: process.env.LOGIN_PATH ?? '/login',
    emailSelector: process.env.LOGIN_EMAIL_SELECTOR ?? '#email',
    passwordSelector: process.env.LOGIN_PASSWORD_SELECTOR ?? '#password',
    submitSelector: process.env.LOGIN_SUBMIT_SELECTOR ?? 'button[type="submit"]',
  },
  protectedPage: {
    path: process.env.PROTECTED_PATH ?? '/dashboard',
    expectedTitleText: process.env.PROTECTED_TITLE ?? 'Dashboard',
    protectedContentSelector: process.env.PROTECTED_CONTENT_SELECTOR,
  },
  accessibility: {},
  securityHeaders: [
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
  ],
  auth: {
    username: process.env.E2E_USER,
    password: process.env.E2E_PASSWORD,
    loginPath: process.env.LOGIN_PATH ?? '/login',
    emailSelector: process.env.LOGIN_EMAIL_SELECTOR ?? '#email',
    passwordSelector: process.env.LOGIN_PASSWORD_SELECTOR ?? '#password',
  },
  securityScenarios: [],
  api: {
    baseURL: defaultApiBaseUrl,
    healthPath: process.env.API_HEALTH_PATH ?? '/health',
    listPath: process.env.API_LIST_PATH ?? '/users',
    detailPath: process.env.API_DETAIL_PATH ?? '/users/1',
    missingDetailPath: process.env.API_MISSING_DETAIL_PATH,
    createPath: process.env.API_CREATE_PATH ?? '/users',
    profilePath: process.env.API_PROFILE_PATH,
    resourcePathTemplate: process.env.API_RESOURCE_PATH_TEMPLATE ?? '/users/{id}',
    mutationsEnabled: process.env.ALLOW_API_MUTATIONS === 'true'
      && process.env.API_MUTATION_TARGET === defaultApiBaseUrl,
    createdStatuses: [201],
    updatedStatuses: [200, 204],
    deletedStatuses: [200, 204],
    tenantIsolation,
  },
};

export const getSiteConfig = (): SiteAdapter => siteAdapter;
