# Arquitectura del sistema (D&D Manager)

## Objetivo
Plataforma web profesional para gestionar D&D 5e (SRD/OGL) con enfoque en velocidad, usabilidad y datos extensibles. El objetivo es unificar el proyecto actual en una base sólida, preparada para crecer a un producto "Pro".

## Stack objetivo
- Frontend: Next.js App Router + React + TypeScript + Tailwind CSS
- Backend/API: Route Handlers (REST) o tRPC (fase 2)
- DB: PostgreSQL
- ORM: Prisma
- Auth: NextAuth.js
- Estado/Cache: TanStack Query
- PDF: generación server-side
- Tests: Vitest + Playwright (básico)

## Principios
- Dominio primero: modelos claros para campañas, personajes y compendio.
- Extensible: SRD + contenido custom + traducciones.
- UX rápida: navegación sin fricción, guardado inmediato, validaciones visibles.
- Seguridad: permisos por campaña y roles DM/Jugador.

## Módulos
1. **Auth + Perfil**
   - Registro/login, sesiones, preferencia de idioma, modo DM/Jugador por defecto.
2. **Campañas**
   - Estados: activa/pausada/archivada.
   - Miembros, roles, sesiones, diario, notas, mapas, handouts.
3. **Personajes**
   - Wizard guiado y vista hoja editable en vivo.
   - Historial de cambios por entidad y deshacer/rehacer.
4. **Compendio**
   - Conjuros, ítems, dotes, monstruos, PNJ (SRD + custom).
   - Filtros avanzados y colecciones personalizadas.
5. **Notas y recursos**
   - Notas por campaña, assets (mapas/handouts), tags.
6. **Exportación**
   - Export JSON y PDF de hoja.

## Flujo de datos
- UI (RSC + Client Components) -> TanStack Query -> API route handlers -> Prisma -> PostgreSQL.
- Para acciones muy frecuentes (edición en vivo): usar server actions o endpoints optimizados.

## Internacionalización (EN/ES)
- UI con diccionarios locales + preferencia de usuario.
- Traducción de datos de la API (SRD/5e API) mediante un servicio de traducción configurable y cacheado.
- Estrategia: idioma base = EN; traducciones ES se guardan y reutilizan.

## Archivos y media
- Imágenes (personajes, mapas, handouts) en storage externo (Vercel Blob, S3 o equivalente).
- DB guarda metadatos + URLs.

## Observabilidad
- Logs server-side con niveles (info/warn/error).
- Métricas básicas (errores, tiempos de respuesta, endpoints críticos).

## Decisiones pendientes
- Soporte offline (PWA y cache local). Se recomienda decidir antes de la fase 2.
