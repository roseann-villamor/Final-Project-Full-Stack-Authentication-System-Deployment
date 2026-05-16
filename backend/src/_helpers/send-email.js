module.exports = sendEmail;

async function sendEmail({ to, subject, html, from }) {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { email: from || process.env.EMAIL_FROM },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            })
        });
        const data = await response.json();
        console.log('Email sent:', JSON.stringify(data));
    } catch (err) {
        console.error('Email send failed:', err.message);
    }
}