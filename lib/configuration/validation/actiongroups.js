import Joi from 'joi'

export default Joi.object().keys({
    description: Joi.string().allow(''),
    allowed_actions: Joi.array().items(Joi.string())
});