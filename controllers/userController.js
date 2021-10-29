const jwt = require("jsonwebtoken");
const { User, validatePassword } = require("../models/users");
const bcrypt = require("bcrypt");
const Token = require('../models/token');
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");


//************sendgrid api key********************//
const options = {
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}
const transporter = nodemailer.createTransport(sendGridTransport(options));


/*********User Register api******************
 * @profilePicture : profile picture
 * @basepath : local storage path
 * @passwordValidate : declared in users schema
 * @token : generated radom token to send in email for verification
 * @transporter : used sendgrid transport for email verification on register button
*/

exports.register = async (req, res, next) => {
    const { firstName, lastName, userName, email, password, confirmPassword, phone, country } = req.body;

    //check profile picture and set basepath
    const profilePicture = req.file;
    if (!profilePicture) return res.status(400).json({ message: "Profile picture need to be uploaded", statuscode: "500" });
    const profilePictureName = profilePicture.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    const passwordValidate = validatePassword(password)
    if (passwordValidate == false) return res
        .status(400)
        .json({ message: "Password should have At Least one UpperCase, one LowerCase, one Special Character and one number" })
    // Checking to ensure password length is at least 5 characters
    if (password.length < 5 || password.length > 15) {
        return res
            .status(400)
            .json({ message: "The password needs to be between 5-15 characters long", statuscode: "400" })
    }
    //Matching password
    if (password !== confirmPassword) {
        return res
            .status(400)
            .json({ message: "Password do not match", statuscode: "400" })
    }
    //checking required filed is not empty
    if (!userName || !password || !email) {
        return res
            .status(400)
            .json({ message: "username, password, profilePicture, email can not be empty fileds", statuscode: "400" })
    };

    try {
        //hashing password
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            firstName: firstName,
            lastName: lastName,
            userName: userName,
            email: email,
            password: hashpassword,
            phone: phone,
            country: country,
            profilePicture: `${basePath}${profilePictureName}`
        });

        //Saving new user
        const user = newUser.save((err, user) => {
            if (err) return res.status(500).json({ message: err.message, statuscode: "500" });
            const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
            token.save(function (err) {
                if (err) {
                    return res.status(500).json({ message: err.message, statuscode: "500" });
                }
            });

            // Send email (use credintials of SendGrid)
            const mailOptions = {
                from: 'm.punia972@gmail.com',
                to: newUser.email,
                subject: 'Account Verification Link',
                text: 'Hello ' + req.body.userName + ',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api\/' + '\authen\/' + '\confirmation\/' + newUser.email + '\/' + token.token + '\n\nThank You!\n'
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.log(err)
                    return res.status(500).send({ error: err, msg: 'Technical Issue!, Please click on resend for verify your Email.', statuscode: "500" });
                }
                if (info) return res.status(200).json({ message: 'A verification email has been sent to ' + newUser.email + '. It will be expire after one day.', statuscode: "200 ok" });
            });
        });

    } catch (err) {
        err.status = 500;
        next(err);
    }
}


/*************confirm email API********
 * @token : its the same token sent on register.Searching in Token schema.
*/
exports.confirmEmail = function (req, res, next) {
    Token.findOne({ token: req.params.token }, function (err, token) {
        // token is not found into database i.e. token may have expired 
        if (!token) {
            return res.status(400).json({ message: 'Your verification link may have expired.', statuccode: "500" });
        }
        // if token is found then check valid user 
        else {
            User.findOne({ _id: token._userId, email: req.params.email }, function (err, user) {
                // not valid user
                if (!user) {
                    return res.status(401).json({ message: 'We were unable to find a user for this verification. Please SignUp!' });
                }
                // user is already verified
                else if (user.isVerified) {
                    return res.status(200).send('User has been already verified. Please Login');
                }
                // verify user
                else {
                    // change isVerified to true
                    user.isVerified = true;
                    user.save(function (err) {
                        // error occur
                        if (err) {
                            return res.status(500).json({ message: err.message, statuscode: "500" });
                        }
                        // account successfully verified
                        else {
                            return res.status(200).json({ message: 'Your account has been successfully verified', statuscode: "200 ok" });
                        }
                    });
                }
            });
        }
    });
};


/******** user login******
 * @validated : password compare input and actual
 * @token : generating JWT token
*/
exports.login = async (req, res, next) => {
    const { userName } = req.body;
    try {
        const user = await User.findOne({ userName: userName });
        if (!user) return res.status(500).json({ message: "No user found with this username" });
        //if (!user) return res.status(500).json({ message: "Invalid username" });
        if (user.isVerified == false) {
            return res
                .status(400)
                .json({ message: "Please verify your email before login" })
        };
        const validated = await bcrypt.compare(req.body.password, user.password);
        !validated && res.status(400).json({ message: "Password does not matched" });
        const token = getSignedToken(user);
        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge });
        const { password, ...users } = user._doc;
        return res.status(200).json({ ...users, token, message: 'login success', statusCode: "200 ok" });

    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal server error", statusCode: "500" });
    }

}

/****generate JWT tokens***
 * @maxAge : expire time of jwt token
 */ 
const maxAge = 3 * 24 * 60 * 60;
const getSignedToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email
        },
        process.env.SECRET_KEY,
        { expiresIn: maxAge });
}
