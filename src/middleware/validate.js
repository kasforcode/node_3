export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ details: error.details.map(({ message, path, type }) => ({ message, path, type })) });
    req.body = value;
    next();
  };
}
