/**
 * Devuelve una copia del objeto con todos los textos sin espacios al principio ni al final.
 * Se usa antes de enviar un formulario a la API.
 */
export function trimValues<T extends object>(data: T): T {
  const copy = { ...data } as Record<string, unknown>;

  for (const key of Object.keys(copy)) {
    const value = copy[key];

    if (typeof value === 'string') {
      copy[key] = value.trim();
    }
  }

  return copy as T;
}
