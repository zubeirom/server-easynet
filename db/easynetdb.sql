-- CREATE TABLE person (
--     user_name VARCHAR(40) NOT NULL,
--     first_name VARCHAR(40) NOT NULL,
--     last_name VARCHAR(40),
--     biography VARCHAR(400),
--     age INT,
--     status VARCHAR(200),
--     PRIMARY KEY (user_name)
-- );

-- CREATE TABLE post (
--     post_id SERIAL PRIMARY KEY,
--     author VARCHAR(40),
--     message VARCHAR(500) NOT NULL,
--     likes INT,
--     created date NOT NULL,
--     FOREIGN KEY(author) REFERENCES person(user_name) ON DELETE CASCADE
-- )

-- CREATE TABLE comment (
--     comment_id SERIAL PRIMARY KEY,
--     message VARCHAR(200) NOT NULL,
--     created DATE NOT NULL,
--     author VARCHAR(40),
--     post_id int,
--     FOREIGN KEY(author) REFERENCES person(user_name) ON DELETE CASCADE,
--     FOREIGN KEY(post_id) REFERENCES post(post_id) ON DELETE CASCADE
-- )

-- CREATE TABLE friends (
--     user_name VARCHAR(40),
--     friend VARCHAR(40),
--     FOREIGN KEY(user_name) REFERENCES person(user_name) ON DELETE SET NULL,
--     FOREIGN KEY(friend) REFERENCES person(user_name) ON DELETE SET NULL
-- )

CREATE TABLE likes (
    post_id INT,
    user_name VARCHAR(40),
    FOREIGN KEY(post_id) REFERENCES post(post_id) ON DELETE CASCADE,
    FOREIGN KEY(user_name) REFERENCES person(user_name) ON DELETE CASCADE
)