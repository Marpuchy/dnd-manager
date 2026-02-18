Gestor profesional de Dungeons & Dragons 5e (SRD/OGL) construido con Next.js App Router.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment

- Copy `.env.example` to `.env.local`.
- Configura `DATABASE_URL` para PostgreSQL.
- Opcional: configura `TRANSLATION_*` si quieres traducciones automaticas.
- IA recomendada gratis: `AI_FREE_ONLY=true`, `AI_PROVIDER=auto`, `GEMINI_API_KEY=...`, `AI_ENABLE_LOCAL_FALLBACK=true` (Gemini principal + Ollama fallback).

### Docker (VPS + IA local gratis)

- Requisitos del VPS: Docker + Docker Compose plugin.
- Mantener la configuracion en `.env.local` (incluye Supabase y servidor).
- El `docker-compose.yml` fuerza modo gratis:
  - `AI_FREE_ONLY=true`
  - `AI_PROVIDER=auto`
  - `AI_ENABLE_LOCAL_FALLBACK=true`

Comandos:

```bash
docker compose --env-file .env.local up -d --build
docker compose logs -f ollama
docker compose logs -f app
```

Notas:

- El primer arranque descarga el modelo (`OLLAMA_MODEL`, por defecto `llama3.1:8b`) y puede tardar varios minutos.
- El modelo queda persistido en el volumen `ollama_data`.
- Para apagar: `docker compose down`.

### Windows autostart (local gratis)

Si quieres que se enciendan automaticamente Ollama y la web al iniciar sesion en Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-autostart.ps1 -RunNow
```

Esto crea una tarea programada de usuario (`DndManager-AI-Web-Autostart`) que ejecuta:

- `scripts/start-local-ai-web.ps1`
- Arranca `ollama serve` si el puerto `11434` no esta activo.
- Arranca la web en `http://127.0.0.1:3000` (modo `start` por defecto).
- Si Windows bloquea la tarea programada por permisos, el instalador hace fallback automatico a la carpeta de Inicio (`Startup`).

Opciones:

- Usar modo desarrollo para la web:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-autostart.ps1 -WebMode dev -RunNow
```

- Cambiar el nombre de la tarea:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-autostart.ps1 -TaskName "MiDndAutostart" -RunNow
```

- Forzar modo instalacion:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-autostart.ps1 -InstallMode startup -RunNow
```

### Docs

- `docs/architecture.md`
- `docs/db-schema.md`
- `docs/endpoints.md`
- `docs/folder-structure.md`
- `docs/roadmap.md`

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

