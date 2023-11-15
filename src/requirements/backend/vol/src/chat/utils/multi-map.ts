export class MultiMap<K, V> {
    private map: Map<K, Set<V>>;

    constructor() {
        this.map = new Map<K, Set<V>>();
    }

    set(key: K, value: V) {
        if (this.map.has(key)) {
            this.map.get(key)!.add(value);
        } else {
            const set = new Set<V>();
            set.add(value);
            this.map.set(key, set);
        }
    }

    get(key: K): Set<V> | undefined {
        return this.map.get(key);
    }

    has(key: K): boolean {
        return this.map.has(key);
    }

    delete(key: K, value: V): boolean {
        const set = this.map.get(key);
        if (set) {
            set.delete(value);
            if (set.size === 0) {
                this.map.delete(key);
                return true;
            }
        }
        return false;
    }

    get size(): number {
        return this.map.size;
    }
}
