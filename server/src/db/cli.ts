import 'dotenv/config'
import { createPool } from './pool.js'
import { migrate } from './migrate.js'
import { seedFromCatalog } from './seed.js'

/* Uso: npm run db:migrate | npm run db:seed (lê DATABASE_URL). */
const command = process.argv[2]
const db = createPool()
try {
  if (command === 'migrate') {
    const applied = await migrate(db)
    console.log(applied.length ? `Migrações aplicadas: ${applied.join(', ')}` : 'Banco já atualizado.')
  } else if (command === 'seed') {
    await seedFromCatalog(db)
    console.log('Catálogo carregado (itens existentes não foram alterados).')
  } else {
    console.error('Comando desconhecido. Use migrate ou seed.')
    process.exitCode = 1
  }
} finally {
  await db.end()
}
