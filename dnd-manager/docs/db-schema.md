# Esquema de DB (Prisma) - Resumen

Este resumen acompaña al archivo `prisma/schema.prisma` (fuente de verdad). Está pensado para entender relaciones y objetivos de cada entidad.

## Núcleo
- **User**: cuenta principal.
- **Account/Session/VerificationToken**: tablas de NextAuth.
- **Campaign**: campaña con estado, creador y configuración.
- **CampaignMember**: relación usuario-campaña con rol (DM/Jugador).
- **Character**: personaje principal, con metadatos y JSON extensible.
- **CharacterStats**: atributos, HP, CA, etc.

## Compendio (SRD + custom)
- **CompendiumEntry**: entidad genérica para conjuros, ítems, dotes, monstruos, PNJ.
- **CompendiumTranslation**: traducciones por idioma (cacheable).
- **Collection / CollectionItem**: colecciones personalizadas por usuario o campaña.

## Notas y recursos
- **Note**: notas generales o por campaña.
- **Asset**: mapas, handouts, imágenes (URL + metadata).

## Historial y auditoría
- **EntityHistory**: cambios por entidad (para deshacer/rehacer y timeline).

## Importación/Exportación
- Se recomienda exportar entidades completas en JSON (Character, Campaign, CompendiumEntry) con metadatos de versión.

## Índices clave
- Índices por `userId`, `campaignId`, `type`, `slug` para búsquedas rápidas.
