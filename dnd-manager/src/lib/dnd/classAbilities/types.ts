export type ClassAbility = {
    id: string;
    name: string;
    class: string;
    level: number;

    activation?: string;
    range?: string;
    duration?: string;
    components?: string[];
    uses?: string;
    description?: string;

    subclassId?: string;
    subclassName?: string;
    source?: string;
};

export type ClassSubclass = {
    id: string;
    name: string;
    classId: string;
    unlockLevel: number;
    source?: string;
    features: ClassAbility[];
};

export type ClassProgression = {
    classId: string;
    className: string;
    source?: string;
    subclassUnlockLevel?: number;
    classFeatures: ClassAbility[];
    subclasses: ClassSubclass[];
};
