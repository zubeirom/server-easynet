-- CREATE TABLE person (
--     user_name VARCHAR(40) NOT NULL,
--     first_name VARCHAR(40) NOT NULL,
--     last_name VARCHAR(40),
--     biography VARCHAR(400),
--     age INT,
--     status VARCHAR(200),
--     PRIMARY KEY (user_name)
-- );

-- create table post (
--     post_id serial PRIMARY KEY,
--     author VARCHAR(40),
--     message VARCHAR(500) not NULL,
--     likes INT,
--     created date not NULL,
--     FOREIGN KEY(author) REFERENCES person(user_name)
-- )

CREATE TABLE comment (
    comment_id SERIAL PRIMARY KEY,
    message VARCHAR(200) NOT NULL,
    created DATE NOT NULL,
    author VARCHAR(40),
    post_id int,
    FOREIGN KEY(author) REFERENCES person(user_name),
    FOREIGN KEY(post_id) REFERENCES post(post_id)
)