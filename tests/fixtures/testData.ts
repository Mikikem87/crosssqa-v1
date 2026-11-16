export type TestUser = {
  id?: number;
  name: string;
  email: string;
  role?: string;
};

export const testUsers: TestUser[] = [
  { id: 1, name: 'QA Admin', email: 'qa.admin@example.com', role: 'admin' },
  { id: 2, name: 'QA User', email: 'qa.user@example.com', role: 'user' },
  { id: 3, name: 'QA Editor', email: 'qa.editor@example.com', role: 'editor' },
];

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
