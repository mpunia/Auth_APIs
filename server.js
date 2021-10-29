const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors")
const auth = require("./routes/authRoute");

//mongoose connection
const mongoUrl = process.env.MONGODB_URL;
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Database connected 😁"))
.catch((err) => console.log(err));


//middlewares

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

app.use("/api/authen/", auth);
//app.use("/api/user",userRoute);

const port = process.env.port || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));