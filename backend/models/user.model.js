import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		clerkId: {
			type: String,
			index: true,
			unique: true,
			sparse: true,
			description: "Clerk user id (if the user was created via Clerk)",
		},
		name: {
			type: String,
			required: [true, "Name is required"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		// Keep password for backward compatibility but do not require it for Clerk users
		password: {
			type: String,
			minlength: [6, "Password must be at least 6 characters long"],
		},
		cartItems: [
			{
				quantity: {
					type: Number,
					default: 1,
				},
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
				},
			},
		],
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

// Pre-save hook to hash password before saving to database
userSchema.pre("save", async function (next) {
	// If password is not set or not modified, skip hashing
	if (!this.password || !this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
