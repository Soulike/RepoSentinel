class ColorLogger {
  private readonly color: string;
  private static readonly reset = '\x1b[0m';

  private constructor(color: string) {
    this.color = color;
  }

  log(msg: string): void {
    console.log(`${this.color}${msg}${ColorLogger.reset}`);
  }

  error(msg: string): void {
    console.error(`${this.color}${msg}${ColorLogger.reset}`);
  }

  static readonly red = new ColorLogger('\x1b[31m');
  static readonly green = new ColorLogger('\x1b[32m');
  static readonly yellow = new ColorLogger('\x1b[33m');
  static readonly blue = new ColorLogger('\x1b[34m');
  static readonly gray = new ColorLogger('\x1b[90m');
}

export {ColorLogger};
