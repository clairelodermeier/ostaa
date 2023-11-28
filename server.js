/*
    Claire Lodermeier
    The purpose of this file is to set up a server for an online marketplace. It supports a number
    of get and post requests, interacting with database collections of items and users. 
    It defines mongoose schemas for users and items, and tracks cookies for authenticating logins.
*/

const parser = require('body-parser');
const cookieParser = require('cookie-parser');

const multer = require('multer')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const express = require('express');
const app = express();
const hostname = '146.190.133.130';
const port = 80;

app.use(express.static('public_html'));
app.use(express.json({ limit: '10mb' })); // Increase the limit to 10MB or your desired size

app.use(parser.json());
app.use(cookieParser());

// database setup
const mongoose = require('mongoose');
const { ConnectionClosedEvent } = require('mongodb');
const mongoDBURL = 'mongodb+srv://clairelodermeier:EI6kmSA22LEzO84H@cluster0.yzfbssm.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(mongoDBURL, { useNewUrlParser: true });
mongoose.connection.on('error', () => {
    console.log('MongoDB connection error');
});
var Schema = mongoose.Schema;

// create mongoose schema for users
var userSchema = new Schema({
    username: String,
    password: String,
    listings: [String],
    purchases: [String]
});

// create mongoose schema for items
var itemSchema = new Schema({
    title: String,
    desc: String,
    image: String,
    price: Number,
    stat: String
});

// create mongoose schema for images
const imgSchema = new Schema({
    fileName: {
        type: String,
        required: true,
    },
    file: {
        data: Buffer,
        contentType: String,
    }
});

// create models for users and items and imgs
var user = mongoose.model('user', userSchema);
var item = mongoose.model('item', itemSchema);
var img = mongoose.model('img', imgSchema);

// create a list of sessions
let sessions = {};
// regularly remove expired sessions.
setInterval(removeSessions, 2000);


function addSession(username) {
    /*
    The purpose of this function is to add a session for a user logged in.
    Param: username (String for the user's username)
    Return: sid (Number for session id)
    */
    let sid = Math.floor(Math.random() * 1000000000);
    let now = Date.now();
    sessions[username] = { id: sid, time: now };
    return sid;
}

function removeSessions() {
    /*
    The purpose of this function is to remove expired sessions from the sessions object. 
    */
    let now = Date.now();
    let usernames = Object.keys(sessions);
    for (let i = 0; i < usernames.length; i++) {
        let last = sessions[usernames[i]].time;
        // 10 minutes
        if (last + 60000 * 10 < now) {
            delete sessions[usernames[i]];
        }
    }
}

function authenticate(req, res, next) {
    /*
    The purpose of this function is to authenticate a user's credentials using cookies. 
    Param: req, res (request and response objects), next (next server request to follow)
    */

    let c = req.cookies;

    if (c != undefined) {
        // if there is an active login cookie for current user
        if (sessions[c.login.username] != undefined &&
            sessions[c.login.username].id == c.login.sessionID) {
            next();
        }
        else {
            // otherwise, redirect to login screen
            res.redirect('/index.html');
        }

    }
    else {
        res.redirect('/index.html');
    }


}

// authenticate for every request when logged in 
app.use('/get/*', authenticate);
app.use('/search/*', authenticate);
app.use('/add/*', authenticate);
app.use('/buy/*', authenticate);


// GET request for username to display 
app.get('/get/username/', (req, res) => {
    res.end(req.cookies.login.username);
});

// POST request, user login
app.post('/account/login/', async (req, res) => {
    let loginObj = req.body;
    var userDoc = await user.findOne({ "username": loginObj.u }).exec();
    if (userDoc != null) {
        // valid login
        if (userDoc["password"] === (loginObj.p)) {
            // create session/cookie for login
            let sid = addSession(loginObj.u);
            res.cookie('login',
                { username: loginObj.u, sessionID: sid },
                { maxAge: 60000 * 10 }
            );
            res.end('SUCCESS');
        }
        else {
            // password doesn't match
            res.end('Incorrect password.');
        }
    }
    else {
        // username is not in database
        res.end('User not found.');
    }
});


// GET request, creates a user
app.get('/account/create/:username/:password', (req, res) => {
    // check that username does not already exist
    let p = user.find({ username: req.params.username }).exec();
    p.then((results) => {
        if (results.length == 0) {
            // create user document
            let user1 = new user({
                username: req.params.username,
                password: req.params.password,
                listings: [],
                purchases: []
            });
            user1.save();
            return 'User created.';
        }
        else {
            return 'Username already taken.';
        }
    }).then((msg) => {
        res.end(msg);
    }).catch(() => {
        res.end('Unable to create new user.');
    })
});


// GET request, returns a JSON array of listings for a given user
app.get('/get/listings/', async (req, res) => {
    // find user document
    var userDoc = await user.findOne({ "username": req.cookies.login.username }).exec();

    // get listing ids for user
    const listings = userDoc.listings;

    // create an array of items that correspond to listing ids
    const userItems = [];
    for (let i = 0; i < listings.length; i++) {
        const listingItem = await item.findById(listings[i]).exec();
        userItems.push(listingItem);
    }
    res.end(JSON.stringify(userItems));


});

// GET request, returns a JSON array of purchases for a given user
app.get('/get/purchases/', async (req, res) => {
    // find user document
    var userDoc = await user.findOne({ "username": req.cookies.login.username }).exec();

    //get purchase ids for user
    const purchases = userDoc.purchases;

    // create an array of items that correspond to purchase ids
    const purchaseItems = [];
    for (let i = 0; i < purchases.length; i++) {
        // use await so that the array is build before the response is sent
        const purchaseItem = await item.findById(purchases[i]).exec();
        purchaseItems.push(purchaseItem);
    }

    res.end(JSON.stringify(purchaseItems));

});


// GET request, returns a JSON array of every item whose description contains a keyword
app.get('/search/items/:keyword/', (req, res) => {
    let p = item.find({ desc: { $regex: req.params.keyword } }).exec();
    p.then((items) => {
        res.end(JSON.stringify(items));
    });
});

// GET request, returns a JSON array of every item when no keyword is entered
app.get('/search/items', (req, res) => {
    let p = item.find({}).exec();
    p.then((items) => {
        res.end(JSON.stringify(items));
    });
});

// POST request, executes a user purchase
app.post('/buy/item/', async (req, res) => {

    // find user document
    var userDoc = await user.findOne({ "username": req.cookies.login.username }).exec();

    //get purchase ids for user
    const purchases = userDoc.purchases;

    // find item
    var itemId = req.body.itemId;
    var itemDoc = await item.findById(itemId).exec();

    // update status
    itemDoc.stat = 'SOLD';
    itemDoc.save();

    // add item to user purchases
    purchases.push(itemDoc._id);
    userDoc.save();

    res.end("SUCCESS");
});

// POST request, adds an item to the database
app.post('/add/item/', (req, res) => {
    let itemObj = req.body;
    let itemPrice = parseInt(itemObj.p);

    // find user
    var username = req.cookies.login.username;
    let p = user.findOne({ "username": username }).exec();
    p.then((itemUser) => {
        // create new item doc
        var newItem = new item({
            title: itemObj.t, desc: itemObj.d, image: itemObj.i,
            price: itemPrice, stat: itemObj.s
        });

        // update user's listings to include item id
        var userListings = itemUser.listings;
        userListings.push(newItem._id);
        itemUser.listings = userListings;

        newItem.save();
        itemUser.save();

        // end with json string for item object
        res.end("SUCCESS");
    }).catch(() => {
        res.end("FAILURE");
    });
});

// POST request for image upload
app.post('/upload', upload.single('photo'), async (req, res) => {

    if (req.file) {
        let imageUploadObject = {
            file: {
                data: req.file.buffer,
                contentType: req.file.mimetype
            },
            fileName: req.file.originalname,
        };
        const imgObj = new img(imageUploadObject);
        // saving the object into the database
        imgObj.save();
        res.end(JSON.stringify(imgObj._id));

    }
    else { console.log('upload error') };
});

//GET request for rendering image
app.get('/image/:id', async (req, res) => {
    const imageId = req.params.id;

    // find the image by its ID
    const imgDoc = await img.findById(imageId).exec();

    // set content type 
    res.set('Content-Type', imgDoc.contentType);

    // send image data buffer 
    res.send(imgDoc.file.data);

});



app.listen(port, () => {
    console.log(`Ostaa server listening at 146.190.133.130:80`);
});

