// Import Nodemailer
var nodemailer = require('nodemailer');

// Create a transporter
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chegondirithinsurya@gmail.com',
    pass: 'mkvw fmrx rorn bycr'
  }
});

// Function to send reminder email
const sendReminderEmail = async (email) => {
  try {
    const mailOptions = {
      from: 'chegondirithinsurya@gmail.com',
      to: email,
      subject: 'Reminder to Complete Your Goal Setting',
      text: 'You have added a new task. Please make sure to complete your goal setting!'
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${email}`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
};

// Define the express route for adding a task
app.post('/addTask', async (req, res) => {
  const { email, task } = req.body;

  try {
    // Add the task to the database
    // Example: await TaskModel.create({ email, task });

    // After adding the task, send the reminder email
    await sendReminderEmail(email);

    res.status(200).send({ message: 'Task added successfully and reminder email sent.' });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).send({ message: 'Error adding task.' });
  }
});
