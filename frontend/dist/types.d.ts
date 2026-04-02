export interface Species {
    id?: string | number;
    name: string;
    scientificName?: string;
    description?: string;
    orderName?: string;
    family?: string;
    genus?: string;
    thumbnailUrl?: string;
    tags?: Tag[];
    extraAttributes?: Record<string, string>;
}
export interface Tag {
    tagId?: string | number;
    id?: string | number;
    tagName?: string;
    name?: string;
    category?: string;
}
export interface User {
    userId?: string | number;
    username: string;
    email: string;
    userType?: string;
    utype?: string;
    uType?: string;
}
export interface Team {
    id: string | number;
    name: string;
    projectName: string;
    semester: string;
}
export interface ApiKey {
    id: string | number;
    teamName: string;
    keyVal: string;
    active: boolean;
    status?: string;
    expiration?: string;
}
//# sourceMappingURL=types.d.ts.map