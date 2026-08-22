// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
  console.warn('[AI Studio] Database not connected — using mock');
  const noOp = { 
    findMany: async () => [], 
    findFirst: async () => null,
    findUnique: async () => null, 
    create: async (d: unknown) => (d as { data?: unknown })?.data ?? {},
    update: async (d: unknown) => (d as { data?: unknown })?.data ?? {}, 
    delete: async () => ({}) 
  };
  return new Proxy({}, {
    get: (_, prop) => prop === 'query'
      ? new Proxy({}, { get: () => noOp }) : () => new Proxy({}, { get: () => async () => [] }),
  });
}
