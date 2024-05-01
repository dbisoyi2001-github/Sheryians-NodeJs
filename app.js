const express = require("express");
const app = express();

const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userModel = require("./models/user.model.js");
const postModel = require("./models/post.model.js");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", function (req, res) {
  res.render("index");
});

app.post("/register", async function (req, res) {
  let { username, email, password } = req.body;

  let existedUser = await userModel.findOne({ email });

  if (existedUser) return res.status(500).send("user already exist !!");

  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      let user = await userModel.create({
        username,
        email,
        password: hash,
      });

      let token = jwt.sign({ email: email, userid: user._id }, "secret key");
      res.cookie("token", token);
      res.send("registered");
    });
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", async function (req, res) {
  let { username, password } = req.body;

  let existedUser = await userModel.findOne({ username });

  if (!existedUser) return res.status(500).send("user not exist !!");

  bcrypt.compare(password, existedUser.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: existedUser.email, userid: existedUser._id }, "secret key");
      res.cookie("token", token);
      res.status(200).send(" Login successfully ");
    } else {
      res.send("password incorrect !!");
    }
  });
});

app.get("/logout", function (req, res) {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    res.send("you need to be login");
  } else {
    jwt.verify(token, "secret key", function (err, data) {
      req.user = data;
      next();
    });
  }
}

app.listen(3000);
