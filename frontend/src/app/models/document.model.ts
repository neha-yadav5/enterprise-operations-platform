export type DocumentStatus = 'Published' | 'Draft' | 'In review' | 'Archived';

export type DocumentFormat = 'PDF' | 'Word' | 'Spreadsheet' | 'Markdown';

export type AccessLevel = 'Everyone' | 'Department' | 'Restricted';

export interface DocumentVersion {
  version: string;
  at: string;
  authorId: string;
  note: string;
}

export interface DocumentItem {
  /** Business identifier, e.g. DOC-3301. */
  id: string;
  name: string;
  folder: string;
  format: DocumentFormat;
  status: DocumentStatus;
  ownerId: string;
  updatedAt: string;
  sizeKb: number;
  access: AccessLevel;
  tags: string[];
  versions: DocumentVersion[];
}

export interface DocumentDraft extends Omit<DocumentItem, 'id' | 'versions' | 'updatedAt'> {
  id?: string;
}

export const DOCUMENT_FOLDERS = [
  'Policies',
  'Contracts',
  'Finance',
  'Engineering',
  'Onboarding',
] as const;

export const DOCUMENT_FORMATS: DocumentFormat[] = ['PDF', 'Word', 'Spreadsheet', 'Markdown'];

export const DOCUMENT_STATUSES: DocumentStatus[] = ['Published', 'Draft', 'In review', 'Archived'];

export const ACCESS_LEVELS: AccessLevel[] = ['Everyone', 'Department', 'Restricted'];
