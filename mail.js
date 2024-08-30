var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chegondirithinsurya@gmail.com',
    pass: 'mkvw fmrx rorn bycr'
  }
});

var mailOptions = {
  from: 'chegondirithinsurya@gmail.com',
  to: 'siddhukallakuri3112005@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});