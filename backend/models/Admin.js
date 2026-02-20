import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* ======================================================
   ADMIN SCHEMA
====================================================== */
const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: [
                "super_admin",
                "owner",
                "admin",
                "editor",
                "support",
                "finance",
            ],
            default: "admin",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

/* ======================================================
   HASH PASSWORD BEFORE SAVE
====================================================== */
adminSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/* ======================================================
   MATCH PASSWORD
====================================================== */
adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Admin", adminSchema);