export class BidirectionalMap<K, V> {
  private map: Map<K, Map<K, V>>;

  constructor() {
    this.map = new Map<K, Map<K, V>>();
  }

  set(key1: K, key2: K, value: V) {
    this.addToMap_(key1, key2, value);
    this.addToMap_(key2, key1, value);
  }

  private addToMap_(outerKey: K, innerKey: K, value: V) {
    let innerMap = this.map.get(outerKey);

    if (!innerMap) {
      innerMap = new Map<K, V>();
      this.map.set(outerKey, innerMap);
    }
    innerMap.set(innerKey, value);
  }

  get(key1: K, key2: K): V | undefined {
    const innerMap = this.map.get(key1);

    if (innerMap)
      return innerMap.get(key2);
    return undefined;
  }

  getInnerKeys(key1: K): V[] {
    const innerMap = this.map.get(key1);
        
    if (innerMap)
      return Array.from(innerMap.values());
    return [];
  } 

  has(key1: K, key2: K): boolean {
    const innerMap = this.map.get(key1);
    return !!innerMap && innerMap.has(key2);
  }

  delete(key1: K, key2: K): boolean {
    const innerMap = this.map.get(key1);
    if (innerMap) {
      innerMap.delete(key2);
      if (innerMap.size === 0) {
        this.map.delete(key1);
        return true;
      }
    }
    return false;
  }

  get size(): number {
      return this.map.size;
  }
}
