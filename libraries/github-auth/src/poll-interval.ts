export class PollInterval {
  private intervalMs: number;

  constructor(initialIntervalSeconds: number) {
    this.intervalMs = initialIntervalSeconds * 1000;
  }

  get(): number {
    return this.intervalMs;
  }

  slowDown(seconds: number): void {
    this.intervalMs += seconds * 1000;
  }
}
