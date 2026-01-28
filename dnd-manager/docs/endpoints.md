# Endpoints principales (propuesta)

## Auth
- `POST /api/auth/register` -> crea usuario + credenciales
- `GET|POST /api/auth/[...nextauth]` -> sesiones (NextAuth)
- `GET /api/users/me` -> perfil y preferencias

## Campañas
- `GET /api/campaigns` -> lista (según rol)
- `POST /api/campaigns` -> crear campaña
- `GET /api/campaigns/:id` -> detalle
- `PATCH /api/campaigns/:id` -> actualizar
- `POST /api/campaigns/:id/members` -> invitar/unir
- `PATCH /api/campaigns/:id/members/:memberId` -> cambiar rol

## Personajes
- `GET /api/characters` -> lista
- `POST /api/characters` -> crear
- `GET /api/characters/:id` -> detalle
- `PATCH /api/characters/:id` -> editar
- `POST /api/characters/:id/portrait` -> subir imagen
- `POST /api/characters/:id/export` -> export JSON
- `POST /api/characters/:id/pdf` -> export PDF

## Compendio
- `GET /api/compendium?type=SPELL&search=...` -> filtros avanzados
- `POST /api/compendium` -> crear custom
- `GET /api/compendium/:id` -> detalle
- `PATCH /api/compendium/:id` -> editar
- `POST /api/collections` -> crear colección

## SRD / Traducción
- `GET /api/dnd/spells?class=...&level=...&locale=es` -> proxy SRD con traducción opcional
- `POST /api/translate` -> traducir texto y cachear

## Notas y recursos
- `GET /api/notes` / `POST /api/notes`
- `GET /api/assets` / `POST /api/assets` (subidas firmadas)
