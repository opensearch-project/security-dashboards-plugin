export default class MissingTenantError extends Error {

  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }

}