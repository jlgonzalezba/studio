import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('Sending registration notification to admin for user:', email);

    const msg = {
      to: process.env.ADMIN_EMAIL || 'admin@enertech3.com', // Set ADMIN_EMAIL in .env.local
      from: 'noreply@enertech3.com', // Must be verified sender
      subject: 'New User Registration Request',
      html: `
        <h1>New Registration Request</h1>
        <p>A new user has registered and is waiting for approval:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Please review and approve/reject the request in the admin panel.</p>
        <br>
        <p>Best regards,<br>Your App System</p>
      `,
    };

    const result = await sgMail.send(msg);
    console.log('Registration notification sent successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending registration notification:', error);
    console.error('Error details:', error.response?.body || error.message);
    return NextResponse.json({
      error: 'Failed to send notification',
      details: error.message
    }, { status: 500 });
  }
}