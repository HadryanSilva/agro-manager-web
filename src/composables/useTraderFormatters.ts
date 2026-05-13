/**
 * Composable com formatadores reutilizados em todo o módulo trader.
 * Instâncias de Intl.NumberFormat e Intl.DateTimeFormat criadas uma única vez
 * e compartilhadas entre todas as chamadas — evita alocação a cada render.
 */
export function useTraderFormatters() {
  // Instâncias criadas uma vez por uso do composable
  const currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const kgFmt       = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
  const dateFmt     = new Intl.DateTimeFormat('pt-BR')

  function currency(value: number): string {
    return currencyFmt.format(value)
  }

  function kg(value: number): string {
    return kgFmt.format(value) + ' Kg'
  }

  // Acrescenta T00:00:00 para evitar off-by-one por fuso ao parsear datas ISO (YYYY-MM-DD)
  function formatDate(date: string): string {
    return dateFmt.format(new Date(date + 'T00:00:00'))
  }

  return { currency, kg, formatDate }
}
