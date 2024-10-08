import cors from 'cors';
import express from 'express';
import nodemailer from 'nodemailer';

import { connectToDB, db } from './db.js';

import TaskModel from './TaskModel.js';
import cron from 'node-cron';





const app = express();
app.use(cors());
app.use(express.json());

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chegondirithinsurya@gmail.com',
    pass: 'mkvw fmrx rorn bycr' // Your actual app password
  }
});


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

    await sendEmail(mailOptions);
  });
};




app.post('/addTask', async (req, res) => {
  const { task } = req.body;

  // Validate data
  if (!signedInUserEmail || !task || !task.task || !task.time) {
      return res.status(400).json({ message: 'Invalid data' });
  }

  try {
      // Add the task to the 'tasks' collection using the signed-in user's email
      const result = await db.collection('tasks').insertOne({
          email: signedInUserEmail,
          task: task.task,
          time: task.time
      });

      console.log('Task inserted:', result);

      // Get the inserted task's ID
      const taskId = result.insertedId;

      // Schedule reminder email (if applicable)
      scheduleReminder(signedInUserEmail);

      res.status(200).json({
          message: 'Task added successfully and reminder email scheduled.',
          taskId: taskId // Return the task ID
      });
  } catch (error) {
      console.error('Error adding task:', error);
      res.status(500).json({ message: 'Error adding task.' });
  }
});

// Home Route
app.get('/', (req, res) => {
  res.json("Server is running successfully!");
});

// Get All Documents from 'ast' Collection
app.get('/ast', async (req, res) => {
  try {
    const result = await db.collection("ast").find().toArray();
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// User Signup
app.post('/signup', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await db.collection("ast").findOne({
      $or: [{ email: email }, { mobile: mobile }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ error: "Email already exists" });
      } else if (existingUser.mobile === mobile) {
        return res.status(409).json({ error: "Mobile number already exists" });
      }
    }

    const result = await db.collection("ast").insertOne({
      name: name,
      password: password,  // Store normal password
      email: email,
      mobile: mobile
    });

    // Send Welcome Email
    const mailOptions = {
      from: 'chegondirithinsurya@gmail.com',
      to: email,
      subject: 'Welcome to Soul Flex',
      text: 'Welcome to Soul Flex!'
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Welcome Email sent: ' + info.response);
      }
    });

    res.json({ message: "Registration successful", result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Signin
// User Signin
let signedInUserEmail = ''; // Global variable to store the signed-in user's email

app.post('/signin', async (req, res) => {
    try {
        console.log("Sign-in request received");
        console.log("Request body:", req.body);

        const email = req.body.email;
        const password = req.body.password;

        console.log("Looking for user with email:", email);

        // Check in 'ast' collection
        let user = await db.collection("ast").findOne({ email: email });

        // If not found in 'ast', check in 'admin' collection
        if (!user) {
            user = await db.collection("admin").findOne({ email: email });
        }

        if (user) {
            console.log("User found:", user);
            if (password === user.password) {  // Compare normal passwords
                console.log("Password match successful");

                // Store the signed-in user's email in the global variable
                signedInUserEmail = email;

                // Send Welcome Email upon successful sign-in
                const mailOptions = {
                    from: 'chegondirithinsurya@gmail.com',
                    to: email,
                    subject: 'Welcome to Soul Flex',
                    text: 'Welcome to Soul Flex!'
                };

                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });

                // Schedule reminder emails
                scheduleReminder(email);

                // Determine if user is an admin or regular user
                const userType = await db.collection("admin").findOne({ email: email }) ? 'Admin' : 'User';

                return res.json({ message: `Welcome ${userType}`, values: user, userType });
            } else {
                console.log("Password does not match");
                return res.status(401).json({ error: "Password does not match" });
            }
        } else {
            console.log("User does not exist");
            return res.status(401).json({ error: "User does not exist" });
        }
    } catch (e) {
        console.error("Error during sign-in process:", e);
        return res.status(500).json({ error: 'Internal server error' });
    }
});



  

// Reset Password
// Reset Password
app.put('/reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
  
      // Validate request body
      if (!email || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required" });
      }
  
      // Find user by email
      const user = await db.collection("ast").findOne({ email: email });
  
      // If user does not exist
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Update password in the database
      const result = await db.collection("ast").updateOne(
        { email: email },
        { $set: { password: newPassword } }  // Store normal password
      );
  
      // Check if the update was successful
      if (result.modifiedCount === 0) {
        return res.status(500).json({ error: "Failed to update password" });
      }
  
      res.json({ message: "Password updated successfully" });
    } catch (e) {
      console.error("Error during password reset process:", e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// OTP Store (for temporary OTP storage)
const otpStore = {};

// Send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
  otpStore[email] = otp; // Store OTP temporarily

  try {
    const mailOptions = {
      from: 'chegondirithinsurya@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    delete otpStore[email]; // OTP is used, so delete it
    res.status(200).json({ message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Start the Server
connectToDB(() => {
  app.listen(9000, () => {
    console.log("Server running at http://localhost:9000");
  });
});
