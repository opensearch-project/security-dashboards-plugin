import Joi from 'joi'

export default Joi.object().keys({
    description: Joi.string().allow(''),
    password: Joi.string().allow(''),
    backend_roles: Joi.array().items(Joi.string()),
    attributes: Joi.object()
});
