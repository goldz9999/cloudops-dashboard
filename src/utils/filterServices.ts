export interface Filterable {
  name: string;
  description: string;
  category: string;
  mainFunction?: string;
}

/** Minúsculas y sin tildes: "computo" encuentra "Cómputo". */
export const normalizeText = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Todas las palabras de la búsqueda deben aparecer en el nombre, la descripción,
 * la categoría o la función principal (en cualquier orden).
 */
export function matchesSearch(item: Filterable, search: string) {
  const q = normalizeText(search);
  if (!q) return true;
  const haystack = normalizeText(
    [item.name, item.description, item.category, item.mainFunction ?? ''].join(' ')
  );
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function matchesCategory(item: Filterable, category: string) {
  return category === 'Todos' || item.category === category;
}

/** Aplica buscador y categoría a la vez (ambas condiciones deben cumplirse). */
export function filterServices<T extends Filterable>(list: T[], search: string, category: string): T[] {
  return list.filter((s) => matchesSearch(s, search) && matchesCategory(s, category));
}