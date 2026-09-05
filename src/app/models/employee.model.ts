export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern';

export type EmployeeStatus = 'Active' | 'On leave' | 'Inactive';

export interface Employee {
  /** Business identifier shown in the UI, e.g. EMP-1042. */
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  location: string;
  /** Employee id of the manager, or null for the top of the tree. */
  managerId: string | null;
  employmentType: EmploymentType;
  /** ISO date. */
  startDate: string;
  status: EmployeeStatus;
}

export interface EmployeeDraft extends Omit<Employee, 'id'> {
  id?: string;
}

export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'People Ops',
  'IT',
  'Design',
  'Operations',
] as const;

export const LOCATIONS = [
  'Lagos',
  'London',
  'Berlin',
  'Warsaw',
  'Singapore',
  'Remote',
] as const;

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
];

export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['Active', 'On leave', 'Inactive'];

export function fullName(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`;
}

export function initials(employee: Employee): string {
  return `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase();
}
