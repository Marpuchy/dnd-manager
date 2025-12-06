"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === "register") {
                // Registro
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                const user = data.user;
                if (user) {
                    // Aquí podríamos crear profile, de momento solo log
                    console.log("Usuario registrado:", user.id);
                }
            } else {
                // Login
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }

            // De momento, siempre redirigimos al dashboard de jugador
            router.push("/campaigns");
        } catch (err) {
            console.error("Error en login/registro:", err);
            const message =
                err instanceof Error ? err.message : "Algo ha salido mal";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
            <div className="w-full max-w-md border border-zinc-800 bg-zinc-950/80 rounded-xl p-6 shadow-lg shadow-purple-900/40">
                <h1 className="text-2xl font-bold mb-2 text-purple-300">
                    {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </h1>
                <p className="text-sm text-zinc-500 mb-4">
                    {mode === "login"
                        ? "Entra con tu correo para gestionar tu personaje."
                        : "Regístrate para usar el gestor de campaña de D&D."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-sm text-zinc-300">Correo</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-zinc-300">Contraseña</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 rounded-md bg-purple-700 hover:bg-purple-600 disabled:opacity-60 py-2 text-sm font-medium"
                    >
                        {loading
                            ? "Procesando..."
                            : mode === "login"
                                ? "Entrar"
                                : "Registrarme"}
                    </button>
                </form>

                <button
                    className="mt-4 text-xs text-zinc-400 hover:text-purple-300"
                    onClick={() =>
                        setMode(mode === "login" ? "register" : "login")
                    }
                >
                    {mode === "login"
                        ? "¿No tienes cuenta? Crear una nueva"
                        : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
            </div>
        </main>
    );
}
