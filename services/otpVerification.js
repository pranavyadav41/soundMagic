require('dotenv').config({ path: 'config/.env' });
const nodemailer = require('nodemailer');

const emailUsername = process.env.MY_EMAIL;
const emailPassword = process.env.MY_PASSWORD;

async function Sendmail(otp,mail,name){
    const transporter =nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:emailUsername,
            pass:emailPassword,
        }
    });

    const mailoptions = {
        from:emailUsername,
        to:mail,
        subject:"Account Verification for SoundMagic",
        text:`Dear ${name},

        To verify your SoundMagic account, use OTP: ${otp}.
        
        Thank you,
        SoundMagic Team`
    }

//send email
try {
    const result = await transporter.sendMail(mailoptions);
    console.log("email sent successfully");
} catch (error) {
    console.log("Failed to send email", error.message);
    
}    


}

module.exports = Sendmail