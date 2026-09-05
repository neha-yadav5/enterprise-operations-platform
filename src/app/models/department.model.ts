export interface Department {
  /** Slug used in the URL, e.g. `engineering`. */
  id: string;
  name: string;
  description: string;
  leadId: string;
  location: string;
  budget: number;
  spent: number;
  openRoles: number;
  /** Planned headcount; actual headcount is derived from the employee store. */
  capacityTarget: number;
  parentId: string | null;
}

export interface DepartmentDraft extends Omit<Department, 'id' | 'spent'> {
  id?: string;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
