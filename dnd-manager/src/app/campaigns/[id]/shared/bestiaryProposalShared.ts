export type BestiaryProposalCommand = {
    nonce: number;
    action: "apply" | "reject";
};

export type BestiaryProposalCommandResult = {
    nonce: number;
    action: "apply" | "reject";
    success: boolean;
    error?: string;
};

export type BestiaryPendingProposalPreview = {
    id: string;
    operation: "create" | "update";
    patch: Record<string, unknown>;
    targetEntryId?: string;
    targetName?: string;
    pendingCount: number;
    edited: boolean;
    reply?: string;
};

