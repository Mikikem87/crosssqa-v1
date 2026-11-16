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
};

export type SecurityScenario = {
  name: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedStatus?: number[];
  body?: Record<string, string>;
};

export type ApiConfig = {
  baseURL: string;
  healthPath?: string;
  listPath?: string;
  detailPath?: string;
  createPath?: string;
  updatePath?: string;
  deletePath?: string;
  authPath?: string;
  profilePath?: string;
};

export type SiteAdapter = {
  baseURL: string;
  requiredRoutes: SiteRoute[];
  loginPage: SiteLoginPage;
  protectedPage: ProtectedPage;
  expectedTitleText: string;
  securityHeaders: string[];
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
  },
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
  securityScenarios: [
    { name: 'tenant isolation', path: '/tenant', expectedStatus: [200, 302, 403, 401] },
    { name: 'export limitation', path: '/exports', expectedStatus: [200, 302, 403, 401] },
    { name: 'pricing check', path: '/checkout', expectedStatus: [200, 302, 403, 401] },
  ],
  api: {
    baseURL: defaultApiBaseUrl,
    healthPath: process.env.API_HEALTH_PATH ?? '/health',
    listPath: process.env.API_LIST_PATH ?? '/users',
    detailPath: process.env.API_DETAIL_PATH ?? '/users/1',
    createPath: process.env.API_CREATE_PATH ?? '/users',
    updatePath: process.env.API_UPDATE_PATH ?? '/users/1',
    deletePath: process.env.API_DELETE_PATH ?? '/users/1',
    authPath: process.env.API_AUTH_PATH ?? '/auth/login',
    profilePath: process.env.API_PROFILE_PATH ?? '/users/me',
  },
};

export const getSiteConfig = (): SiteAdapter => siteAdapter;
