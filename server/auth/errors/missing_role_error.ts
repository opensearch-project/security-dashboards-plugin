export default class MissingRoleError extends Error {

  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }

}