const express = require("express");
const app = express();

const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userModel = require("./models/user.model.js");
const postModel = require("./models/post.model.js");
const upload = require("./utils/multer.js");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", checkUser, async function (req, res) {
  const posts = await postModel.find().populate("author");
  const user = req.user.userid;
  res.render("index", { posts, user });
});

// app.get("/", async function (req, res) {
//   const posts = await postModel.find().populate("author")
//   res.render("index", {posts});
// });

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
      res.redirect("/profile");
    });
  });
});

app.get("/register", function (req, res) {
  res.render("register");
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
      let token = jwt.sign(
        { email: existedUser.email, userid: existedUser._id },
        "secret key"
      );
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else {
      res.send("password incorrect !!");
    }
  });
});

app.get("/logout", function (req, res) {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLoggedIn, async function (req, res) {
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");

  res.render("profile", { user });
});

app.post("/createpost", isLoggedIn, async function (req, res) {
  let { content } = req.body;
  let user = await userModel.findOne({ email: req.user.email });
  let post = await postModel.create({
    author: user._id,
    content: content,
  });
  user.posts.push(post._id);

  await user.save();

  res.redirect("profile");
});

app.get("/like/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id }).populate("author");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }
  await post.save();

  res.redirect("/");
});

app.get("/profile/upload", async function (req, res) {
  res.render("ProfileUpload.ejs");
});

app.post(
  "/uploadpic",
  isLoggedIn,
  upload.single("avatar"),
  async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    user.avatar = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

//custom middleware
function isLoggedIn(req, res, next) {
  if (!req.cookies.token) {
    res.redirect("/login");
  } else {
    jwt.verify(req.cookies.token, "secret key", function (err, data) {
      req.user = data;
      next();
    });
  }
}

function checkUser(req, res, next) {
  if (req.cookies.token) {
    jwt.verify(req.cookies.token, "secret key", function (err, data) {
      req.user = data;
      next();
    });
  } else {
    req.user = "";
    next();
  }
}

app.listen(3000, function () {
  console.log("app is running");
});
