// src/app/dashboard/dm/page.tsx
export default function DMDashboardPage() {
    return (
        <main className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
            <div className="max-w-xl w-full border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 shadow-lg shadow-emerald-900/40">
                <h1 className="text-3xl font-bold mb-2 text-emerald-300">
                    Panel del Dungeon Master
                </h1>
                <p className="text-zinc-400 mb-4">
                    Aquí podrás gestionar el bestiario privado y público, tiendas, objetos,
                    inventarios de jugadores, notas de sesión y más.
                </p>
                <p className="text-sm text-zinc-500">
                    De momento es una página placeholder para validar la estructura de la
                    app antes de añadir login y base de datos.
                </p>
            </div>
        </main>
    );
}
