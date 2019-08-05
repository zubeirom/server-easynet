/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
require('dotenv').config();
const express = require('express');
// const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
// const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const moment = require('moment');
const fs = require('fs');
const jwt = require('jsonwebtoken');
// const axios = require('axios');
// const FB = require('fb');

const db = require('../db/index');

const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');

const router = express.Router();

const PostSerializer = new JSONAPISerializer('posts', {
    attributes: ['message', 'created', 'person', 'likes', 'comments', 'timeAgo'],
    id: 'post_id',
    keyForAttribute: 'underscore_case',
});

router.get('/posts', asyncHandler(async (req, res, next) => {
    try {
        const { access_token } = req.query;
        const payload = await jwt.verify(access_token, privateKEY);
        const { user_name } = payload;

        const query = await db.query(`SELECT * FROM post WHERE author='${user_name}'`);
        const query2 = await db.query(`SELECT age, biography, first_name, last_name, id, image, status, user_name FROM person WHERE user_name='${user_name}'`);
        const posts = query.rows;
        const author = query2.rows[0];
        if (query.rowCount === 0) {
            const postsJson = PostSerializer.serialize(posts);
            res.status(200).send(postsJson);
            next();
        }
        let itemsProcessed = 0;
        posts.forEach(async (post) => {
            const likesQuery = await db.query(`SELECT * FROM likes WHERE post_id=${post.post_id}`);
            const commentsQuery = await db.query(`SELECT * FROM comment WHERE post_id=${post.post_id}`);
            const commentNum = commentsQuery.rows;
            const likesNum = likesQuery.rows;
            post.comments = commentNum;
            post.likes = likesNum;
            post.person = author;
            post.timeAgo = moment(post.created).fromNow();
            /* eslint-disable no-plusplus  */
            itemsProcessed++;
            if (itemsProcessed === posts.length) {
                const postsJson = PostSerializer.serialize(posts);
                res.status(200).send(postsJson);
                next();
            }
        });
    } catch (error) {
        console.log(error);
    }
}));

router.get('/all-posts', asyncHandler(async (req, res, next) => {
    try {
        const query = await db.query('SELECT * FROM post ORDER BY created DESC');
        const posts = query.rows;
        if (query.rowCount === 0) {
            const postsJson = PostSerializer.serialize(posts);
            res.status(200).send(postsJson);
            next();
        }
        let itemsProcessed = 0;
        posts.forEach(async (post) => {
            const likesQuery = await db.query(`SELECT * FROM likes WHERE post_id=${post.post_id}`);
            const commentsQuery = await db.query(`SELECT * FROM comment WHERE post_id=${post.post_id} ORDER BY created DESC`);
            const authorQuery = await db.query(`SELECT * FROM person WHERE user_name='${post.author}'`);
            const commentNum = commentsQuery.rows;
            const likesNum = likesQuery.rows;
            const author = authorQuery.rows[0];
            post.comments = commentNum;
            const { comments } = post;
            comments.forEach(async (comment) => {
                comment.timeAgo = moment(comment.created).fromNow();
                const commentAuthor = await db.query(`SELECT * FROM person WHERE user_name='${comment.author}'`);
                const auth = commentAuthor.rows[0];
                comment.author = auth;
            });
            post.likes = likesNum;
            post.person = author;
            post.timeAgo = moment(post.created).fromNow();
            /* eslint-disable no-plusplus  */
            itemsProcessed++;
            if (itemsProcessed === posts.length) {
                setTimeout(() => {
                    const postsJson = PostSerializer.serialize(posts);
                    res.status(200).send(postsJson);
                    next();
                }, 500);
            }
        });
    } catch (error) {
        next(error);
    }
}));

router.post('/posts', asyncHandler(async (req, res, next) => {
    const { message, author } = req.body;
    await db.query(`INSERT INTO post(message, author) VALUES('${message}', '${author}') RETURNING * `);
    res.status(200).send([{ message: 'Successfully added post' }]);
    next();
}));

module.exports = router;
