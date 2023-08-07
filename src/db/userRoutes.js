const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/user");

router.post("/register", async (req, res) => {
  try {
    const { username, login, password, role } = req.body;

    const existingUser = await User.findOne({ login });
    if (existingUser) {
      return res.status(400).json({ error: "Login already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      login,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Rota de login
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;
    console.log(req.body);
    const user = await User.findOne({ login });
    if (!user) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    const token = jwt.sign({ userData: user }, "secret-key", { expiresIn: "72h" });
    return res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/verify", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
    }

    jwt.verify(token, "secret-key", (err, decoded) => {
      if (err) {
        res.status(401).json({ error: "Unauthorized" });
      }
      const { userData } = decoded;
      res.status(200).json({ userData });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
