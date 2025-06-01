<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Templates Collection</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .templates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .template-card {
            background: white;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .template-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .template-icon {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        
        .verify-icon { background: #10b981; color: white; }
        .password-icon { background: #f59e0b; color: white; }
        .invite-icon { background: #3b82f6; color: white; }
        .welcome-icon { background: #8b5cf6; color: white; }
        .reset-icon { background: #ef4444; color: white; }
        
        .email-preview {
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background: #f9fafb;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .email-header {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
            font-size: 12px;
            color: #6b7280;
        }
        
        .email-body {
            color: #374151;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 15px 0;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .code-block {
            background: #1f2937;
            color: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin-top: 15px;
            overflow-x: auto;
        }
        
        .copy-button {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background 0.2s ease;
        }
        
        .copy-button:hover {
            background: #4338ca;
        }
        
        .features {
            background: rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 30px;
            margin-top: 40px;
            color: white;
        }
        
        .features h3 {
            font-size: 1.5rem;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .features-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .feature-icon {
            width: 20px;
            height: 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Professional Email Templates</h1>
            <p>Ready-to-use, responsive email templates for your application</p>
        </div>
        
        <div class="templates-grid">
            <!-- Email Verification Template -->
            <div class="template-card">
                <div class="template-title">
                    <div class="template-icon verify-icon">✓</div>
                    Email Verification
                </div>
                <div class="email-preview">
                    <div class="email-header">
                        <strong>From:</strong> noreply@yourapp.com<br>
                        <strong>Subject:</strong> Verify Your Email Address
                    </div>
                    <div class="email-body">
                        <h2 style="color: #2d3748; margin-bottom: 15px;">Welcome to [App Name]!</h2>
                        <p>Hi [User Name],</p>
                        <p>Thanks for signing up! To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
                        <a href="#" class="cta-button">Verify Email Address</a>
                        <p><small>This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</small></p>
                        <p>Best regards,<br>The [App Name] Team</p>
                    </div>
                </div>
                <button class="copy-button" onclick="copyTemplate('verification')">Copy HTML Code</button>
            </div>
            
            <!-- Password Reset Template -->
            <div class="template-card">
                <div class="template-title">
                    <div class="template-icon password-icon">🔑</div>
                    Password Reset
                </div>
                <div class="email-preview">
                    <div class="email-header">
                        <strong>From:</strong> noreply@yourapp.com<br>
                        <strong>Subject:</strong> Reset Your Password
                    </div>
                    <div class="email-body">
                        <h2 style="color: #2d3748; margin-bottom: 15px;">Password Reset Request</h2>
                        <p>Hi [User Name],</p>
                        <p>We received a request to reset your password. If you made this request, click the button below to create a new password:</p>
                        <a href="#" class="cta-button">Reset Password</a>
                        <p><small>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</small></p>
                        <p>Best regards,<br>The [App Name] Team</p>
                    </div>
                </div>
                <button class="copy-button" onclick="copyTemplate('password')">Copy HTML Code</button>
            </div>
            
            <!-- User Invitation Template -->
            <div class="template-card">
                <div class="template-title">
                    <div class="template-icon invite-icon">👥</div>
                    User Invitation
                </div>
                <div class="email-preview">
                    <div class="email-header">
                        <strong>From:</strong> noreply@yourapp.com<br>
                        <strong>Subject:</strong> You've been invited to join [App Name]
                    </div>
                    <div class="email-body">
                        <h2 style="color: #2d3748; margin-bottom: 15px;">You're Invited!</h2>
                        <p>Hi [Invitee Name],</p>
                        <p>[Inviter Name] has invited you to join [App Name]. Click the button below to accept the invitation and create your account:</p>
                        <a href="#" class="cta-button">Accept Invitation</a>
                        <p><small>This invitation will expire in 7 days. If you don't know [Inviter Name], you can safely ignore this email.</small></p>
                        <p>Best regards,<br>The [App Name] Team</p>
                    </div>
                </div>
                <button class="copy-button" onclick="copyTemplate('invitation')">Copy HTML Code</button>
            </div>
            
            <!-- Welcome Email Template -->
            <div class="template-card">
                <div class="template-title">
                    <div class="template-icon welcome-icon">🎉</div>
                    Welcome Email
                </div>
                <div class="email-preview">
                    <div class="email-header">
                        <strong>From:</strong> noreply@yourapp.com<br>
                        <strong>Subject:</strong> Welcome to [App Name]!
                    </div>
                    <div class="email-body">
                        <h2 style="color: #2d3748; margin-bottom: 15px;">Welcome aboard, [User Name]!</h2>
                        <p>We're thrilled to have you join [App Name]. Your account is now active and ready to use.</p>
                        <p>Here's what you can do next:</p>
                        <ul>
                            <li>Complete your profile</li>
                            <li>Explore our features</li>
                            <li>Connect with other users</li>
                        </ul>
                        <a href="#" class="cta-button">Get Started</a>
                        <p>If you have any questions, feel free to reach out to our support team.</p>
                        <p>Best regards,<br>The [App Name] Team</p>
                    </div>
                </div>
                <button class="copy-button" onclick="copyTemplate('welcome')">Copy HTML Code</button>
            </div>
            
            <!-- Account Security Alert Template -->
            <div class="template-card">
                <div class="template-title">
                    <div class="template-icon reset-icon">🔒</div>
                    Security Alert
                </div>
                <div class="email-preview">
                    <div class="email-header">
                        <strong>From:</strong> security@yourapp.com<br>
                        <strong>Subject:</strong> Security Alert: New Login Detected
                    </div>
                    <div class="email-body">
                        <h2 style="color: #2d3748; margin-bottom: 15px;">Security Alert</h2>
                        <p>Hi [User Name],</p>
                        <p>We detected a new login to your account from:</p>
                        <ul>
                            <li><strong>Location:</strong> [City, Country]</li>
                            <li><strong>Device:</strong> [Device Type]</li>
                            <li><strong>Time:</strong> [Timestamp]</li>
                        </ul>
                        <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately:</p>
                        <a href="#" class="cta-button">Secure My Account</a>
                        <p>Best regards,<br>The [App Name] Security Team</p>
                    </div>
                </div>
                <button class="copy-button" onclick="copyTemplate('security')">Copy HTML Code</button>
            </div>
            
            <!-- Payment Receipt Template -->
            <div class="template-card">
                <div class="template-title">
                    <div class="template-icon" style="background: #059669; color: white;">💳</div>
                    Payment Receipt
                </div>
                <div class="email-preview">
                    <div class="email-header">
                        <strong>From:</strong> billing@yourapp.com<br>
                        <strong>Subject:</strong> Payment Receipt - [Invoice #12345]
                    </div>
                    <div class="email-body">
                        <h2 style="color: #2d3748; margin-bottom: 15px;">Payment Received</h2>
                        <p>Hi [User Name],</p>
                        <p>Thank you for your payment. Here are the details:</p>
                        <ul>
                            <li><strong>Amount:</strong> $[Amount]</li>
                            <li><strong>Plan:</strong> [Plan Name]</li>
                            <li><strong>Billing Period:</strong> [Period]</li>
                            <li><strong>Payment Method:</strong> [Method]</li>
                        </ul>
                        <a href="#" class="cta-button">View Invoice</a>
                        <p>Your subscription is now active. If you have any questions about your billing, please contact our support team.</p>
                        <p>Best regards,<br>The [App Name] Team</p>
                    </div>
                </div>
                <button class="copy-button" onclick="copyTemplate('receipt')">Copy HTML Code</button>
            </div>
        </div>
        
        <div class="features">
            <h3>Template Features</h3>
            <div class="features-list">
                <div class="feature-item">
                    <div class="feature-icon">📱</div>
                    <span>Mobile Responsive</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎨</div>
                    <span>Professional Design</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <span>Fast Loading</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🔧</div>
                    <span>Easy Customization</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">✉️</div>
                    <span>Email Client Compatible</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🌐</div>
                    <span>Cross-Platform</span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const templates = {
            verification: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        @media (max-width: 600px) { .container { padding: 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">[App Name]</div>
        </div>
        <h2>Welcome to [App Name]!</h2>
        <p>Hi [User Name],</p>
        <p>Thanks for signing up! To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
        <a href="[VERIFICATION_URL]" class="button">Verify Email Address</a>
        <p><small>This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</small></p>
        <div class="footer">
            <p>Best regards,<br>The [App Name] Team</p>
            <p>[Company Address] | [Company Phone] | [Company Email]</p>
        </div>
    </div>
</body>
</html>`,
            
            password: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        @media (max-width: 600px) { .container { padding: 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">[App Name]</div>
        </div>
        <h2>Password Reset Request</h2>
        <p>Hi [User Name],</p>
        <p>We received a request to reset your password. If you made this request, click the button below to create a new password:</p>
        <a href="[RESET_URL]" class="button">Reset Password</a>
        <p><small>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</small></p>
        <div class="footer">
            <p>Best regards,<br>The [App Name] Team</p>
            <p>[Company Address] | [Company Phone] | [Company Email]</p>
        </div>
    </div>
</body>
</html>`,
            
            invitation: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited!</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        @media (max-width: 600px) { .container { padding: 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">[App Name]</div>
        </div>
        <h2>You're Invited!</h2>
        <p>Hi [Invitee Name],</p>
        <p>[Inviter Name] has invited you to join [App Name]. Click the button below to accept the invitation and create your account:</p>
        <a href="[INVITATION_URL]" class="button">Accept Invitation</a>
        <p><small>This invitation will expire in 7 days. If you don't know [Inviter Name], you can safely ignore this email.</small></p>
        <div class="footer">
            <p>Best regards,<br>The [App Name] Team</p>
            <p>[Company Address] | [Company Phone] | [Company Email]</p>
        </div>
    </div>
</body>
</html>`,
            
            welcome: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome!</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        @media (max-width: 600px) { .container { padding: 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">[App Name]</div>
        </div>
        <h2>Welcome aboard, [User Name]!</h2>
        <p>We're thrilled to have you join [App Name]. Your account is now active and ready to use.</p>
        <p>Here's what you can do next:</p>
        <ul>
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Connect with other users</li>
        </ul>
        <a href="[DASHBOARD_URL]" class="button">Get Started</a>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <div class="footer">
            <p>Best regards,<br>The [App Name] Team</p>
            <p>[Company Address] | [Company Phone] | [Company Email]</p>
        </div>
    </div>
</body>
</html>`,
            
            security: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
        @media (max-width: 600px) { .container { padding: 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">[App Name]</div>
        </div>
        <div class="alert-box">
            <h2 style="margin-top: 0; color: #dc2626;">Security Alert</h2>
        </div>
        <p>Hi [User Name],</p>
        <p>We detected a new login to your account from:</p>
        <ul>
            <li><strong>Location:</strong> [City, Country]</li>
            <li><strong>Device:</strong> [Device Type]</li>
            <li><strong>Time:</strong> [Timestamp]</li>
        </ul>
        <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately:</p>
        <a href="[SECURITY_URL]" class="button">Secure My Account</a>
        <div class="footer">
            <p>Best regards,<br>The [App Name] Security Team</p>
            <p>[Company Address] | [Company Phone] | [Company Email]</p>
        </div>
    </div>
</body>
</html>`,
            
            receipt: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        .receipt-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 6px; margin: 15px 0; }
        @media (max-width: 600px) { .container { padding: 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">[App Name]</div>
        </div>
        <h2>Payment Received</h2>
        <p>Hi [User Name],</p>
        <p>Thank you for your payment. Here are the details:</p>
        <div class="receipt-box">
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Amount:</strong> $[Amount]</li>
                <li><strong>Plan:</strong> [Plan Name]</li>
                <li><strong>Billing Period:</strong> [Period]</li>
                <li><strong>Payment Method:</strong> [Method]</li>
                <li><strong>Transaction ID:</strong> [Transaction ID]</li>
            </ul>
        </div>
        <a href="[INVOICE_URL
