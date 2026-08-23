const express = require("express");
const router = express.Router();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==========================================
// SIGNUP
// ==========================================

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(201).json({
      user: data.user
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      error: "Signup failed"
    });
  }
});

// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error || !data.session) {
      return res.status(401).json({
        error: "Invalid login credentials"
      });
    }

    res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Login failed"
    });
  }
});

// ==========================================
// LOGOUT
// ==========================================

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access token required"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Access token required"
      });
    }

    // Verify the token first
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }

    // Logout the current Supabase session
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      console.error("Logout error:", logoutError);

      return res.status(500).json({
        error: "Logout failed"
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      error: "Logout failed"
    });
  }
});

module.exports = router;