import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";

const createSuperAdmin = async () => {
    try {
        /* ================= CONNECT DATABASE ================= */
        await connectDB();

        const email = "admin@exr.com".toLowerCase();
        const password = "Admin123"; // 🔐 Change after first login

        /* ================= CHECK EXISTING ================= */
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            console.log("⚠️ Super admin already exists");
            await mongoose.connection.close();
            process.exit(0);
        }

        /* ================= CREATE ADMIN ================= */
        // ❌ DO NOT HASH PASSWORD HERE
        // Let adminSchema.pre("save") hash it

        await Admin.create({
            name: "Super Admin",
            email,
            password, // <-- plain password
            role: "super_admin",
            isActive: true,
        });

        console.log("=================================");
        console.log("✅ SUPER ADMIN CREATED SUCCESSFULLY");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("=================================");

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error("❌ ERROR CREATING SUPER ADMIN:", error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

createSuperAdmin();