/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
require('dotenv').config();
const express = require('express');
// const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
// const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
// const JSONAPISerializer = require('jsonapi-serializer').Serializer;
// const moment = require('moment');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');


const db = require('../db/index');

const router = express.Router();

// const getAccessToken = (req) => {
//     const header = req.get('Authorization');
//     const tokenarr = header.split(' ');
//     return tokenarr[1];
// };

router.post('/', asyncHandler(async (req, res, next) => {
    const { friend, accessToken } = req.body;
    const payload = await jwt.verify(accessToken, privateKEY);
    const { user_name } = payload;

    await db.query(`INSERT INTO friends(user_name, friend) VALUES('${user_name}', '${friend}')`);

    res.status(200).send([{ message: 'Successfully added' }]);
    next();
}));

module.exports = router;
