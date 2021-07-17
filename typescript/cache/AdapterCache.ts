export interface AdapterCache {
    put(region: string, key: string, value: any, ttl?: number): Promise<void>;

    get(region: string, key: string): Promise<string | undefined>;
}
