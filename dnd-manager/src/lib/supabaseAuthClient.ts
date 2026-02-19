import type { SupabaseClient, User } from "@supabase/supabase-js";

const INVALID_REFRESH_TOKEN_FRAGMENTS = [
    "invalid refresh token",
    "refresh token not found",
    "refresh_token_not_found",
];

export function isInvalidRefreshTokenError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;

    const authError = error as {
        message?: unknown;
        code?: unknown;
        name?: unknown;
    };
    const message =
        typeof authError.message === "string"
            ? authError.message.toLowerCase()
            : "";
    const code =
        typeof authError.code === "string" ? authError.code.toLowerCase() : "";
    const name =
        typeof authError.name === "string" ? authError.name.toLowerCase() : "";
    const haystack = `${name} ${code} ${message}`;

    return INVALID_REFRESH_TOKEN_FRAGMENTS.some((fragment) =>
        haystack.includes(fragment)
    );
}

export async function getSessionUserSafely(
    client: SupabaseClient
): Promise<User | null> {
    const {
        data: { session },
        error,
    } = await client.auth.getSession();

    if (!error) {
        return session?.user ?? null;
    }

    if (isInvalidRefreshTokenError(error)) {
        await client.auth.signOut({ scope: "local" });
        return null;
    }

    throw error;
}
