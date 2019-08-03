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

// const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');

const router = express.Router();

router.post('/', asyncHandler(async (req, res, next) => {
    try {
        const {
            message, author, post_id,
        } = req.body;

        await db.query(`INSERT INTO comment(message, author, post_id) VALUES('${message}', '${author}', ${post_id})`);
        res.status(200).send([{ message: 'Succesfully saved comment' }]);
        next();
    } catch (error) {
        next(error);
    }
}));

router.delete('/', asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.body;
        await db.query(`DELETE FROM comment WHERE comment_id=${id}`);
        res.status(200).send([{ message: 'Successfully deleted comment' }]);
        next();
    } catch (error) {
        next(error);
    }
}));

module.exports = router;
