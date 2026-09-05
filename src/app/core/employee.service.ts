import { Injectable, computed, signal } from '@angular/core';

import { Employee, EmployeeDraft, fullName } from '../models/employee.model';

/**
 * In-memory employee store.
 *
 * There is no backend yet (see docs/02_Frontend_PRDs/02_Employees.md section 19),
 * so this holds the fixture roster in a signal. Reads are synchronous, which
 * is what lets `/employees` prerender with real rows instead of a skeleton.
 * When the API lands, only this class changes — components consume signals.
 */
@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly store = signal<Employee[]>(SEED);

  readonly employees = this.store.asReadonly();

  readonly count = computed(() => this.store().length);

  byId(id: string): Employee | undefined {
    return this.store().find((employee) => employee.id === id);
  }

  managerOf(employee: Employee): Employee | undefined {
    return employee.managerId ? this.byId(employee.managerId) : undefined;
  }

  reportsTo(id: string): Employee[] {
    return this.store().filter((employee) => employee.managerId === id);
  }

  /** Distinct department names present in the roster, for filter menus. */
  readonly departmentsInUse = computed(() =>
    [...new Set(this.store().map((employee) => employee.department))].sort(),
  );

  /** Next free EMP-#### id, so generated ids never collide with the seed. */
  nextId(): string {
    const highest = this.store().reduce((max, employee) => {
      const numeric = Number(employee.id.replace(/\D/g, ''));
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 1000);
    return `EMP-${highest + 1}`;
  }

  add(draft: EmployeeDraft): Employee {
    const employee: Employee = { ...draft, id: draft.id?.trim() || this.nextId() };
    this.store.update((employees) => [employee, ...employees]);
    return employee;
  }

  update(id: string, patch: Partial<Employee>): void {
    this.store.update((employees) =>
      employees.map((employee) => (employee.id === id ? { ...employee, ...patch } : employee)),
    );
  }

  /** Soft delete — the roster keeps the record and flips it to Inactive. */
  deactivate(id: string): void {
    this.update(id, { status: 'Inactive' });
  }

  search(term: string): Employee[] {
    const needle = term.trim().toLowerCase();
    if (!needle) return this.store();
    return this.store().filter((employee) =>
      [fullName(employee), employee.email, employee.id, employee.title, employee.department]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }
}

const SEED: Employee[] = [
  {
    id: 'EMP-1001',
    firstName: 'Elena',
    lastName: 'Duarte',
    email: 'elena.duarte@nexusone.io',
    title: 'Chief Operating Officer',
    department: 'Operations',
    location: 'London',
    managerId: null,
    employmentType: 'Full-time',
    startDate: '2019-02-04',
    status: 'Active',
  },
  {
    id: 'EMP-1042',
    firstName: 'Amara',
    lastName: 'Okafor',
    email: 'amara.okafor@nexusone.io',
    title: 'Staff Engineer',
    department: 'Engineering',
    location: 'Lagos',
    managerId: 'EMP-1008',
    employmentType: 'Full-time',
    startDate: '2021-06-14',
    status: 'Active',
  },
  {
    id: 'EMP-1008',
    firstName: 'Daniel',
    lastName: 'Reyes',
    email: 'daniel.reyes@nexusone.io',
    title: 'Head of Engineering',
    department: 'Engineering',
    location: 'London',
    managerId: 'EMP-1001',
    employmentType: 'Full-time',
    startDate: '2019-09-02',
    status: 'Active',
  },
  {
    id: 'EMP-1015',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@nexusone.io',
    title: 'People Operations Lead',
    department: 'People Ops',
    location: 'Singapore',
    managerId: 'EMP-1001',
    employmentType: 'Full-time',
    startDate: '2020-03-16',
    status: 'Active',
  },
  {
    id: 'EMP-1023',
    firstName: 'Nina',
    lastName: 'Sørensen',
    email: 'nina.sorensen@nexusone.io',
    title: 'Product Designer',
    department: 'Design',
    location: 'Berlin',
    managerId: 'EMP-1001',
    employmentType: 'Full-time',
    startDate: '2022-01-10',
    status: 'Active',
  },
  {
    id: 'EMP-1031',
    firstName: 'Tomas',
    lastName: 'Nowak',
    email: 'tomas.nowak@nexusone.io',
    title: 'Financial Controller',
    department: 'Finance',
    location: 'Warsaw',
    managerId: 'EMP-1001',
    employmentType: 'Full-time',
    startDate: '2020-11-02',
    status: 'Active',
  },
  {
    id: 'EMP-1044',
    firstName: 'Marco',
    lastName: 'Bianchi',
    email: 'marco.bianchi@nexusone.io',
    title: 'Project Manager',
    department: 'Operations',
    location: 'London',
    managerId: 'EMP-1001',
    employmentType: 'Full-time',
    startDate: '2021-08-23',
    status: 'Active',
  },
  {
    id: 'EMP-1052',
    firstName: 'Lin',
    lastName: 'Wei',
    email: 'lin.wei@nexusone.io',
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    location: 'Singapore',
    managerId: 'EMP-1008',
    employmentType: 'Full-time',
    startDate: '2022-04-11',
    status: 'Active',
  },
  {
    id: 'EMP-1063',
    firstName: 'Sofia',
    lastName: 'Bianchi',
    email: 'sofia.bianchi@nexusone.io',
    title: 'IT Systems Administrator',
    department: 'IT',
    location: 'Berlin',
    managerId: 'EMP-1001',
    employmentType: 'Full-time',
    startDate: '2023-02-06',
    status: 'On leave',
  },
  {
    id: 'EMP-1071',
    firstName: 'Marcus',
    lastName: 'Hale',
    email: 'marcus.hale@nexusone.io',
    title: 'Platform Engineer',
    department: 'Engineering',
    location: 'Remote',
    managerId: 'EMP-1008',
    employmentType: 'Contract',
    startDate: '2023-07-17',
    status: 'Active',
  },
  {
    id: 'EMP-1080',
    firstName: 'Sarah',
    lastName: 'Mensah',
    email: 'sarah.mensah@nexusone.io',
    title: 'IT Support Specialist',
    department: 'IT',
    location: 'Lagos',
    managerId: 'EMP-1063',
    employmentType: 'Full-time',
    startDate: '2023-09-04',
    status: 'Active',
  },
  {
    id: 'EMP-1094',
    firstName: 'Tom',
    lastName: 'Whitfield',
    email: 'tom.whitfield@nexusone.io',
    title: 'Data Analyst',
    department: 'Finance',
    location: 'London',
    managerId: 'EMP-1031',
    employmentType: 'Full-time',
    startDate: '2024-01-15',
    status: 'Active',
  },
  {
    id: 'EMP-1102',
    firstName: 'Ines',
    lastName: 'Almeida',
    email: 'ines.almeida@nexusone.io',
    title: 'UX Researcher',
    department: 'Design',
    location: 'Remote',
    managerId: 'EMP-1023',
    employmentType: 'Part-time',
    startDate: '2024-05-20',
    status: 'Active',
  },
  {
    id: 'EMP-1118',
    firstName: 'Kofi',
    lastName: 'Mensah',
    email: 'kofi.mensah@nexusone.io',
    title: 'Engineering Intern',
    department: 'Engineering',
    location: 'Lagos',
    managerId: 'EMP-1042',
    employmentType: 'Intern',
    startDate: '2026-06-01',
    status: 'Active',
  },
  {
    id: 'EMP-1121',
    firstName: 'Hannah',
    lastName: 'Berg',
    email: 'hannah.berg@nexusone.io',
    title: 'Recruitment Partner',
    department: 'People Ops',
    location: 'Berlin',
    managerId: 'EMP-1015',
    employmentType: 'Full-time',
    startDate: '2022-10-03',
    status: 'Inactive',
  },
];
