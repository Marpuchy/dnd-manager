import Link from "next/link";

export default function WelcomePage() {
    const year = new Date().getFullYear();

    return (
        <main className="min-h-screen relative">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-900/10 blur-3xl" />
                <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-amber-800/10 blur-3xl" />
            </div>

            <section className="relative mx-auto max-w-6xl px-6 py-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-ring bg-panel/70 px-4 py-1 text-xs uppercase tracking-[0.2em] text-ink-muted">
                        Gestor profesional para D&D 5e
                    </div>

                    <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight">
                        La mesa de tu campaña,
                        <span className="block text-accent-strong">siempre lista para jugar.</span>
                    </h1>

                    <p className="text-lg text-ink-muted max-w-xl">
                        Crea personajes con asistente guiado, gestiona campañas con roles DM/Jugador y organiza tu compendio SRD con
                        filtros avanzados y traducción EN/ES.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-accent-strong"
                        >
                            Entrar
                        </Link>
                        <Link
                            href="/campaigns"
                            className="inline-flex items-center justify-center rounded-lg border border-ring px-6 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent-strong"
                        >
                            Ver campañas
                        </Link>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-sm text-ink-muted">
                        <div className="rounded-xl border border-ring bg-panel/80 p-4">
                            <p className="font-semibold text-ink">Personajes</p>
                            <p>Wizard con validaciones estrictas y exportación a PDF.</p>
                        </div>
                        <div className="rounded-xl border border-ring bg-panel/80 p-4">
                            <p className="font-semibold text-ink">Campañas</p>
                            <p>Sesiones, diarios, mapas y handouts en un solo lugar.</p>
                        </div>
                        <div className="rounded-xl border border-ring bg-panel/80 p-4">
                            <p className="font-semibold text-ink">Compendio</p>
                            <p>Hechizos, ítems y PNJ con filtros y colecciones.</p>
                        </div>
                        <div className="rounded-xl border border-ring bg-panel/80 p-4">
                            <p className="font-semibold text-ink">Edición viva</p>
                            <p>Historial de cambios, deshacer/rehacer y autosave.</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-ring bg-panel/90 p-6 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink-muted">
                        <span>Panel de campaña</span>
                        <span className="rounded-full bg-emerald-900/10 px-3 py-1 text-emerald-900">DM</span>
                    </div>
                    <div className="mt-6 space-y-4">
                        <div className="rounded-xl border border-ring bg-white/80 p-4">
                            <p className="font-semibold text-ink">Sombras sobre Neverwinter</p>
                            <p className="text-sm text-ink-muted">Sesión 12 · Activa · 4 jugadores</p>
                        </div>
                        <div className="rounded-xl border border-ring bg-white/80 p-4">
                            <p className="font-semibold text-ink">Última nota</p>
                            <p className="text-sm text-ink-muted">
                                Los PJ encontraron el mapa del altar. Próxima sesión: decidir alianza con la guardia.
                            </p>
                        </div>
                        <div className="rounded-xl border border-ring bg-white/80 p-4">
                            <p className="font-semibold text-ink">Atajos</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full border border-ring px-3 py-1">Nuevo PNJ</span>
                                <span className="rounded-full border border-ring px-3 py-1">Generar hoja PDF</span>
                                <span className="rounded-full border border-ring px-3 py-1">Abrir mapa</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="px-6 pb-10 text-center text-xs text-ink-muted">
                © {year} — DND Manager • Creado por Marc Ibáñez
            </footer>
        </main>
    );
}
