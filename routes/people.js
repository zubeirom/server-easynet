require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const fs = require('fs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const FB = require('fb');

const db = require('../db/index');

const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');

const router = express.Router();

const UserSerializer = new JSONAPISerializer('people', {
    attributes: ['first_name', 'last_name', 'biography', 'age', 'status', 'password', 'image'],
});

router.post('/people', asyncHandler(async (req, res, next) => {
    new JSONAPIDeserializer({ keyForAttribute: 'underscore_case' }).deserialize(req.body, async (err, user) => {
        try {
            const data = await db.query(`SELECT * FROM person WHERE user_name='${user.user_name}'`);
            if (data.rowCount === 0) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(user.password, salt);

                await db.query(`INSERT INTO person(user_name, first_name, last_name, password) VALUES('${user.user_name}', '${user.first_name}', '${user.last_name}', '${hash}')`);

                const obj = {
                    user_name: user.user_name,
                    first_name: user.first_name,
                    last_name: user.last_name,
                };

                const userJson = UserSerializer.serialize(obj);

                res.status(200).send(userJson);
                next();
            } else {
                res.status(400).send([{ errors: 'Account exists already' }]);
            }
        } catch (error) {
            next(error);
        }
    });
}));

module.exports = router;
