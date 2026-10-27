# Prueba de concepto HRM — Fase 0

**Resultado:** GO para continuar usando Vue Vben Admin 5.x como base visual y técnica. Esta decisión no inicia la Fase 1; la implementación queda limitada a la PoC solicitada.

## Alcance ejecutado

- Se verificó la variante `apps/web-ele` (Element Plus), que arrancó con `pnpm dev` y respondió HTTP 200.
- Se creó `apps/web-hrm` a partir de esa variante. El workspace reconoce la app bajo `apps/*`; se añadieron los comandos raíz `dev:hrm` y `build:hrm`.
- La PoC conserva el `BasicLayout` de Vben: navegación lateral, cabecera y pestañas. Se personalizaron el nombre, el icono, los colores, los textos y los módulos para Ayni; no se modificó `packages/` y se conservó la licencia MIT.
- Mi día y Empleados cargan datos ficticios desde `services/`. El directorio muestra 30 personas y ofrece búsqueda, filtro por equipo y fecha, orden, selección, paginación y ficha rápida en drawer.
- “Ver como” actualiza los roles y reconstruye menús y rutas con el flujo de permisos frontend de Vben. “Restablecer demo” regresa a Colaborador y restaura el estado local.
- La tematización usa tokens propios y variables CSS de Element Plus; no se aplicaron overrides masivos con `!important`.

## Criterios go/no-go

| Criterio de la sección 12 | Evidencia | Resultado |
|---|---|---|
| Identidad propia, sin marca ni contenido de Buk, Horilla o la plantilla | La marca, los textos, los colores y las pantallas son de Ayni. El esqueleto de navegación Vben se conserva de forma intencional, según lo solicitado. | GO con esta decisión explícita |
| Esqueleto Vben reutilizado sin modificar `packages/` | `BasicLayout` y sus elementos de navegación se consumen desde `@vben/layouts`; `git status --short -- packages` no reportó cambios. | GO |
| Selector de roles integrado con permisos | Se probaron Colaborador, Jefe y RR. HH.; cambian las opciones del menú. El directorio, búsqueda y ficha se probaron con RR. HH. | GO |
| Element Plus se puede re-tematizar con tokens | Variables CSS aplicadas a controles, tabla y estados; sin `!important` masivo. | GO |
| Complejidad compatible con una PoC breve | La app, pantallas y flujo de roles funcionan dentro del alcance solicitado. No se mide aquí el esfuerzo de las fases posteriores. | GO |

## Validación realizada

| Comprobación | Resultado |
|---|---|
| Arranque de `apps/web-ele` y `apps/web-hrm` | Ambos servidores respondieron. `web-hrm` se abrió en el navegador con el layout Vben integrado. |
| `pnpm -F @hrm/web-hrm typecheck` | Correcto después de integrar `@vben/layouts`. |
| `pnpm -F @hrm/web-hrm build` | Correcto; la advertencia anterior de importación dinámica del layout fue resuelta. |
| Directorio | Se verificaron 30 resultados, búsqueda, filtro de equipo, orden, paginación, ficha en drawer y 10 filas por página. |
| Permisos de demo | Se comprobó el cambio de menú con Jefe y RR. HH., y que “Restablecer demo” regresa a Colaborador. |
| Shell | Se verificó en el navegador la barra lateral, cabecera, migas de pan, pestañas, selector de rol y menú de cuenta dentro del `BasicLayout` original. |
| Consola | No se observaron errores de ejecución ni mensajes de localización faltante en el recorrido. Permanece el aviso de compatibilidad `[Vben Form]` de la dependencia compartida; no se modificó `packages/`. |

## Observaciones y límites

- Es una demostración exclusivamente frontend: no hay backend, autenticación real ni datos personales reales.
- Los módulos implementados son Mi día y el directorio de Empleados; no se avanzó a la Fase 1 ni a los demás módulos.
- El layout estándar de Vben conserva el aspecto estructural propio de la plantilla; la marca, el idioma, los colores y las pantallas de la demo son propios.
- El estado de demo se guarda localmente. Para volver a los datos iniciales, usar “Restablecer demo”.

## Cómo ejecutar

Desde la raíz del monorepo:

```powershell
pnpm dev:ele
pnpm dev:hrm
pnpm -F @hrm/web-hrm typecheck
pnpm -F @hrm/web-hrm build
```

La PoC no autoriza comenzar la Fase 1; se espera una solicitud explícita para avanzar.
