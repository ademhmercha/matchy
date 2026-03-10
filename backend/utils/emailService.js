import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export async function sendVerificationEmail(to, token) {
    const link = `${FRONTEND_URL}/verify-email?token=${token}`;
    await resend.emails.send({
        from: FROM,
        to,
        subject: 'Matchy — Vérifiez votre adresse email',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#1a1a2e;color:#fff;border-radius:12px;">
                <h2 style="color:#e91e8c;margin-bottom:8px;">Bienvenue sur Matchy 💕</h2>
                <p style="color:#ccc;margin-bottom:24px;">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.</p>
                <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#9c27b0);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
                    Vérifier mon email
                </a>
                <p style="color:#888;margin-top:24px;font-size:13px;">Ce lien expire dans 1 heure. Si vous n'avez pas créé de compte, ignorez cet email.</p>
            </div>
        `,
    });
}

export async function sendPasswordResetEmail(to, token) {
    const link = `${FRONTEND_URL}/reset-password?token=${token}`;
    await resend.emails.send({
        from: FROM,
        to,
        subject: 'Matchy — Réinitialisation de mot de passe',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#1a1a2e;color:#fff;border-radius:12px;">
                <h2 style="color:#e91e8c;margin-bottom:8px;">Réinitialisation de mot de passe</h2>
                <p style="color:#ccc;margin-bottom:24px;">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable pendant 1 heure.</p>
                <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#9c27b0);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
                    Réinitialiser mon mot de passe
                </a>
                <p style="color:#888;margin-top:24px;font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            </div>
        `,
    });
}
