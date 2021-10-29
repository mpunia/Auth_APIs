const mongoose = require("mongoose");
const schema = mongoose.Schema;

const registerSchema = new schema({
    userName: {
        type: String,
        unique: true
    },
    isVerified: { type: Boolean, default: false },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,

        validate: {
            validator: function (v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: "Please enter a valid email"
        },
        required: [true, "Email required"]
    },
    password: {
        type: String,
        required: true,

    },
    phone: {
        type: String
    },
    country: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    resetToken: {
        type: String
    },
    expireToken: {
        type: Date
    },
    profilePicture: {
        type: String,
        required: true
    }
});


const User = mongoose.model('User', registerSchema);

//validate password
function validatePassword(p) {
    //var p = document.getElementById('newPassword').value,
    const errors = [];
    if (p.search(/[a-z]/) < 0) {
        errors.push("Your password must contain at least one lower case letter.");
    }
    if (p.search(/[A-Z]/) < 0) {
        errors.push("Your password must contain at least one upper case letter.");
    }

    if (p.search(/[0-9]/) < 0) {
        errors.push("Your password must contain at least one digit.");
    }
    if (p.search(/[!@#\$%\^&\*_]/) < 0) {
        errors.push("Your password must contain at least special char from -[ ! @ # $ % ^ & * _ ]");
    }
    if (errors.length > 0) {
        console.log(errors.join("\n"));
        return false;
    }
    return true;
}

module.exports = { User, validatePassword };
