import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-change-me";

// Mock user database (in production, use a real database)
const users: any[] = [];

const parseUrl = (path: string) => {
  const parts = path.split("/");
  return parts[parts.length - 1];
};

export const handler = async (event: any) => {
  const method = event.httpMethod;
  const path = event.path;
  const action = parseUrl(path); // "login" or "register"

  if (method !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password required" }),
      };
    }

    if (action === "register") {
      // Check if user exists
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "User already exists" }),
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = {
        id: Date.now().toString(),
        email,
        password: hashedPassword,
      };

      users.push(newUser);

      // Create token
      const token = jwt.sign({ id: newUser.id, email }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          token,
          user: { id: newUser.id, email },
        }),
      };
    } else if (action === "login") {
      // Find user
      const user = users.find((u) => u.email === email);
      if (!user) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Invalid credentials" }),
        };
      }

      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Invalid credentials" }),
        };
      }

      // Create token
      const token = jwt.sign({ id: user.id, email }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          token,
          user: { id: user.id, email },
        }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Not found" }),
      };
    }
  } catch (error: any) {
    console.error("Auth error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
};
