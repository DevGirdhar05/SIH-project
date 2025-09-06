// Email notification service (mock implementation for development)
// In production, integrate with services like SendGrid, AWS SES, or Nodemailer

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface IssueEmailData {
  issueId: string;
  title: string;
  status: string;
  reporterEmail: string;
  assigneeEmail?: string;
}

class EmailService {
  private enabled = process.env.NODE_ENV !== 'development'; // Disable in dev

  async sendEmail(data: EmailData): Promise<boolean> {
    console.log(`📧 Email Notification (${this.enabled ? 'SENT' : 'MOCK'}):`);
    console.log(`To: ${data.to}`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Message: ${data.text}`);
    
    if (!this.enabled) {
      return true; // Mock success in development
    }

    // TODO: Implement actual email sending logic
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransporter({...});
    // await transporter.sendMail(data);
    
    return true;
  }

  async notifyIssueStatusUpdate(issue: IssueEmailData, oldStatus: string): Promise<void> {
    const statusMessages = {
      'SUBMITTED': 'Your issue has been submitted and is awaiting review.',
      'TRIAGED': 'Your issue has been reviewed and prioritized.',
      'ASSIGNED': 'Your issue has been assigned to a team member.',
      'IN_PROGRESS': 'Work has begun on resolving your issue.',
      'RESOLVED': 'Your issue has been resolved. Thank you for reporting it!',
      'REJECTED': 'Your issue has been reviewed and determined to not require action.'
    };

    const message = statusMessages[issue.status as keyof typeof statusMessages] || 
      `Your issue status has been updated to ${issue.status}.`;

    await this.sendEmail({
      to: issue.reporterEmail,
      subject: `CivicConnect: Issue #${issue.issueId} Status Update`,
      text: `Hello,\n\nYour issue "${issue.title}" has been updated.\n\nStatus: ${oldStatus} → ${issue.status}\n\n${message}\n\nView your issue: ${process.env.FRONTEND_URL || 'https://civicconnect.com'}/track\n\nBest regards,\nCivicConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Issue Status Update</h2>
          <p>Hello,</p>
          <p>Your issue "<strong>${issue.title}</strong>" has been updated.</p>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Status:</strong> ${oldStatus} → <span style="color: #16a34a; font-weight: bold;">${issue.status}</span></p>
          </div>
          <p>${message}</p>
          <div style="margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://civicconnect.com'}/track" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Your Issues
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>CivicConnect Team
          </p>
        </div>
      `
    });
  }

  async notifyIssueAssignment(issue: IssueEmailData): Promise<void> {
    if (!issue.assigneeEmail) return;

    await this.sendEmail({
      to: issue.assigneeEmail,
      subject: `CivicConnect: New Issue Assigned - #${issue.issueId}`,
      text: `Hello,\n\nA new issue has been assigned to you.\n\nTitle: ${issue.title}\nIssue ID: #${issue.issueId}\nStatus: ${issue.status}\n\nPlease review and take appropriate action.\n\nView issue: ${process.env.FRONTEND_URL || 'https://civicconnect.com'}/admin\n\nBest regards,\nCivicConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Issue Assignment</h2>
          <p>Hello,</p>
          <p>A new issue has been assigned to you.</p>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Title:</strong> ${issue.title}</p>
            <p><strong>Issue ID:</strong> #${issue.issueId}</p>
            <p><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">${issue.status}</span></p>
          </div>
          <p>Please review and take appropriate action.</p>
          <div style="margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://civicconnect.com'}/admin" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Issue
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>CivicConnect Team
          </p>
        </div>
      `
    });
  }

  async sendWeeklyDigest(userEmail: string, stats: any): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'CivicConnect: Weekly Summary',
      text: `Hello,\n\nHere's your weekly CivicConnect summary:\n\n- Total Issues: ${stats.total}\n- Resolved This Week: ${stats.resolved}\n- Pending Issues: ${stats.pending}\n\nThank you for helping improve our community!\n\nBest regards,\nCivicConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Weekly Summary</h2>
          <p>Hello,</p>
          <p>Here's your weekly CivicConnect summary:</p>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;">📊 <strong>Total Issues:</strong> ${stats.total}</li>
              <li style="margin: 8px 0;">✅ <strong>Resolved This Week:</strong> ${stats.resolved}</li>
              <li style="margin: 8px 0;">⏳ <strong>Pending Issues:</strong> ${stats.pending}</li>
            </ul>
          </div>
          <p>Thank you for helping improve our community!</p>
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>CivicConnect Team
          </p>
        </div>
      `
    });
  }
}

export const emailService = new EmailService();