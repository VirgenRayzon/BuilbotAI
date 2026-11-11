export interface VersionedServerCacheOptions {
  maxCheckStalenessMs?: number;
}

export class VersionedServerCache<T> {
  private cachedValue: T | null = null;
  private cachedVersion: number | null = null;
  private lastCheckTime = 0;
  private readonly maxCheckStalenessMs: number;
  private inFlight: Promise<T> | null = null;

  constructor(options?: VersionedServerCacheOptions) {
    this.maxCheckStalenessMs = options?.maxCheckStalenessMs ?? 3000;
  }

  public async getOrLoad(
    loader: () => Promise<T>,
    readVersion: () => Promise<number>
  ): Promise<T> {
    if (this.inFlight) {
      return this.inFlight;
    }

    const now = Date.now();
    const needsVersionCheck =
      this.cachedValue === null ||
      this.cachedVersion === null ||
      now - this.lastCheckTime >= this.maxCheckStalenessMs;

    if (!needsVersionCheck && this.cachedValue !== null) {
      return this.cachedValue;
    }

    this.inFlight = this.executeVersionCheckAndLoad(loader, readVersion).finally(() => {
      this.inFlight = null;
    });

    return this.inFlight;
  }

  private async executeVersionCheckAndLoad(
    loader: () => Promise<T>,
    readVersion: () => Promise<number>
  ): Promise<T> {
    const remoteVersion = await readVersion();
    this.lastCheckTime = Date.now();

    if (
      this.cachedValue !== null &&
      this.cachedVersion !== null &&
      this.cachedVersion === remoteVersion
    ) {
      return this.cachedValue;
    }

    const fresh = await loader();
    this.cachedValue = fresh;
    this.cachedVersion = remoteVersion;
    return fresh;
  }

  public invalidateLocal(): void {
    this.cachedValue = null;
    this.cachedVersion = null;
    this.lastCheckTime = 0;
    this.inFlight = null;
  }

  public getCachedVersion(): number | null {
    return this.cachedVersion;
  }
}
