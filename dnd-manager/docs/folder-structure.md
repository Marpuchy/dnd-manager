# Estructura de carpetas (propuesta)

```
src/
  app/
    (public)/            # landing, marketing
    (auth)/              # login/registro
    (app)/               # dashboard y módulos
    api/                 # route handlers
    components/          # UI shared
  modules/               # dominio (campaigns, characters, compendium, notes)
  lib/
    auth/                # NextAuth config, helpers
    db/                  # Prisma client
    i18n/                # diccionarios y helpers
    translation/         # traductor + caché
    validators/          # zod schemas
  styles/                # tokens extra (si aplica)
prisma/
  schema.prisma
  migrations/
public/
  assets/

# Legacy actual
src/app/campaigns, src/app/login, etc. (se migran por fases)
```
