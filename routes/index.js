/* eslint-disable camelcase */
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
// const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const fs = require('fs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const FB = require('fb');

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
                    const token = await jwt.sign(payload, privateKEY);
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

        const { email, picture } = profile.data;

        // Check with db
        const query = await db.query(`SELECT * FROM person WHERE user_name='${email}'`);

        if (query.rowCount === 0) {
            // user not existing, now storing in db
            await db.query(`INSERT INTO person(user_name, image) VALUES('${email}', '${picture}')`);

            const payload = {
                user_name: email,
            };
            const access_token = await jwt.sign(payload, privateKEY);
            res.status(200).send({ access_token });
            next();
        } else {
            // user existing, getting user_name and make jwt
            const payload = {
                user_name: email,
            };
            const access_token = await jwt.sign(payload, privateKEY);
            res.status(200).send({ access_token });
            next();
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
}));

router.post('/auth-facebook', asyncHandler(async (req, res, next) => {
    const { code, redirectUri } = req.body;

    try {
        const getAccessToken = await FB.api('oauth/access_token', {
            client_id: '1329692483863203',
            client_secret: '73e571ce9e5613c07516d74da43acf3a',
            redirect_uri: redirectUri,
            code,
        });

        const authHeader = {
            headers: {
                Authorization: `Bearer ${getAccessToken.access_token}`,
            },
        };

        const profile = await axios.get('https://graph.facebook.com/v4.0/me?fields=email', authHeader);

        const { email } = profile.data;

        const query = await db.query(`SELECT * FROM person WHERE user_name='${email}'`);

        if (query.rowCount === 0) {
            // user not existing, now storing in db
            await db.query(`INSERT INTO person(user_name, image) VALUES('${email}', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png')`);

            const payload = {
                user_name: email,
            };
            const access_token = await jwt.sign(payload, privateKEY);
            res.status(200).send({ access_token });
            next();
        } else {
            // user existing, getting user_name and make jwt
            const payload = {
                user_name: email,
            };
            const access_token = await jwt.sign(payload, privateKEY);
            res.status(200).send({ access_token });
            next();
        }
    } catch (error) {
        console.log(error);
    }
}));

module.exports = router;
