import { Injectable, computed, inject, signal } from '@angular/core';

import { Department, DepartmentDraft, slugify } from '../models/department.model';
import { EmployeeService } from './employee.service';

/**
 * In-memory department store.
 *
 * Headcount is never stored — it is derived from the employee roster, so the
 * two can never drift. Only planned figures (capacity target, open roles,
 * budget) live here.
 */
@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly employees = inject(EmployeeService);
  private readonly store = signal<Department[]>(SEED);

  readonly departments = this.store.asReadonly();
  readonly count = computed(() => this.store().length);

  byId(id: string): Department | undefined {
    return this.store().find((department) => department.id === id);
  }

  byName(name: string): Department | undefined {
    return this.store().find((department) => department.name === name);
  }

  /** Active employees assigned to the department. */
  headcount(department: Department): number {
    return this.employees
      .employees()
      .filter((employee) => employee.department === department.name && employee.status !== 'Inactive')
      .length;
  }

  staff(department: Department) {
    return this.employees.employees().filter((employee) => employee.department === department.name);
  }

  /** Filled percentage against the planned headcount. */
  capacityPct(department: Department): number {
    if (department.capacityTarget === 0) return 0;
    return Math.round((this.headcount(department) / department.capacityTarget) * 100);
  }

  parentOf(department: Department): Department | undefined {
    return department.parentId ? this.byId(department.parentId) : undefined;
  }

  update(id: string, patch: Partial<Department>): void {
    this.store.update((departments) =>
      departments.map((department) =>
        department.id === id ? { ...department, ...patch } : department,
      ),
    );
  }

  add(draft: DepartmentDraft): Department {
    const department: Department = {
      ...draft,
      id: draft.id?.trim() || slugify(draft.name),
      spent: 0,
    };
    this.store.update((departments) => [department, ...departments]);
    return department;
  }
}

const SEED: Department[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    description:
      'Platform, product and infrastructure engineering across the operations suite.',
    leadId: 'EMP-1008',
    location: 'London',
    budget: 4200000,
    spent: 2810000,
    openRoles: 6,
    capacityTarget: 8,
    parentId: null,
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial control, reporting, procurement and vendor management.',
    leadId: 'EMP-1031',
    location: 'Warsaw',
    budget: 1450000,
    spent: 890000,
    openRoles: 2,
    capacityTarget: 4,
    parentId: null,
  },
  {
    id: 'people-ops',
    name: 'People Ops',
    description: 'Hiring, onboarding, employee relations and organisational policy.',
    leadId: 'EMP-1015',
    location: 'Singapore',
    budget: 980000,
    spent: 615000,
    openRoles: 1,
    capacityTarget: 3,
    parentId: null,
  },
  {
    id: 'it',
    name: 'IT',
    description: 'Internal systems, endpoint management, access control and support.',
    leadId: 'EMP-1063',
    location: 'Berlin',
    budget: 1120000,
    spent: 742000,
    openRoles: 3,
    capacityTarget: 4,
    parentId: null,
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Product design, research and the shared design system.',
    leadId: 'EMP-1023',
    location: 'Berlin',
    budget: 760000,
    spent: 402000,
    openRoles: 1,
    capacityTarget: 3,
    parentId: null,
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Business operations, workplace, and cross-functional programme delivery.',
    leadId: 'EMP-1001',
    location: 'London',
    budget: 2350000,
    spent: 1180000,
    openRoles: 2,
    capacityTarget: 3,
    parentId: null,
  },
];
