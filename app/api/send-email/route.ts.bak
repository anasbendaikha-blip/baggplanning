import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email "from" - utilise le domaine Resend par défaut pour commencer
const FROM_EMAIL = 'BaggPlanning <onboarding@resend.dev>';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    let subject = '';
    let html = '';

    switch (type) {
      // Rappel de deadline pour les disponibilités
      case 'reminder':
        subject = '⏰ Rappel : Remplis tes disponibilités avant ce soir 20h !';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📅 BaggPlanning</h1>
            </div>
            <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0;">Salut ${data.prenom} ! 👋</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Tu n'as pas encore rempli tes disponibilités pour la semaine du <strong>${data.semaine}</strong>.
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                ⏰ <strong>Deadline : ce soir à 20h !</strong>
              </p>
              <a href="${data.appUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                ✋ Remplir mes disponibilités
              </a>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 32px;">
                Merci pour ta réactivité ! 🙏
              </p>
            </div>
          </div>
        `;
        break;

      // Confirmation demande approuvée
      case 'demande_approved':
        subject = '✅ Ta demande a été approuvée !';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Demande approuvée</h1>
            </div>
            <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0;">Bonne nouvelle ${data.prenom} ! 🎉</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Ta demande de <strong>${data.typeDemande}</strong> pour le <strong>${data.date}</strong> a été <span style="color: #10b981; font-weight: 600;">approuvée</span>.
              </p>
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-top: 16px;">
                <p style="color: #065f46; margin: 0;">
                  📅 Date : ${data.date}<br>
                  🕐 Créneau : ${data.creneau}
                </p>
              </div>
              <a href="${data.appUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 24px;">
                📅 Voir mon planning
              </a>
            </div>
          </div>
        `;
        break;

      // Demande refusée
      case 'demande_refused':
        subject = '❌ Ta demande n\'a pas pu être acceptée';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">❌ Demande refusée</h1>
            </div>
            <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0;">Désolé ${data.prenom} 😕</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Ta demande de <strong>${data.typeDemande}</strong> pour le <strong>${data.date}</strong> n'a pas pu être acceptée.
              </p>
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin-top: 16px;">
                <p style="color: #991b1b; margin: 0;">
                  N'hésite pas à contacter le titulaire pour plus d'informations.
                </p>
              </div>
              <a href="${data.appUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 24px;">
                📝 Faire une nouvelle demande
              </a>
            </div>
          </div>
        `;
        break;

      // Planning publié
      case 'planning_published':
        subject = '📅 Le planning de la semaine est disponible !';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 24px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📅 Planning publié !</h1>
            </div>
            <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0;">Salut ${data.prenom} ! 👋</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Le planning de la semaine du <strong>${data.semaine}</strong> vient d'être publié.
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Connecte-toi pour voir tes horaires !
              </p>
              <a href="${data.appUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                👀 Voir mon planning
              </a>
            </div>
          </div>
        `;
        break;

      default:
        return NextResponse.json({ error: 'Type d\'email inconnu' }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: html,
    });

    return NextResponse.json({ success: true, id: result.data?.id });

  } catch (error) {
    console.error('Erreur envoi email:', error);
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
  }
}