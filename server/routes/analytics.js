import express from "express";
import { User } from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get analytics summary for current user
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    const { sortsCount = 0, totalComparisons = 0, totalSwaps = 0, totalTimeMs = 0 } = user;
    let usage = {};
    const raw = user.algoUsage;
    if (raw && typeof raw.entries === 'function') {
      // Map in case lean=false; but with lean it's usually plain object
      usage = Object.fromEntries(raw.entries());
    } else if (raw && typeof raw === 'object') {
      usage = raw;
    }
    // Ensure all expected keys exist
    usage = {
      Bubble: usage.Bubble || 0,
      Selection: usage.Selection || 0,
      Insertion: usage.Insertion || 0,
      Merge: usage.Merge || 0,
      Quick: usage.Quick || 0
    };
    return res.json({
      sortsCount,
      totalComparisons,
      totalSwaps,
      totalTimeMs,
      algoUsage: usage
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Add a completed sort's stats
router.post("/add", auth, async (req, res) => {
  try {
    const { comparisons = 0, swaps = 0, timeMs = 0, algorithm = "" } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.sortsCount += 1;
    user.totalComparisons += comparisons;
    user.totalSwaps += swaps;
    user.totalTimeMs += timeMs;

    const algoKey = algorithm.replace(/ Sort$/i, ""); // e.g. Bubble Sort -> Bubble
    const prev = user.algoUsage.get(algoKey) || 0;
    user.algoUsage.set(algoKey, prev + 1);

    await user.save();
    return res.status(201).json({ message: "Analytics updated" });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
