import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { MongoClient } from 'mongodb';

// Database Connection
let db;
async function connectToDB(cb) {
    const url = "mongodb://localhost:27017"; // Ensure MongoDB is running
    const client = new MongoClient(url);
    await client.connect();
    db = client.db("task");
    console.log("Connected to MongoDB");
    cb();
}

const app = express();

// ✅ Fix CORS issue by explicitly allowing frontend origin
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'chegondirithinsurya@gmail.com',
        pass: 'tzwq uupl zrgz amex' // Use App Password, NOT your actual password
    }
});

// Global Variable for Signed-In User (Fix)
let signedInUserEmail = '';

// ✅ Fix Task Reminder Scheduling
const reminderJobs = {};
const scheduleReminder = (email) => {
    if (reminderJobs[email]) {
        console.log(`Reminder already scheduled for ${email}`);
        return;
    }

    reminderJobs[email] = cron.schedule('*/60 * * * *', async () => {
        const mailOptions = {
            from: 'chegondirithinsurya@gmail.com',
            to: email,
            subject: 'Reminder to Complete Your Goal Setting',
            text: 'You have added a new task. Please make sure to complete your goal setting!',
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending reminder email:", error);
            } else {
                console.log('Reminder email sent:', info.response);
            }
        });
    });
};

// ✅ Fix: Declare signedInUserEmail properly before using it
app.post('/addTask', async (req, res) => {
    const { task } = req.body;

    // Fix: Ensure signedInUserEmail is not empty
    if (!signedInUserEmail || !task || !task.task || !task.time) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    try {
        // Insert task into database
        const result = await db.collection('tasks').insertOne({
            email: signedInUserEmail,
            task: task.task,
            time: task.time
        });

        console.log('Task inserted:', result);

        // Schedule Reminder Email
        scheduleReminder(signedInUserEmail);

        res.status(200).json({
            message: 'Task added successfully and reminder email scheduled.',
            taskId: result.insertedId
        });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Error adding task.' });
    }
});

// ✅ Fix: Ensure signup stores user data properly
app.post('/signup', async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await db.collection("ast").findOne({ email });

        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
        }

        await db.collection("ast").insertOne({ name, email, mobile, password });

        // Send Welcome Email
        transporter.sendMail({
            from: 'chegondirithinsurya@gmail.com',
            to: email,
            subject: 'Welcome to Soul Flex',
            text: 'Welcome to Soul Flex!'
        });

        res.json({ message: "Registration successful" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Fix: Properly store signed-in user email
app.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await db.collection("ast").findOne({ email }) || await db.collection("admin").findOne({ email });

        if (user) {
            if (password === user.password) {
                signedInUserEmail = email; // Store user email

                // Send Sign-in Email
                transporter.sendMail({
                    from: 'chegondirithinsurya@gmail.com',
                    to: email,
                    subject: 'Welcome to Soul Flex',
                    text: 'Welcome to Soul Flex!'
                });

                scheduleReminder(email);

                return res.json({ message: "Sign-in successful", userType: user.role || "User" });
            } else {
                return res.status(401).json({ error: "Incorrect password" });
            }
        } else {
            return res.status(404).json({ error: "User not found" });
        }
    } catch (e) {
        console.error("Error during sign-in:", e);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Fix: Start Server Only After Database Connection is Ready
connectToDB(() => {
    app.listen(9000, () => {
        console.log("🚀 Server running at http://localhost:9000");
    });
});
