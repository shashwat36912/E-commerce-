import mongoose from "mongoose";

const connectDB = async () => {
	try {
		if (!process.env.MONGO_URI) {
			console.error('MONGO_URI is not set. Please define MONGO_URI in your .env file.');
			process.exit(1);
		}
		await mongoose.connect(process.env.MONGO_URI);
		console.log(`MongoDB connected: ${mongoose.connection.host}`);
	} catch (error) {
		console.log("Error connecting to MONGODB", error.message);
		process.exit(1);
	}
};

export default connectDB;

