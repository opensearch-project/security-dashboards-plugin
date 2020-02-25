export default class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
