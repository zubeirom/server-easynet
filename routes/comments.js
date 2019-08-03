/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
require('dotenv').config();
const express = require('express');
// const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
// const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const moment = require('moment');
// const fs = require('fs');

const db = require('../db/index');

// const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');

const router = express.Router();

const CommentSerializer = new JSONAPISerializer('comment', {
    attributes: ['author', 'message', 'created', 'post_id', 'timeAgo', 'comment_id'],
    id: 'comment_id',
    keyForAttribute: 'underscore_case',
});

router.post('/', asyncHandler(async (req, res, next) => {
    try {
        const {
            message, author, post_id,
        } = req.body;
        const postComment = await db.query(`INSERT INTO comment(message, author, post_id) VALUES('${message}', '${author}', ${post_id}) RETURNING *`);
        const getAuthor = await db.query(`SELECT * FROM person WHERE user_name='${author}'`);
        const comment = postComment.rows[0];
        const authorObj = getAuthor.rows[0];
        comment.author = authorObj;
        comment.timeAgo = moment(comment.created).fromNow();
        const commentJson = CommentSerializer.serialize(comment);
        res.status(200).send(commentJson);
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
