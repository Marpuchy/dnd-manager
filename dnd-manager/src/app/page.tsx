// app/page.tsx  (Server Component - no "use client")
import Link from "next/link";

export default function WelcomePage() {
    const year = new Date().getFullYear(); // calculado en servidor al renderizar

    return (
        <main className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center px-6 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black pointer-events-none" />
            <div className="relative text-center max-w-xl">
                <h1 className="text-5xl font-extrabold mb-4 text-purple-300 drop-shadow-lg">DND Manager</h1>

                <p className="text-zinc-400 text-lg mb-8">
                    Gestiona tus campañas, personajes y hechizos en un solo lugar. Diseñado para Dungeons & Dragons 5e con una
                    experiencia moderna, rápida y visual.
                </p>

                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-purple-600/60 text-purple-300 hover:bg-purple-900/40 hover:border-purple-500 transition-all text-lg font-semibold"
                >
                    Entrar
                </Link>
            </div>

            <footer className="absolute bottom-6 text-zinc-600 text-sm">© {year} — DND Manager • Creado por Marc Ibáñez</footer>
        </main>
    );
}
