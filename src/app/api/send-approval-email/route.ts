import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('Sending approval email to:', email);
    console.log('SendGrid API Key exists:', !!process.env.SENDGRID_API_KEY);
    console.log('SendGrid API Key value:', process.env.SENDGRID_API_KEY?.substring(0, 10) + '...');

    const msg = {
      to: email,
      from: 'admin@enertech3.com', // Replace with your verified sender
      subject: 'Your account has been approved!',
      html: `
        <h1>Welcome!</h1>
        <p>Your account has been approved. You can now log in to the application.</p>
        <p>Best regards,<br>Enertech Administrator</p>
      `,
    };

    const result = await sgMail.send(msg);
    console.log('Email sent successfully:', result);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    console.error('Error details:', error.response?.body || error.message);
    return NextResponse.json({
      error: 'Failed to send email',
      details: error.message
    }, { status: 500 });
  }
}