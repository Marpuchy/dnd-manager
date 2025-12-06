// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
      <main className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="max-w-xl w-full border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 space-y-4">
          <h1 className="text-3xl font-bold text-purple-300">
            El Llamado del Velo
          </h1>
          <p className="text-zinc-400">
            Selecciona tu rol para entrar al panel correspondiente.
          </p>

          <div className="flex gap-4 mt-4">
            <Link
                href="/dashboard/player"
                className="flex-1 text-center border border-purple-700/60 rounded-lg px-4 py-2 hover:bg-purple-900/40 transition"
            >
              Soy jugador
            </Link>
            <Link
                href="/dashboard/dm"
                className="flex-1 text-center border border-emerald-700/60 rounded-lg px-4 py-2 hover:bg-emerald-900/40 transition"
            >
              Soy DM
            </Link>
          </div>
        </div>
      </main>
  );
}
