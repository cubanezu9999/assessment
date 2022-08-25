const mongoose = require("mongoose")


mongoose.connect("mongodb+srv://Cubanezu9999:CUba1902@cluster0.4hyfm.mongodb.net/myproject?retryWrites=true&w=majority", () => {
    useNewUrlParser: true;
    useUnifiedTopology: true;
    console.log("Succesfuly connected to mongo database")
}, e => console.error(e));

const songSchema = new mongoose.Schema({
    artist: String,
    title: String
})



module.exports = mongoose.model("songs", songSchema)