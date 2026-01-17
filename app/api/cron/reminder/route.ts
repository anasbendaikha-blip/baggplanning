import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Client Supabase avec la clé service (accès admin)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé service pour accès admin
);

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'BaggPlanning <onboarding@resend.dev>';

// Cette route est appelée par le cron Vercel chaque dimanche à 14h
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret pour sécuriser l'endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Calculer le lundi de la semaine prochaine
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const semaineDebut = nextMonday.toISOString().split('T')[0];

    // Récupérer tous les étudiants
    const { data: etudiants, error: etudiantsError } = await supabase
      .from('employees')
      .select('id, prenom, nom, email')
      .eq('role', 'Etudiant');

    if (etudiantsError) {
      console.error('Erreur récupération étudiants:', etudiantsError);
      return NextResponse.json({ error: 'Erreur BDD' }, { status: 500 });
    }

    // Récupérer les disponibilités déjà remplies pour cette semaine
    const { data: disponibilites, error: dispoError } = await supabase
      .from('disponibilites')
      .select('employee_id')
      .eq('semaine_debut', semaineDebut);

    if (dispoError) {
      console.error('Erreur récupération disponibilités:', dispoError);
      return NextResponse.json({ error: 'Erreur BDD' }, { status: 500 });
    }

    // Trouver les étudiants qui n'ont pas encore rempli
    const employeeIdsWithDispo = new Set(disponibilites?.map(d => d.employee_id) || []);
    const etudiantsSansReponse = etudiants?.filter(e => !employeeIdsWithDispo.has(e.id)) || [];

    if (etudiantsSansReponse.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tous les étudiants ont répondu !',
        emailsSent: 0 
      });
    }

    // Formater la date de la semaine
    const semaineFormatted = new Date(semaineDebut).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://baggplanning-app-beige.vercel.app';

    // Envoyer les emails de rappel
    const emailPromises = etudiantsSansReponse
      .filter(e => e.email) // Seulement ceux avec un email
      .map(async (etudiant) => {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📅 BaggPlanning</h1>
            </div>
            <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0;">Salut ${etudiant.prenom} ! 👋</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Tu n'as pas encore rempli tes disponibilités pour la semaine du <strong>${semaineFormatted}</strong>.
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                ⏰ <strong>Deadline : ce soir à 20h !</strong>
              </p>
              <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                ✋ Remplir mes disponibilités
              </a>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 32px;">
                Merci pour ta réactivité ! 🙏
              </p>
            </div>
          </div>
        `;

        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: etudiant.email,
            subject: '⏰ Rappel : Remplis tes disponibilités avant ce soir 20h !',
            html: html,
          });
          return { success: true, email: etudiant.email };
        } catch (error) {
          console.error(`Erreur envoi email à ${etudiant.email}:`, error);
          return { success: false, email: etudiant.email, error };
        }
      });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Rappels envoyés`,
      emailsSent: successCount,
      totalStudentsWithoutResponse: etudiantsSansReponse.length,
      semaine: semaineDebut,
    });

  } catch (error) {
    console.error('Erreur cron rappel:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}