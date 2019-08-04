/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const fs = require('fs');
const jwt = require('jsonwebtoken');
// const axios = require('axios');
// const FB = require('fb');

const db = require('../db/index');

const privateKEY = fs.readFileSync('./jwt/private.key', 'utf8');

const router = express.Router();

const UserSerializer = new JSONAPISerializer('people', {
    attributes: ['user_name', 'first_name', 'last_name', 'biography', 'age', 'status', 'image', 'posts', 'friends'],
    keyForAttribute: 'underscore_case',
});

const FriendSerializer = new JSONAPISerializer('friends', {
    attributes: ['user_name', 'friend'],
    keyForAttribute: 'underscore_case',
});

const getAccessToken = (req) => {
    const header = req.get('Authorization');
    const tokenarr = header.split(' ');
    return tokenarr[1];
};

router.get('/people', asyncHandler(async (req, res, next) => {
    try {
        const accessToken = getAccessToken(req);
        const payload = await jwt.verify(accessToken, privateKEY);
        const { user_name } = payload;

        const queryPerson = await db.query(`SELECT age, biography, first_name, last_name, id, image, status, user_name FROM person WHERE user_name='${user_name}'`);
        const person = queryPerson.rows[0];

        const userJson = UserSerializer.serialize(person);
        res.status(200).send(userJson);
        next();
    } catch (error) {
        console.log(error);
        next(error);
    }
}));

router.get('/people/:id', asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const queryPerson = await db.query(`SELECT age, biography, first_name, last_name, id, image, status, user_name FROM person WHERE id=${id}`);
        const person = queryPerson.rows[0];
        const queryFriends = await db.query(`SELECT * FROM friends WHERE user_name='${person.user_name}'`);
        const friends = queryFriends.rows;
        friends.forEach(async (friend) => {
            const query = await db.query(`SELECT age, biography, first_name, last_name, id, image, status, user_name FROM person WHERE user_name='${friend.user_name}'`);
            const p = query.rows[0];
            friend.person = p;
        });
        person.friends = friends;
        const queryPosts = await db.query(`SELECT * FROM post WHERE author='${person.user_name}' ORDER BY created DESC`);
        const postMap = queryPosts.rows;
        person.posts = postMap;
        const { posts } = person;
        let itemsProcessed = 0;
        posts.forEach(async (post) => {
            const queryComments = await db.query(`SELECT * FROM comment WHERE post_id=${post.post_id}`);
            const comments = queryComments.rowCount;
            await db.query(`SELECT * FROM likes WHERE post_id=${post.post_id} `)
                .then((queryLikes) => {
                    const likes = queryLikes.rowCount;
                    post.commentLength = comments;
                    post.likesLength = likes;
                    /* eslint-disable no-plusplus  */
                    itemsProcessed++;
                    if (itemsProcessed === posts.length) {
                        const userJson = UserSerializer.serialize(person);
                        res.status(200).send(userJson);
                        next();
                    }
                });
        });
    } catch (error) {
        next(error);
    }
}));

router.get('/people-by-user', asyncHandler(async (req, res, next) => {
    try {
        const { user_name } = req.query;
        const queryFriends = await db.query(`SELECT * FROM friends WHERE user_name='${user_name}'`);
        const friends = queryFriends.rows;
        if (queryFriends.rowCount === 0) {
            const friendsJson = FriendSerializer.serialize(friends);
            res.status(200).send(friendsJson);
            next();
        }
        let itemsProcessed = 0;
        friends.forEach(async (user) => {
            const queryUser = await db.query(`SELECT age, biography, first_name, last_name, id, image, status, user_name FROM person WHERE user_name='${user.friend}'`);
            const friend = queryUser.rows[0];
            user.friend = friend;
            /* eslint-disable no-plusplus  */
            itemsProcessed++;
            if (itemsProcessed === friends.length) {
                const friendsJson = FriendSerializer.serialize(friends);
                res.status(200).send(friendsJson);
                next();
            }
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}));

router.patch('/people/:id', asyncHandler(async (req, res, next) => {
    new JSONAPIDeserializer({
        keyForAttribute: 'underscore_case',
    }).deserialize(req.body, async (err, user) => {
        try {
            await db.query(`UPDATE person SET first_name='${user.first_name}', last_name='${user.last_name}', biography='${user.biography}', age=${user.age}, status='${user.status}', image='${user.image}' WHERE user_name='${user.user_name}'`);

            const userJson = UserSerializer.serialize(user);
            res.status(200).send(userJson);
            next();
        } catch (error) {
            next(error);
        }
    });
}));

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
