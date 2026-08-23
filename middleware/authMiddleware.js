const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access token required"
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Access token required"
      });
    }

    // Verify JWT with Supabase
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }

    // Store authenticated user
    // so routes can access req.user
    req.user = user;

    // Continue to the protected route
    next();

  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}

module.exports = requireAuth;