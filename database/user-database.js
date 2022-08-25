const mongoose = require("mongoose")


mongoose.connect("mongodb+srv://Cubanezu9999:CUba1902@cluster0.4hyfm.mongodb.net/myproject?retryWrites=true&w=majority", () => {
    useNewUrlParser: true;
    useUnifiedTopology: true;
    console.log("Succesfuly connected to mongo database")
}, e => console.error(e));

const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,

    password: String
}, { timestamps: true })



module.exports = mongoose.model("users", userSchema)