import type { Employee } from './domain';

import { readDemoState, updateDemoState } from './api';

export type { Employee } from './domain';

export interface EmployeeFilters {
  query?: string;
  group?: string;
  startDateAfter?: string;
}

export type NewEmployee = Omit<Employee, 'code' | 'id'>;

export const employeesService = {
  async groups() {
    const { groups } = await readDemoState();
    return [...groups];
  },

  async createGroup(name: string) {
    const normalized = name.trim();
    if (!normalized) {
      throw new Error('Escribe el nombre del equipo.');
    }
    const { groups } = await updateDemoState((state) => {
      if (
        state.groups.some(
          (group) =>
            group.toLocaleLowerCase('es-PE') ===
            normalized.toLocaleLowerCase('es-PE'),
        )
      ) {
        throw new Error('Ya existe un equipo con ese nombre.');
      }
      state.groups.push(normalized);
    });
    if (!groups.includes(normalized)) {
      throw new Error('No pudimos crear el equipo.');
    }
    return normalized;
  },

  async updateGroup(previousName: string, nextName: string) {
    const normalized = nextName.trim();
    if (!normalized) {
      throw new Error('Escribe el nombre del equipo.');
    }
    const { groups } = await updateDemoState((state) => {
      const index = state.groups.indexOf(previousName);
      if (index === -1) throw new Error('No encontramos ese equipo.');
      if (
        state.groups.some(
          (group) =>
            group !== previousName &&
            group.toLocaleLowerCase('es-PE') ===
              normalized.toLocaleLowerCase('es-PE'),
        )
      ) {
        throw new Error('Ya existe un equipo con ese nombre.');
      }
      state.groups[index] = normalized;
      state.employees.forEach((employee) => {
        if (employee.group === previousName) employee.group = normalized;
      });
    });
    if (!groups.includes(normalized)) {
      throw new Error('No pudimos actualizar el equipo.');
    }
    return normalized;
  },

  async removeGroup(name: string) {
    return updateDemoState((state) => {
      if (state.employees.some((employee) => employee.group === name)) {
        throw new Error('Mueve a las personas antes de quitar este equipo.');
      }
      const index = state.groups.indexOf(name);
      if (index === -1) throw new Error('No encontramos ese equipo.');
      state.groups.splice(index, 1);
    });
  },

  async list(filters: EmployeeFilters = {}) {
    const { employees } = await readDemoState();
    const query = filters.query?.trim().toLocaleLowerCase('es-PE');
    return employees.filter((employee) => {
      const matchesQuery =
        !query ||
        [employee.name, employee.code, employee.email, employee.title]
          .join(' ')
          .toLocaleLowerCase('es-PE')
          .includes(query);
      return (
        matchesQuery &&
        (!filters.group || employee.group === filters.group) &&
        (!filters.startDateAfter ||
          employee.startDate >= filters.startDateAfter)
      );
    });
  },

  async get(id: string) {
    const { employees } = await readDemoState();
    return employees.find((employee) => employee.id === id) ?? null;
  },

  async create(data: NewEmployee) {
    let createdCode = '';
    const { employees } = await updateDemoState((nextState) => {
      const sequence =
        Math.max(
          0,
          ...nextState.employees.map((employee) =>
            Number(employee.code.slice(4)),
          ),
        ) + 1;
      const code = `EMP-${String(sequence).padStart(4, '0')}`;
      const id = `emp-${String(sequence).padStart(4, '0')}`;
      createdCode = code;
      nextState.employees.push({ ...data, id, code });
    });
    const employee = employees.find((item) => item.code === createdCode);
    if (!employee) {
      throw new Error('No pudimos agregar a la persona al directorio.');
    }
    return employee;
  },

  async update(id: string, changes: Partial<NewEmployee>) {
    const { employees } = await updateDemoState((nextState) => {
      const index = nextState.employees.findIndex(
        (employee) => employee.id === id,
      );
      const employee = nextState.employees[index];
      if (!employee) {
        throw new Error('No encontramos a esa persona en el directorio.');
      }
      nextState.employees[index] = {
        ...employee,
        ...changes,
      };
    });
    const employee = employees.find((item) => item.id === id);
    if (!employee) {
      throw new Error('No pudimos actualizar los datos de esa persona.');
    }
    return employee;
  },

  async remove(id: string) {
    const { employees } = await updateDemoState((nextState) => {
      const index = nextState.employees.findIndex(
        (employee) => employee.id === id,
      );
      if (!nextState.employees[index]) {
        throw new Error('No encontramos a esa persona en el directorio.');
      }
      nextState.employees.splice(index, 1);
    });
    return employees;
  },
};
