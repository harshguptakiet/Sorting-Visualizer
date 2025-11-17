import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    // Analytics fields
    sortsCount: { type: Number, default: 0 },
    totalComparisons: { type: Number, default: 0 },
    totalSwaps: { type: Number, default: 0 },
    totalTimeMs: { type: Number, default: 0 },
    algoUsage: {
      type: Map,
      of: Number,
      default: () => ({
        Bubble: 0,
        Selection: 0,
        Insertion: 0,
        Merge: 0,
        Quick: 0
      })
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.model("User", userSchema);
