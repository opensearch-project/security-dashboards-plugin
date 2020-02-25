export default class SessionExpiredError extends Error {

  constructor(message, public inner: Error) {
    super(message);
    this.name = this.constructor.name;
  }
}