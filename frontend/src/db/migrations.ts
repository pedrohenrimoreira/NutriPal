/**
 * db/migrations.ts – Migrações do IndexedDB.
 *
 * Dexie gerencia migrações automaticamente via version().stores(),
 * mas aqui documentamos as migrações manuais que precisam de transformação
 * de dados (não apenas mudança de schema).
 *
 * Exemplo de migração futura:
 * db.version(2).stores({ ... }).upgrade(tx => { ... });
 */

// Por ora, nenhuma migração manual necessária.
// O schema v1 está definido em schema.ts.

export {};
