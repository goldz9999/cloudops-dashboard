const PREFIX = 'cloudops:';

/**
 * Lee un valor guardado. Si no existe, el JSON está dañado o no pasa la validación,
 * devuelve el valor por defecto (la app nunca debe fallar por datos guardados viejos).
 */
export function readStorage<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Cuota llena o almacenamiento bloqueado (modo privado): se ignora, la app sigue funcionando.
  }
}