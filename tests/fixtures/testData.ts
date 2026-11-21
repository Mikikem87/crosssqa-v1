export type TestUser = {
  name: string;
  email: string;
  role?: string;
};

export function buildUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    name: 'Generated QA User',
    email: 'generated.qa.user@example.com',
    role: 'user',
    ...overrides,
  };
}

export function buildInvalidUser() {
  return {
    name: '',
    email: 'not-an-email',
    role: 'admin',
  };
}
