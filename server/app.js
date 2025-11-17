import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import analyticsRoutes from "./routes/analytics.js";
import { auth } from "./middleware/auth.js";

dotenv.config();
await connectDB();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (_req, res) => res.json({ status: "OK" }));
app.use("/api/auth", authRoutes);
app.get("/api/auth/me", auth, async (req, res) => {
	// Return email + id for richer UI
	try {
		// lazy import to avoid circular
		const { User } = await import("./models/User.js");
		const user = await User.findById(req.user.id).select("email");
		return res.json({ user: req.user.id, email: user?.email });
	} catch {
		return res.json({ user: req.user.id });
	}
});
app.use("/api/analytics", analyticsRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
