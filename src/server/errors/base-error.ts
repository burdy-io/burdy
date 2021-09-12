export default class BaseError extends Error {
  protected status = 400;
  protected readonly errorMessage: string;
  protected readonly data: object;

  constructor(errorMessage: string, data: object = {}) {
    super();
    this.errorMessage = errorMessage;
    this.data = data;
  }

  public getStatusCode() {
    return this.status;
  }

  public toJson() {
    return {
      message: this.errorMessage,
      ...(this.data ?? {}),
    };
  }
}
