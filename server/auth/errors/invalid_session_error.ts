export default class InvalidSessionError extends Error {
  constructor(message: string, public inner: Error) { // TODO: should inner be public?
    super(message);
    this.name = this.constructor.name;
  }
}