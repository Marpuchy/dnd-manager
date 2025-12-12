// src/app/campaigns/[id]/player/utils/inspectError.ts
export function inspectError(e: any) {
    try {
        if (!e) return "Error desconocido";
        if (typeof e === "string") return e;
        if (e.message) return e.message;
        const parts: any = {};
        for (const k of ["message", "details", "hint", "code"]) {
            if ((e as any)[k]) parts[k] = (e as any)[k];
        }
        const other = Object.getOwnPropertyNames(e || {}).reduce((acc: any, k: string) => {
            if (!["message", "details", "hint", "code"].includes(k)) acc[k] = (e as any)[k];
            return acc;
        }, {});
        return JSON.stringify({ parts, other }, null, 2);
    } catch (err) {
        return String(err);
    }
}
