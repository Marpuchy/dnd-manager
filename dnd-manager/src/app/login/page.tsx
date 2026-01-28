"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";
type ViewMode = "DM" | "PLAYER";

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("login");
    const [viewMode, setViewMode] = useState<ViewMode>("PLAYER");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem("dnd:viewMode");
        if (stored === "DM" || stored === "PLAYER") {
            setViewMode(stored);
        }
    }, []);

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

            if (typeof window !== "undefined") {
                window.localStorage.setItem("dnd:viewMode", viewMode);
            }

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
        <main className="min-h-screen flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md border border-ring bg-panel/90 rounded-2xl p-6 shadow-[var(--shadow-soft)]">
                <h1 className="font-display text-2xl mb-2 text-ink">
                    {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </h1>
                <p className="text-sm text-ink-muted mb-4">
                    {mode === "login"
                        ? "Entra con tu correo para gestionar tu personaje."
                        : "Regístrate para usar el gestor de campaña de D&D."}
                </p>

                <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mb-2">
                        Vista preferida
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {(["PLAYER", "DM"] as ViewMode[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setViewMode(value)}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    viewMode === value
                                        ? "border-accent bg-accent text-white"
                                        : "border-ring bg-white/70 text-ink hover:border-accent"
                                }`}
                            >
                                {value === "PLAYER" ? "Jugador" : "Dungeon Master"}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-sm text-ink-muted">Correo</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-ink-muted">Contraseña</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-ember bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 rounded-md bg-accent hover:bg-accent-strong disabled:opacity-60 py-2 text-sm font-medium text-white"
                    >
                        {loading
                            ? "Procesando..."
                            : mode === "login"
                                ? "Entrar"
                                : "Registrarme"}
                    </button>
                </form>

                <button
                    className="mt-4 text-xs text-ink-muted hover:text-accent-strong"
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
