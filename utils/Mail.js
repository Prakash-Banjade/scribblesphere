const nodemailer = require('nodemailer')
const { google } = require('googleapis')

const OAuth2 = google.auth.OAuth2;

const OAuth2_client = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, 'https://developers.google.com/oauthplayground')
OAuth2_client.setCredentials({ refresh_token: process.env.CLIENT_REFRESH_TOKEN })

async function send_mail(name, recepient, otp) {
  const accessToken = OAuth2_client.getAccessToken(); // generates new access token whenever the function is called

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.CLIENT_EMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken,
      refreshToken: process.env.CLIENT_REFRESH_TOKEN,
    }
  })


  await new Promise((resolve, reject) => {
    // verify connection configuration
    transport.verify(function (error, success) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("Server is ready to take our messages");
        resolve(success);
      }
    });
  });

  const mail_options = {
    from: `VERIFICATION ${process.env.CLIENT_EMAIL}`,
    to: recepient,
    subject: `${otp} is your ScribbleSphere registration code`,
    html: html_message(name, otp),
  }

  await new Promise((resolve, reject) => {
    transport.sendMail(mail_options, (err, result) => {
      if (err) {
        console.log('Error: ', err)
        reject(err)
      } else {
        console.log('result:', result)
        resolve(result)
      }

      transport.close();
    })
  })

}

function html_message(user, otp) {
  return `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="https://scribblesphere.vercel.app" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600;color:#0bbe64;">ScribbleSphere</a>
      </div>
      <p style="font-size:1.1em">Hi, ${user}</p>
      <p>Thank you for choosing ScribbleSphere. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
      <p>This is very confidiential. Do not share this OTP with anyone else.</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
      <p style="font-size:0.9em;">Regards,<br />ScribbleSphere</p>
      <hr style="border:none;border-top:1px solid #eee" />
      <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
        <p>ScribbleSphere</p>
        <p>Butwal-3, Rupandehi</p>
        <p>Nepal</p>
      </div>
    </div>
  </div>`
}

module.exports = send_mail;