const trimData = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => trimData(item));
    }

    return Object.keys(obj).reduce((acc, key) => {
        let value = obj[key];
        if (typeof value === 'string') {
            acc[key] = value.trim();
        } else if (typeof value === 'object' && value !== null) {
            acc[key] = trimData(value);
        } else {
            acc[key] = value;
        }
        return acc;
    }, {});
};

const trimMiddleware = (req, res, next) => {
    if (req.body) {
        req.body = trimData(req.body);
    }
    if (req.query) {
        req.query = trimData(req.query);
    }
    if (req.params) {
        req.params = trimData(req.params);
    }
    next();
};

module.exports = trimMiddleware;
