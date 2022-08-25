const alert = require('alert')
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const session = require('express-session');
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser");
var fs = require('fs');

const app = express();


const userSchema = require("../database/user-database");
const songSchema = require("../database/song-database");
const { db } = require('../database/user-database');




app.use(express.urlencoded({ extended: false }))

const jwtSecret = 'f233c1005819aff100d288ae7f8575629505cada7b0107abb492999180a0e22a787a72'

app.use(cookieParser());










router.get('/', async(req, res) => {
    //console.log('Request for home recieved');
    const data = await songSchema.find({}).limit(10).lean()

    res.render('home', { data })
})

router.get('/login', (req, res) => {
    //console.log("Request for login received ");
    res.render('login');
})
router.get('/register', (req, res) => {
    //console.log("Request for register received");
    res.render('register');
})
router.get('/contact', (req, res) => {
    //console.log("Request for contact received")
    res.render('contact')
})
router.get('/about', (req, res) => {
    //console.log("Request for about received");
    res.render('about')
})

router.get('/songs', async(req, res) => {
    if (!req.headers.cookie) { res.redirect('/404') } else {
        //console.log('Request for songs recieved');
        const data1 = await songSchema.find({}).lean()
        res.render('songs', { data1 })
    }
})

router.get('/view-basket', async(req, res) => {
    if (!req.headers.cookie) { res.redirect('/404') } else {
        let cookie1 = req.headers.cookie.split('=');
        let cookie2 = cookie1[0]
            //console.log(cookie1)

        try {

            let data1 = await db.collection('baskets').find({ email: cookie2 }).toArray()
                //data1.forEach(console.dir)
            let data = []
            data1.forEach(item => {
                data.push(item.song)
            })
            res.render('view-basket', { data })
        } catch {

        }
    }
})

router.get('/remove-from-basket', (req, res) => {
    //console.log("remove from basket done")
})

router.get('/checkout', (req, res) => {
    if (!req.headers.cookie) { res.redirect('/404') } else {
        res.render('checkout')
    }
})

router.get('/account', async(req, res) => {
    if (!req.headers.cookie) {
        res.redirect('/404')
    } else {
        let cookie1 = req.headers.cookie.split('=');
        let cookie2 = cookie1[0]
        let user = await userSchema.findOne({ email: cookie2 })
            //console.log(user)
        res.render('account', {
            user: user.firstname + " " + user.lastname,
            date: user.createdAt.toDateString()
        })
    }

})





router.post('/register', (req, res) => {

    if (req.body.password1 !== req.body.password2) {
        alert("Passwords does not match,please try again.");
        res.redirect('/register');
    } else {
        userSchema.findOne({ email: req.body.email }, (error, result) => {
            if (result) {
                alert("Email already used.Please try again.");
                res.redirect('/register');
            } else {
                insertUser();
                res.redirect('/login');
                sendMail();

            }
        })
        async function insertUser() {
            const passwordHash = await bcrypt.hash(req.body.password1, 10);
            const document = { firstname: req.body.firstname, lastname: req.body.lastname, email: req.body.email, password: passwordHash }
            await new userSchema(document).save();
            console.log("user saved");

            alert("Succesfull registered");
        }

        function sendMail() {
            let email = req.body.email;
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                secure: false,
                auth: {
                    user: 'favoritesong1999@gmail.com',
                    pass: 'vkdntcnmmjherfdv'
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            var mailOptions = {
                from: 'favoritesong1999@gmail.com',
                to: email,
                subject: 'Registered to Favorite Song',
                text: ("Hello, " + req.body.firstname + "\nYou are registered on Favorite Song\nYou can buy music now\nYour password is: " + req.body.password1)
            };
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });



        }
    }

})

router.post('/login', async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userSchema.findOne({ email })
        if (!user) {
            res.redirect('/login', alert("Username not found"))

        } else {

            await bcrypt.compare(password, user.password).then(function(result) {

                const maxAge = 3 * 60 * 60;
                const token = jwt.sign({ id: user._id },
                    jwtSecret, {
                        expiresIn: maxAge, // 3hrs in sec
                    }
                );
                res.cookie(user.email, token, {
                    httpOnly: true,
                    maxAge: maxAge * 1000, // 3hrs in ms
                });

                result ? res.redirect("songs")

                : res.render('login', alert('Wrong password'))
            })

        }
    } catch (error) {
        console.log("Error!")
    }
})

//let arr = []
router.post('/basket', async(req, res) => {
    let cookie1 = req.headers.cookie.split('=');
    let cookie2 = cookie1[0]

    let document = { index: req.body.index, artist: req.body.artist, title: req.body.title }
    let basket = await db.collection('baskets').findOne({ email: cookie2, "song.index": req.body.index })
        //console.log(basket)
    if (!basket) {

        await db.collection('baskets').insertOne({ email: cookie2, song: document })
    } else { alert('Song already in your basket') }

    res.redirect('songs')

})

router.post('/remove-from-basket', async(req, res) => {
    let cookie1 = req.headers.cookie.split('=');
    let cookie2 = cookie1[0]


    await db.collection('baskets').findOneAndDelete({ email: cookie2, "song.index": req.body.index[1] })
    res.redirect('/view-basket')

})

router.post('/checkout', async(req, res) => {
    let cookie1 = req.headers.cookie.split('=');
    let cookie2 = cookie1[0]
    let file = await db.collection('baskets').find({ email: cookie2 }).toArray()
    let file1 = []
    file.forEach(item => {
        file1.push(item.song)
    })
    let check = await db.collection('orders').find({}).toArray()
    let check1 = [];
    check.forEach(item => {
            check1.push(parseInt(item.OrderNumber))
        })
        //console.log(check1)
        //console.log(typeof(check1[0]))
    let max = Math.max.apply(Math, check1)
        //console.log(max)
    let orderNumber = 0
    if (max >= 10000) { orderNumber = max + 1 } else { orderNumber = 10000 }
    db.collection("orders").insertOne({ email: cookie2, OrderNumber: orderNumber, songs: [file1], OrderDate: new Date() });
    fs.writeFileSync('ListOfSongs.txt', "Thank you for your purchase\nHere its the list of your songs:\n\n\n\n" + JSON.stringify(file1, null, 4));
    db.collection('baskets').deleteMany({ email: cookie2 });

    res.download('ListOfSongs.txt')
})



router.get('/logout', (req, res) => {


    if (!req.headers.cookie) {
        res.redirect('/404')
    }
    let cookie1 = req.headers.cookie.split('=');
    let cookie2 = cookie1[0]
    res.clearCookie(cookie2,
        alert("You have been logged off")
    )
    return res.redirect('/')
})


router.get('/404', (req, res) => {
    res.render('404')
})


router.post('/account', async(req, res) => {
        let cookie1 = req.headers.cookie.split('=');
        let cookie2 = cookie1[0]
        let user = await userSchema.findOne({ email: cookie2 })
        await bcrypt.compare(req.body.oldPassword, user.password).then(function(result) {
            if (!result || req.body.newPassword1 !== req.body.newPassword2) { res.redirect('/account'), alert('Wrong old password or new passwords mismatch') } else {
                console.log(req.body.newPassword1)
                update(cookie2, req.body.newPassword1)
                res.redirect('/songs')
                sendMailupdate(cookie2, user.firstname, req.body.newPassword1)


            }

        })

    }


)

async function update(email, password) {


    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash)



    await userSchema.updateOne({ email: email }, { $set: { password: passwordHash } });
    alert('Password updated Succesfully');

}


function sendMailupdate(email, firstname, password) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        auth: {
            user: 'favoritesong1999@gmail.com',
            pass: 'vkdntcnmmjherfdv'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    var mailOptions = {
        from: 'favoritesong1999@gmail.com',
        to: email,
        subject: 'Password updated to Favorite Song',
        text: ("Hello, " + firstname + "\nYou updated your password to Favorite Song  to:  " + password)
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


module.exports = router;