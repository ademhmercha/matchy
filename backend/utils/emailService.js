import * as Brevo from '@getbrevo/brevo';

const getClient = () => {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
    return apiInstance;
};

const FROM_EMAIL = () => process.env.FROM_EMAIL || 'ademhmerchaaa@gmail.com';
const FROM_NAME = 'Amorino';
const FRONTEND = () => process.env.FRONTEND_URL || 'http://localhost:5173';

async function sendEmail(to, subject, html) {
    const client = getClient();
    const email = new Brevo.SendSmtpEmail();
    email.sender = { name: FROM_NAME, email: FROM_EMAIL() };
    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = html;

    try {
        const result = await client.sendTransacEmail(email);
        console.log(`[Brevo] Email sent to ${to} — id: ${result.body?.messageId}`);
        return result;
    } catch (error) {
        console.error(`[Brevo] Failed to send to ${to}:`, error?.response?.body || error.message);
        throw new Error(error?.response?.body?.message || 'Email send failed');
    }
}

export async function sendVerificationEmail(to, token) {
    const link = `${FRONTEND()}/verify-email?token=${token}`;
    return sendEmail(to, 'Amorino — Vérifiez votre adresse email', `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#1a1a2e;color:#fff;border-radius:12px;">
            <h2 style="color:#e91e8c;margin-bottom:8px;">Bienvenue sur Amorino 💕</h2>
            <p style="color:#ccc;margin-bottom:24px;">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.</p>
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#9c27b0);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Vérifier mon email
            </a>
            <p style="color:#888;margin-top:24px;font-size:13px;">Ce lien expire dans 1 heure. Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
    `);
}

export async function sendPasswordResetEmail(to, token) {
    const link = `${FRONTEND()}/reset-password?token=${token}`;
    return sendEmail(to, 'Amorino — Réinitialisation de mot de passe', `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#1a1a2e;color:#fff;border-radius:12px;">
            <h2 style="color:#e91e8c;margin-bottom:8px;">Réinitialisation de mot de passe</h2>
            <p style="color:#ccc;margin-bottom:24px;">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable pendant 1 heure.</p>
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#9c27b0);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Réinitialiser mon mot de passe
            </a>
            <p style="color:#888;margin-top:24px;font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
    `);
}
