<script setup lang="ts">
// Página placeholder para o módulo de gestão de vendas
// Será implementado em versão futura
</script>

<template>
  <div class="sales">
    <div class="sales__header">
      <h1 class="sales__title">Vendas</h1>
      <p class="sales__subtitle">Gestão da produção e receitas</p>
    </div>

    <div class="sales__card">
      <div class="sales__icon">🚧</div>
      <h2 class="sales__card-title">Em construção</h2>
      <p class="sales__card-desc">
        O módulo de gestão de vendas está sendo desenvolvido e em breve estará disponível.
      </p>
      <p class="sales__card-desc">
        Aqui você poderá registrar a venda da produção de cada lavoura, acompanhar
        receitas e visualizar o resultado financeiro completo — cruzando custos e faturamento.
      </p>
      <div class="sales__features">
        <div class="feature-item">
          <span class="feature-item__icon">📦</span>
          <span>Registro de vendas por lavoura</span>
        </div>
        <div class="feature-item">
          <span class="feature-item__icon">💰</span>
          <span>Controle de receitas e faturamento</span>
        </div>
        <div class="feature-item">
          <span class="feature-item__icon">📊</span>
          <span>Resultado financeiro (receita vs custos)</span>
        </div>
        <div class="feature-item">
          <span class="feature-item__icon">📈</span>
          <span>Relatório de vendas exportável</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sales {
  padding: 2rem 1.5rem;
  max-width: 700px;
  margin: 0 auto;
}

.sales__title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.sales__subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 1.75rem;
}

.sales__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  background: var(--color-card);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
}

.sales__icon { font-size: 3rem; }

.sales__card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.sales__card-desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  max-width: 480px;
}

.sales__features {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 0.5rem;
  width: 100%;
  max-width: 360px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: left;
}

.feature-item__icon { font-size: 1rem; flex-shrink: 0; }

@media (max-width: 640px) {
  .sales { padding: 1.25rem 1rem; }
  .sales__card { padding: 2rem 1.25rem; }
}
</style>