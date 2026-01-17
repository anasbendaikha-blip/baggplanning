import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Employee {
  id: number;
  prenom: string;
  nom: string;
  role: string;
}

interface Planning {
  id: number;
  employee_id: number;
  date: string;
  debut: string;
  fin: string;
  employees?: Employee;
}

interface ExportPlanningOptions {
  planning: Planning[];
  semaineDebut: string;
  pharmacieName?: string;
}

export function exportPlanningToPDF({ planning, semaineDebut, pharmacieName = 'Pharmacie' }: ExportPlanningOptions) {
  // Créer le document PDF (format A4 paysage pour plus d'espace)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Couleurs
  const primaryColor: [number, number, number] = [16, 185, 129]; // #10b981
  const darkColor: [number, number, number] = [30, 41, 59]; // #1e293b
  const grayColor: [number, number, number] = [100, 116, 139]; // #64748b

  // Header avec bandeau vert
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');

  // Logo texte
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('📅 BaggPlanning', 15, 16);

  // Nom de la pharmacie
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(pharmacieName, pageWidth - 15, 16, { align: 'right' });

  // Titre du planning
  const semaineDate = new Date(semaineDebut);
  const semaineFinDate = new Date(semaineDebut);
  semaineFinDate.setDate(semaineFinDate.getDate() + 5);

  const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });

  doc.setTextColor(...darkColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Planning du ${formatDate(semaineDate)} au ${formatDate(semaineFinDate)} ${semaineDate.getFullYear()}`,
    pageWidth / 2,
    38,
    { align: 'center' }
  );

  // Préparer les données du tableau
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Organiser le planning par jour
  const planningParJour: { [key: string]: Planning[] } = {};
  jours.forEach((_, index) => {
    const date = new Date(semaineDebut);
    date.setDate(date.getDate() + index);
    const dateStr = date.toISOString().split('T')[0];
    planningParJour[dateStr] = planning.filter(p => p.date === dateStr);
  });

  // Créer les en-têtes avec les dates
  const headers = jours.map((jour, index) => {
    const date = new Date(semaineDebut);
    date.setDate(date.getDate() + index);
    return `${jour}\n${date.getDate()}/${date.getMonth() + 1}`;
  });

  // Trouver le nombre max d'employés par jour pour dimensionner le tableau
  const maxEmployeesPerDay = Math.max(
    ...Object.values(planningParJour).map(p => p.length),
    1
  );

  // Section MATIN
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('🌅 MATIN (8h30 - 14h00)', 15, 50);

  // Données matin
  const matinData: string[][] = [];
  for (let row = 0; row < Math.max(maxEmployeesPerDay, 4); row++) {
    const rowData: string[] = [];
    jours.forEach((_, index) => {
      const date = new Date(semaineDebut);
      date.setDate(date.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      const jourPlanning = planningParJour[dateStr] || [];
      
      // Filtrer les employés du matin (début avant 14h)
      const matinEmployees = jourPlanning.filter(p => {
        const [h] = p.debut.split(':').map(Number);
        return h < 14;
      });

      if (matinEmployees[row]) {
        const p = matinEmployees[row];
        const nom = p.employees ? `${p.employees.prenom} ${p.employees.nom?.[0] || ''}.` : 'N/A';
        const role = p.employees?.role === 'Pharmacien' ? '💊' : 
                     p.employees?.role === 'Preparateur' ? '💉' : 
                     p.employees?.role === 'Etudiant' ? '🎓' : '📚';
        rowData.push(`${role} ${nom}\n${p.debut.slice(0,5)}-${p.fin.slice(0,5)}`);
      } else {
        rowData.push('');
      }
    });
    matinData.push(rowData);
  }

  autoTable(doc, {
    startY: 54,
    head: [headers],
    body: matinData,
    theme: 'grid',
    headStyles: {
      fillColor: [251, 191, 36], // Jaune matin
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 12,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
  });

  // Section APRÈS-MIDI
  const afterMatinY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('🌆 APRÈS-MIDI (14h00 - 20h30)', 15, afterMatinY);

  // Données après-midi
  const apremData: string[][] = [];
  for (let row = 0; row < Math.max(maxEmployeesPerDay, 4); row++) {
    const rowData: string[] = [];
    jours.forEach((_, index) => {
      const date = new Date(semaineDebut);
      date.setDate(date.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      const jourPlanning = planningParJour[dateStr] || [];
      
      // Filtrer les employés de l'après-midi (fin après 14h)
      const apremEmployees = jourPlanning.filter(p => {
        const [h] = p.fin.split(':').map(Number);
        return h >= 14;
      });

      if (apremEmployees[row]) {
        const p = apremEmployees[row];
        const nom = p.employees ? `${p.employees.prenom} ${p.employees.nom?.[0] || ''}.` : 'N/A';
        const role = p.employees?.role === 'Pharmacien' ? '💊' : 
                     p.employees?.role === 'Preparateur' ? '💉' : 
                     p.employees?.role === 'Etudiant' ? '🎓' : '📚';
        rowData.push(`${role} ${nom}\n${p.debut.slice(0,5)}-${p.fin.slice(0,5)}`);
      } else {
        rowData.push('');
      }
    });
    apremData.push(rowData);
  }

  autoTable(doc, {
    startY: afterMatinY + 4,
    head: [headers],
    body: apremData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // Bleu après-midi
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 12,
    },
    margin: { left: 15, right: 15 },
  });

  // Légende
  const afterApremY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Légende : 💊 Pharmacien   💉 Préparateur   🎓 Étudiant   📚 Apprenti', 15, afterApremY);

  // Footer
  doc.setFontSize(8);
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - BaggPlanning`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Télécharger le PDF
  const fileName = `planning-${semaineDebut}.pdf`;
  doc.save(fileName);

  return fileName;
}

// Fonction pour exporter les disponibilités en PDF
export function exportDisponibilitesToPDF(
  disponibilites: any[],
  employees: any[],
  semaineDebut: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('📅 BaggPlanning - Disponibilités', 15, 16);

  // Titre
  const semaineDate = new Date(semaineDebut);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.text(
    `Semaine du ${semaineDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageWidth / 2,
    38,
    { align: 'center' }
  );

  // Préparer les données
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const headers = ['Étudiant', ...jours];

  const etudiants = employees.filter(e => e.role === 'Etudiant');
  
  const bodyData = etudiants.map(etudiant => {
    const dispo = disponibilites.find(d => d.employee_id === etudiant.id);
    const row = [`${etudiant.prenom} ${etudiant.nom?.[0] || ''}.`];
    
    jours.forEach((_, i) => {
      const jourKey = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][i];
      if (!dispo) {
        row.push('⏳');
      } else if (!dispo[`${jourKey}_disponible`]) {
        row.push('❌');
      } else {
        const debut = dispo[`${jourKey}_debut`]?.slice(0, 5) || '';
        const fin = dispo[`${jourKey}_fin`]?.slice(0, 5) || '';
        row.push(debut && fin ? `${debut}-${fin}` : '✅');
      }
    });
    
    return row;
  });

  autoTable(doc, {
    startY: 45,
    head: [headers],
    body: bodyData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 },
  });

  // Légende
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Légende : ✅ Disponible   ❌ Non disponible   ⏳ En attente de réponse', 15, finalY);

  const fileName = `disponibilites-${semaineDebut}.pdf`;
  doc.save(fileName);

  return fileName;
}