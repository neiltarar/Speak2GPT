// Set env variables
import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });
// Import libraries
import express from "express";
import userRoutes from "./routes/userRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import promptApiRoutes from "./routes/promptApiRoutes";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authenticateToken } from "./middlewares/authMiddleware";
import { rateLimit } from "express-rate-limit";

const app = express();
// This tells Express that it's behind a proxy, and that it should trust the X-Forwarded-For header
app.set("trust proxy", 1);
const PORT = process.env.AUTH_API_PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";
const appLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
console.log(process.env.NODE_ENV);
isProduction
	? app.use(
			cors({ origin: "https://gpt-helper.duckdns.org", credentials: true })
	  )
	: app.use(cors({ origin: "http://localhost:3000", credentials: true }));

isProduction
	? app.use("/api/", appLimiter)
	: console.log("API request limiter is off");

app.use(cookieParser());
app.use(express.json()); // for parsing application/json
app.use(express.static(path.join(__dirname, "build")));

app.use("/users", userRoutes);
app.use("/sessions", sessionRoutes);
app.use("/api", authenticateToken, promptApiRoutes);
app.use((req, res) => {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () =>
	console.log(`Server is running on http://localhost:${PORT}`)
);
