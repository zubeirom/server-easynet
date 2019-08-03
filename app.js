require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Bodyparser
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// cors
app.use(cors());

app.use('/', require('./routes/index'));
app.use('/', require('./routes/posts'));
app.use('/', require('./routes/people'));
app.use('/comments', require('./routes/comments'));
app.use('/likes', require('./routes/likes'));


const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
