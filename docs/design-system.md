# Sistema de diseño Ayni

## Propósito

“Claridad operativa” define una interfaz cálida, sobria y enfocada en las tareas del día. Los componentes se construyen en `apps/web-hrm` sobre Vue 3, Element Plus y los estilos de Vben, pero la marca, el contenido y los tokens pertenecen a Ayni.

## Tokens

Los valores se definen en `apps/web-hrm/src/styles/tokens.css`. Los componentes deben consumirlos en lugar de introducir colores, radios, espaciados o sombras independientes.

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#0F766E` | Acción principal, selección y navegación activa |
| `--color-primary-soft` | `#CCFBF1` | Selección y fondos de apoyo |
| `--color-accent` | `#F59E0B` | Atención y progreso |
| `--color-ink` | `#0F172A` | Texto principal |
| `--color-ink-muted` | `#334155` | Texto secundario |
| `--color-surface` | `#FAFAF7` | Fondo de la aplicación |
| `--color-card` | `#FFFFFF` | Superficies elevadas |
| `--color-line` | `#E7E5E4` | Bordes y separadores |
| `--color-success` | `#16A34A` | Confirmaciones y estados completados |
| `--color-warning` | `#D97706` | Pendientes que requieren atención |
| `--color-error` | `#DC2626` | Errores y acciones destructivas |
| `--color-info` | `#0284C7` | Información neutral |

Tipografía: titulares con Plus Jakarta Sans y texto/tablas con Inter. La escala tipográfica usa `--font-size-12`, `--font-size-14`, `--font-size-16`, `--font-size-20`, `--font-size-24` y `--font-size-32`.

El espaciado usa incrementos de 4 px (`--space-1` a `--space-8`), con una rejilla visual de 8 px. Controles usan `--radius-control` (10 px), tarjetas `--radius-card` (14 px) y chips `--radius-pill`. `--shadow-float` se reserva para superposiciones y elementos flotantes.

Las variables `--el-*` en `tokens.css` adaptan Element Plus a esta paleta. Para colores semánticos se prefieren `StatusPill` y los estados nativos de Element Plus configurados por tokens.

## Componentes base

| Componente | Ruta | Responsabilidad |
|---|---|---|
| `PageHeading` | `src/components/shared/PageHeading.vue` | Título, descripción, contexto y acciones de una vista |
| `FilterBar` | `src/components/shared/FilterBar.vue` | Distribución coherente y adaptable de filtros |
| `StatePanel` | `src/components/shared/StatePanel.vue` | Estados de carga, vacío y error; incluye reintento accesible |
| `KpiCard` | `src/components/data/KpiCard.vue` | Indicador breve con valor, apoyo y slot de icono |
| `StatusPill` | `src/components/data/StatusPill.vue` | Estado textual y semántico que no depende solo del color |
| `ChartPanel` | `src/components/charts/ChartPanel.vue` | Marco con título, estados y gráfico ECharts adaptable |

Los módulos deben priorizar estos patrones antes de agregar componentes específicos. Los formularios muestran validación en línea; las listas incluyen carga, vacío, error y éxito; las acciones confirmadas informan el resultado con mensajes breves en español peruano.

## Navegación y pestañas

La aplicación conserva el `BasicLayout` de Vben como infraestructura. El tabbar es el tabbar nativo: crea una pestaña por ruta visitada, permite regresar entre vistas y persiste la sesión de navegación. `Mi día` se fija con el metadato `affixTab`; las pestañas normales se cierran con las acciones del propio tabbar. Al cambiar de rol se cierran las pestañas no fijadas y se recarga la aplicación para reconstruir los permisos sin conservar accesos del rol anterior.

Las pestañas dentro de una ficha (por ejemplo, Resumen, Personal y Trabajo) son pestañas de contenido del módulo y se implementarán con esa pantalla en la Fase 2; no se confunden con las pestañas de navegación.

## Accesibilidad y movimiento

- Controles con etiqueta visible o nombre accesible, navegación por teclado y foco visible.
- Los estados muestran texto además del color; los colores de texto y fondo deben mantener contraste WCAG AA.
- Los layouts se revisan a 1366 y 1920 px y no fuerzan scroll horizontal.
- `prefers-reduced-motion` reduce animaciones y transiciones.
- Avatares e ilustraciones usan iniciales o formas geométricas; no se incorporan imágenes de stock.

## Reglas de contenido

Usar español de Perú, frases breves en segunda persona y términos consistentes. No incorporar nombres, logos, paletas, microcopy ni composiciones de productos de terceros o demos de la plantilla.
