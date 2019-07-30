/* eslint-disable camelcase */
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const fs = require('fs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const google = require('googleapis');


const db = require('../db/index');

const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');

const router = express.Router();

router.post('/token', asyncHandler(async (req, res, next) => {
    const { grant_type, password, username } = req.body;
    if (grant_type === 'password') {
        try {
            const data = await db.query(`SELECT * FROM person WHERE user_name='${username}'`);
            if (data.rowCount === 1) {
                const person = data.rows[0];
                if (bcrypt.compareSync(password, person.password)) {
                    const payload = {
                        user_name: username,
                    };
                    const token = await jwt.sign(payload, privateKEY, { expiresIn: '2h' });
                    res.status(200).send(`{ "access_token": "${token}" }`);
                    next();
                } else {
                    res.status(400).send('{"error": "invalid_grant"}');
                    next();
                }
            } else {
                res.status(400).send('{"error": "invalid_grant"}');
                next();
            }
        } catch (error) {
            next(error);
        }
    } else {
        res.status(400).send('{ "error": "unsupported_grant_type" }');
        next();
    }
}));

router.post('/auth-google', asyncHandler(async (req, res, next) => {
    const { code, redirect_uri } = req.body;

    const getTokenHeader = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
        },
    };


    const body = {
        code,
        redirect_uri,
        client_id: '988101118104-q1jd4s2frs0vbshbh92qjpm6vgbfrl6r.apps.googleusercontent.com',
        client_secret: 'PUi6CFpg0SPjd7VkLUQatfNj',
        scope: '',
        grant_type: 'authorization_code',
    };

    try {
        // get google access token
        const getAccessToken = await axios.post(`https://oauth2.googleapis.com/token?code=${code}&client_id=${body.client_id}&client_secret=${body.client_secret}&redirect_uri=${body.redirect_uri}&grant_type=${body.grant_type}`, body, getTokenHeader);

        const { data } = getAccessToken;

        const authHeader = {
            headers: {
                Authorization: `Bearer ${data.access_token}`,
            },
        };

        const profile = await axios.get('https://www.googleapis.com/userinfo/v2/me', authHeader);

        const { email } = profile.data;

        // res.status(200).send(getAccessToken.data);
        // next();
    } catch (error) {
        console.log(error);
        next(error);
    }
}));


router.post('/people', asyncHandler(async (req, res, next) => {
    new JSONAPIDeserializer({ keyForAttribute: 'underscore_case' }).deserialize(req.body, async (err, user) => {
        try {
            const data = await db.query(`SELECT * FROM person WHERE user_name='${user.user_name}'`);
            if (data.rowCount === 0) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(user.password, salt);

                await db.query(`INSERT INTO person(user_name, first_name, last_name, password) VALUES('${user.user_name}', '${user.first_name}', '${user.last_name}', '${hash}')`);

                res.status(200).send([{ data: 'Succesfully stored user' }]);
                next();
            } else {
                res.status(400).send({ message: 'Account exists already' });
            }
        } catch (error) {
            next(error);
        }
    });
}));

module.exports = router;
