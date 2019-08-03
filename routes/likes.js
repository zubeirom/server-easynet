/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
require('dotenv').config();
const express = require('express');
// const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
// const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
// const JSONAPISerializer = require('jsonapi-serializer').Serializer;
// const moment = require('moment');
// const fs = require('fs');

const db = require('../db/index');

const router = express.Router();


// const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');

router.post('/', asyncHandler(async (req, res, next) => {
    const { user_name, post_id } = req.body;

    const query = await db.query(`INSERT INTO likes(user_name, post_id) values('${user_name}', ${post_id}) RETURNING *`);

    const like = query.rows[0];
    res.status(200).send(like);
    next();
}));

router.delete('/', asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.body;
        await db.query(`DELETE FROM likes WHERE id=${id}`);
        res.status(200).send([{ message: 'Successfully deleted row' }]);
        next();
    } catch (error) {
        next(error);
    }
}));

module.exports = router;
