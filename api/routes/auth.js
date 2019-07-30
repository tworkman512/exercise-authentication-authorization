const router = require("express").Router();
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const User = require("../models/user");

const { SECRET_PW } = process.env;

router.get("/profile", async (req, res, next) => {
  try {
    const token = req.headers.authorization.split("Bearer ")[1];
    const payload = jsonwebtoken.verify(token, SECRET_PW);
    const user = await User.findOne({ _id: payload.id }).select(
      "-__v -password"
    );

    const status = 200;
    res.json({ status, user });
  } catch (e) {
    console.error(e);
    const error = new Error("You are not authorized to access this route.");
    error.status = 401;
    next(error);
  }
});

router.post("/signup", async (req, res, next) => {
  const status = 201;
  try {
    const { username, password, admin } = req.body;
    const user = await User.findOne({ username });
    if (user) throw new Error(`User ${username} already exists.`);

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const response = await User.create({
      username,
      password: hashedPassword,
      admin
    });
    res.status(status).json({ status, response });
  } catch (error) {
    console.log(error);
    const e = new Error("We can't let you in.");
    e.status = 400;
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  const status = 201;
  try {
    const { username, password } = req.body;
    const checkForUser = await User.findOne({
      username
    });
    if (!checkForUser) throw new Error(`User ${username} does not exist.`);

    const user = await bcrypt.compare(password, checkForUser.password);
    if (!user) throw new Error(`Password is invalid.`);

    const payload = { id: user._id };
    const options = { expiresIn: "1 day" };
    const token = jsonwebtoken.sign(payload, "SECRET_PW", options);

    // res.status(status).json({ status, response: `You have been logged in.` });
    res.status(status).json({ status, token });
  } catch (error) {
    console.log(error);
    const e = new Error("Login credentials incorrect.");
    e.status = 401;
    next(e);
  }
});

module.exports = router;
