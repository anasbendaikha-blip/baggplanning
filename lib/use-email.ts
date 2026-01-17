// Hook pour envoyer des emails depuis les composants React

type EmailType = 'reminder' | 'demande_approved' | 'demande_refused' | 'planning_published';

interface SendEmailParams {
  type: EmailType;
  to: string | string[];
  data: Record<string, string>;
}

export async function sendEmail({ type, to, data }: SendEmailParams) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        to: Array.isArray(to) ? to : [to],
        data: {
          ...data,
          appUrl: window.location.origin,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur envoi email');
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error };
  }
}

// Fonctions utilitaires pour chaque type d'email

export async function sendReminderEmail(email: string, prenom: string, semaine: string) {
  return sendEmail({
    type: 'reminder',
    to: email,
    data: { prenom, semaine },
  });
}

export async function sendDemandeApprovedEmail(
  email: string,
  prenom: string,
  typeDemande: string,
  date: string,
  creneau: string
) {
  return sendEmail({
    type: 'demande_approved',
    to: email,
    data: { prenom, typeDemande, date, creneau },
  });
}

export async function sendDemandeRefusedEmail(
  email: string,
  prenom: string,
  typeDemande: string,
  date: string
) {
  return sendEmail({
    type: 'demande_refused',
    to: email,
    data: { prenom, typeDemande, date },
  });
}

export async function sendPlanningPublishedEmail(emails: string[], semaine: string) {
  // Envoie à tous les employés
  const promises = emails.map((email) =>
    sendEmail({
      type: 'planning_published',
      to: email,
      data: { prenom: '', semaine }, // prenom sera ignoré ou générique
    })
  );
  return Promise.all(promises);
}