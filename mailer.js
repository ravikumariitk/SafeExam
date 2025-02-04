import nodemailer from 'nodemailer'

let mailTransporter =
    nodemailer.createTransport(
        {
            service: 'gmail',
            auth: {
                user: 'noreplysafeexam@gmail.com',
                pass: 'gkye oofm ucpt cmut'
            }
        }
    );

export function mailer(to, mailData) {
    console.log(mailData);
    let mailDetails = {
        from: 'noreplysafeexam@gmail.com',
        to: to,
        subject: 'Test Mail',
        html: ``
    };

if (mailData.reason === 'result') {
        mailDetails.subject = `Result Released | ${mailData.quizTitle}`
        mailDetails.html = `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px;">
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Dear <strong>${mailData.name}</strong>, <br><br>
            The result for the quiz "<strong>${mailData.quizTitle}</strong>" has been released. <br><br>
            <span style="font-size: 18px; color: #333;"><strong>Score:</strong> ${mailData.score}</span><br><br>
            Kindly visit your account to view more details and your performance.
        </p>
    </div>
    <p style="text-align: center; font-size: 14px; color: #777; margin-top: 30px;">
        &copy; 2025 SafeExam. All Rights Reserved.
    </p>
</div>
    `
}

if(mailData.reason === 'mark-change'){
    mailDetails.subject = `Score Updated | ${mailData.quizTitle}`
        mailDetails.html = `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px;">
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Dear <strong>${mailData.name}</strong>, <br><br>
            Your marks for the question no "<strong>${mailData.questionNo}</strong>" of "<strong>${mailData.quizTitle}</strong>" has been updated. <br><br>
            <span style="font-size: 18px; color: #333;"><strong>Score:</strong> ${mailData.score}</span><br><br>
            <span style="font-size: 18px; color: #333;"><strong>Status:</strong> ${mailData.status}</span><br><br>
            Kindly visit your account to view more details.
        </p>
    </div>
    <p style="text-align: center; font-size: 14px; color: #777; margin-top: 30px;">
        &copy; 2025 SafeExam. All Rights Reserved.
    </p>
</div>
    `
}

if(mailData.reason === 'ans-key'){
    mailDetails.subject = `Answer key Released | ${mailData.quizTitle}`
        mailDetails.html = `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px;">
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Dear <strong>${mailData.name}</strong>, <br><br>
            Answer key for "<strong>${mailData.quizTitle}</strong>" has been released. <br><br>
            Kindly visit your account to view more details.
        </p>
    </div>
    <p style="text-align: center; font-size: 14px; color: #777; margin-top: 30px;">
        &copy; 2025 SafeExam. All Rights Reserved.
    </p>
</div>
    `
}

if(mailData.reason === 'ans-key-update'){
    mailDetails.subject = `Answer Key Updated  | ${mailData.quizTitle}`
        mailDetails.html = `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px;">
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Dear <strong>${mailData.name}</strong>, <br><br>
            Answer key for "<strong>${mailData.quizTitle}</strong>" has been updated. <br><br>
            Kindly visit your account to view more details.
        </p>
    </div>
    <p style="text-align: center; font-size: 14px; color: #777; margin-top: 30px;">
        &copy; 2025 SafeExam. All Rights Reserved.
    </p>
</div>
    `
}

if(mailData.reason === 'signup'){
    mailDetails.subject = `OTP Verification | SafeExam`
        mailDetails.html = `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px;">
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Otp for the verification : ${mailData.otp}, and will be valid for 2 min.
        </p>
    </div>
    <p style="text-align: center; font-size: 14px; color: #777; margin-top: 30px;">
        &copy; 2025 SafeExam. All Rights Reserved.
    </p>
</div>
    `
}




    mailTransporter
        .sendMail(mailDetails,
            function (err, data) {
                if (err) {
                    console.log('Error Occurs', err);
                } else {
                    console.log('Email sent successfully');
                }
            });
}