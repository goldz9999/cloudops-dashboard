export interface Proposal {
  id: number;
  name: string;
  type: string;
  region: string;
  users: string;
  availability: string;
  migration: string;
  selected: string[];
  createdAt: string;
}

export const isProposalList = (v: unknown): v is Proposal[] =>
  Array.isArray(v) &&
  v.every(
    (p) =>
      typeof p === 'object' &&
      p !== null &&
      typeof p.id === 'number' &&
      typeof p.name === 'string' &&
      typeof p.type === 'string' &&
      typeof p.region === 'string' &&
      typeof p.users === 'string' &&
      typeof p.availability === 'string' &&
      typeof p.migration === 'string' &&
      typeof p.createdAt === 'string' &&
      Array.isArray(p.selected)
  );