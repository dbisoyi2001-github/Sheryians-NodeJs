const mongoose = require("mongoose")

mongoose.connect("mongodb://127.0.0.1:27017/miniblog")

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    avatar: {
        type: String,
        default: "default.png"
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ]
})

module.exports = mongoose.model("user", userSchema)