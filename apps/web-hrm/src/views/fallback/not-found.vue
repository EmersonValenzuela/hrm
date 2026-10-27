<template>
  <section class="not-found">
    <p class="not-found__code">404</p>
    <h1>No encontramos esta página</h1>
    <p>Revisa la dirección o vuelve a tu espacio de trabajo.</p>
    <RouterLink to="/mi-dia">Ir a Mi día</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: 60vh;
  align-content: center;
  justify-items: start;
  gap: var(--space-3);
  color: var(--color-ink);
}

.not-found__code {
  margin: 0;
  color: var(--color-primary);
  font-family: var(--font-display);
  font-size: var(--font-size-32);
  font-weight: 700;
}

h1,
p {
  margin: 0;
}

a {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
