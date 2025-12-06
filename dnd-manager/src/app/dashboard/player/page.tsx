// src/app/dashboard/player/page.tsx
export default function PlayerDashboardPage() {
    return (
        <main className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
            <div className="max-w-xl w-full border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 shadow-lg shadow-purple-900/40">
                <h1 className="text-3xl font-bold mb-2 text-purple-300">
                    Panel del Jugador
                </h1>
                <p className="text-zinc-400 mb-4">
                    Aquí irá la gestión del personaje: estadísticas, inventario, hechizos,
                    notas de rol y más.
                </p>
                <p className="text-sm text-zinc-500">
                    De momento es solo una página de prueba para comprobar que el
                    enrutado y el deploy funcionan correctamente.
                </p>
            </div>
        </main>
    );
}
