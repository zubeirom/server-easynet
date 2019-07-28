const fs = require('fs');
const jwt = require('jsonwebtoken');

const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');
const publicKEY = fs.readFileSync('./jwt/public.key', 'utf8');

module.exports = {
    sign(payload, options) {
        const signOptions = {
            issuer: options.issuer,
            subject: options.subject,
            audience: options.audience,
            expiresIn: '1h',
            algorithm: 'RS256',
        };
        return jwt.sign(payload, privateKEY, signOptions);
    },

    verify(token, option) {
        const verifyOptions = {
            issuer: option.issuer,
            subject: option.subject,
            audience: option.audience,
            expiresIn: '1h',
            algorithm: ['RS256'],
        };

        try {
            return jwt.verify(token, publicKEY, verifyOptions);
        } catch (error) {
            return false;
        }
    },

    decode(token) {
        return jwt.decode(token, { complete: true });
        // returns null if token is invalid
    },
};
