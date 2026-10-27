import dayjs from 'dayjs';

import type { Employee } from '#/services/domain';

const groups = [
  'Ingeniería',
  'Ventas',
  'Recursos Humanos',
  'Marketing',
  'Finanzas',
  'Producto',
  'Atención al cliente',
  'Operaciones',
];

const people = [
  ['Valeria', 'Rojas', 'Ingeniería', 'Analista de sistemas'],
  ['Diego', 'Salazar', 'Ventas', 'Ejecutivo de cuentas'],
  ['Camila', 'Paredes', 'Recursos Humanos', 'Especialista de personas'],
  ['Mateo', 'García', 'Marketing', 'Diseñador de contenido'],
  ['Lucía', 'Mendoza', 'Finanzas', 'Analista financiero'],
  ['Joaquín', 'Vega', 'Producto', 'Product designer'],
  ['Renata', 'Castillo', 'Atención al cliente', 'Asesora de servicio'],
  ['Andrés', 'Flores', 'Operaciones', 'Coordinador de logística'],
  ['Sofía', 'Herrera', 'Ingeniería', 'Desarrolladora frontend'],
  ['Gabriel', 'Torres', 'Ventas', 'Ejecutivo comercial'],
  ['Daniela', 'Navarro', 'Recursos Humanos', 'Analista de selección'],
  ['Nicolás', 'Cruz', 'Marketing', 'Analista de marca'],
  ['Mariana', 'Vargas', 'Finanzas', 'Asistente contable'],
  ['Thiago', 'Reyes', 'Producto', 'Analista de producto'],
  ['Alessia', 'Gutiérrez', 'Atención al cliente', 'Supervisora de soporte'],
  ['Sebastián', 'Díaz', 'Operaciones', 'Analista de procesos'],
  ['Julieta', 'Chávez', 'Ingeniería', 'Ingeniera de datos'],
  ['Emilio', 'Ramos', 'Ventas', 'Asesor de ventas'],
  ['Micaela', 'Quispe', 'Recursos Humanos', 'Coordinadora de bienestar'],
  ['Bruno', 'León', 'Marketing', 'Especialista digital'],
  ['Alondra', 'Cárdenas', 'Finanzas', 'Analista de tesorería'],
  ['Patricio', 'Silva', 'Producto', 'Product manager'],
  ['Andrea', 'Campos', 'Atención al cliente', 'Agente de experiencia'],
  ['Franco', 'Medina', 'Operaciones', 'Supervisor de almacén'],
  ['Fiorella', 'Ponce', 'Ingeniería', 'QA de software'],
  ['Rodrigo', 'Acosta', 'Ventas', 'Jefe de ventas'],
  ['Ximena', 'Espinoza', 'Recursos Humanos', 'Generalista de personas'],
  ['Alonso', 'Peña', 'Marketing', 'Redactor creativo'],
  ['Natalia', 'Luna', 'Finanzas', 'Jefa de administración'],
  ['Adrián', 'Ibarra', 'Operaciones', 'Coordinador de distribución'],
] as const;

export const employeeMock: Employee[] = people.map(
  ([firstName, lastName, group, title], index) => {
    const employeeNumber = String(index + 1).padStart(4, '0');
    const fullName = `${firstName} ${lastName}`;
    return {
      id: `emp-${employeeNumber}`,
      code: `EMP-${employeeNumber}`,
      name: fullName,
      firstName,
      lastName,
      title,
      group,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ayni.demo.pe`,
      phone: `+51 9${String(410_000_000 + index * 137_911).slice(0, 8)}`,
      dni: String(70_000_000 + index * 1237),
      manager: index % 8 === 0 ? 'Natalia Luna' : 'Rodrigo Acosta',
      shift: index % 3 === 0 ? '08:00 a 17:00' : '09:00 a 18:00',
      modality:
        index % 3 === 0 ? 'Híbrido' : index % 3 === 1 ? 'Presencial' : 'Remoto',
      startDate: dayjs()
        .subtract(100 + index * 19, 'day')
        .format('YYYY-MM-DD'),
      birthday: dayjs()
        .add(index * 13, 'day')
        .format('YYYY-MM-DD'),
      status:
        index >= 21 && index <= 25
          ? 'Inactivo'
          : index >= 27
            ? 'En onboarding'
            : 'Activo',
      initials: `${firstName[0]}${lastName[0]}`,
      district:
        ['Miraflores', 'San Isidro', 'Surco', 'Barranco'][index % 4] ??
        'Miraflores',
      bankAccount: `191-${String(100_000_000 + index * 79_319).slice(0, 9)}`,
    };
  },
);

export const employeeGroups = groups;
