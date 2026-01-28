# Migración desde Supabase (legado → stack objetivo)

## Estado actual
- Auth y datos en Supabase.
- Varias vistas dependen de supabase-js.

## Estrategia de migración
1. **Paridad de datos**: definir esquema Prisma y mapear tablas actuales.
2. **Auth**: mover login/registro a NextAuth (credentials o magic link).
3. **API**: reemplazar llamadas directas a Supabase por endpoints internos.
4. **Storage**: mover imágenes a Vercel Blob o S3.
5. **Limpieza**: retirar supabase-js y variables de entorno.

## Riesgos
- Cambios en permisos/roles.
- Migración de IDs y relaciones.

## Mitigación
- Migrar por módulo, no todo a la vez.
- Mantener endpoints equivalentes hasta terminar.

## Ajustes de usuario (tabla `user_settings`)
Para el selector de tema/idioma/densidad, crea una tabla dedicada en Supabase:

```sql
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'normal',
  locale text default 'es',
  density text default 'comfortable',
  animations boolean default true,
  font_scale text default 'md',
  show_hints boolean default true,
  updated_at timestamptz default now()
);
```

> Nota: este esquema es temporal hasta migrar a Prisma/NextAuth.
