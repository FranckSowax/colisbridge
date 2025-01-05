import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatMontant = (montant) => {
  if (!montant) return '-';
  // Si le montant est déjà formaté (contient FCFA), on le retourne tel quel
  if (typeof montant === 'string' && montant.includes('FCFA')) {
    // Supprime les décimales et reformate
    return montant.replace(/\s+/g, '.')
                 .replace(/\.\d+\s/, ' ')
                 .replace('FCFA', ' FCFA');
  }
  // Sinon, on formate le nombre
  const nombre = montant.toString().replace(/[^0-9]/g, '');
  return nombre.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' FCFA';
};

export const generateInvoice = async (parcel, priceData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Chargement et ajout du logo
  const logoUrl = 'https://i.imgur.com/ZU2ZGQk.png';
  const logoResponse = await fetch(logoUrl);
  const logoBlob = await logoResponse.blob();
  const logoBase64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(logoBlob);
  });

  // Ajout du logo (étiré en largeur de 8%)
  doc.addImage(logoBase64, 'PNG', 20, 20, 43.2, 40); // 40 * 1.08 = 43.2

  // En-tête avec bande colorée
  // Simulation de dégradé avec plusieurs rectangles superposés
  const numSteps = 20;
  const bandWidth = 10;
  
  for (let i = 0; i < numSteps; i++) {
    const ratio = i / numSteps;
    const r = Math.floor(0 + (200 - 0) * ratio);
    const g = Math.floor(114 + (210 - 114) * ratio);
    const b = Math.floor(187 + (220 - 187) * ratio);
    doc.setFillColor(r, g, b);
    const stepHeight = doc.internal.pageSize.height / numSteps;
    doc.rect(0, i * stepHeight, bandWidth, stepHeight, 'F');
  }

  // Ajout de la police par défaut
  doc.setFont('helvetica');
  
  // En-tête - Informations de l'entreprise
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const companyInfo = [
    '506, Tongyue Building',
    'No.7, Tongya East Street Xicha Road',
    'Baiyun District, Guangzhou, China',
    'Logistics@twinskcompanyltd.com',
    'Address: Gabon Libreville',
    'Tel: +8613928824921'
  ];
  
  let yPos = 25;
  companyInfo.forEach(line => {
    doc.text(line, doc.internal.pageSize.width - 20, yPos, { align: 'right' });
    yPos += 5;
  });

  // Numéro de facture avec design moderne
  doc.setFillColor(247, 247, 247);
  doc.rect(15, 60, 180, 15, 'F');
  doc.setFontSize(20);
  doc.setTextColor(0, 114, 187);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE #' + parcel.tracking_number, 20, 71);
  
  // Date d'émission
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Date d\'émission : ' + format(new Date(parcel.created_at), 'dd MMMM yyyy', { locale: fr }), 20, 85);

  // Sections DESTINATAIRE et EXPÉDITION avec design moderne
  const sectionY = 100;
  const sectionHeight = 45;
  
  // Rectangles avec dégradé subtil
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15, sectionY - 5, doc.internal.pageSize.width/2 - 25, sectionHeight, 3, 3, 'F');
  doc.roundedRect(doc.internal.pageSize.width/2 + 5, sectionY - 5, doc.internal.pageSize.width/2 - 20, sectionHeight, 3, 3, 'F');
  
  // Bandes colorées pour les sections
  // Simulation de dégradé vertical pour les bandes latérales
  const sectionSteps = 10;
  const sectionBandWidth = 5;
  
  for (let i = 0; i < sectionSteps; i++) {
    const ratio = i / sectionSteps;
    const r = Math.floor(0 + (200 - 0) * ratio);
    const g = Math.floor(114 + (210 - 114) * ratio);
    const b = Math.floor(187 + (220 - 187) * ratio);
    doc.setFillColor(r, g, b);
    const stepHeight = sectionHeight / sectionSteps;
    
    // Bande gauche
    doc.rect(15, sectionY - 5 + (i * stepHeight), sectionBandWidth, stepHeight, 'F');
    // Bande droite
    doc.rect(doc.internal.pageSize.width/2 + 5, sectionY - 5 + (i * stepHeight), sectionBandWidth, stepHeight, 'F');
  }

  // Section DESTINATAIRE
  doc.setFontSize(14);
  doc.setTextColor(0, 114, 187);
  doc.text('DESTINATAIRE', 25, sectionY);
  
  // Nom du destinataire en gras
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.setFont('helvetica', 'bold');
  doc.text(parcel.recipient_name, 25, sectionY + 10);
  
  // Autres informations du destinataire
  doc.setFont('helvetica', 'normal');
  const destinataireInfo = [
    parcel.recipient_phone,
    parcel.recipient_email
  ].filter(Boolean);
  
  destinataireInfo.forEach((info, index) => {
    doc.text(info, 25, sectionY + 17 + (index * 7));
  });

  // Section EXPÉDITION
  doc.setFontSize(14);
  doc.setTextColor(0, 114, 187);
  doc.text('EXPÉDITION', doc.internal.pageSize.width / 2 + 15, sectionY);
  
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text([
    'Type: ' + parcel.shipping_type,
    'Destination: ' + parcel.country.toUpperCase()
  ], doc.internal.pageSize.width / 2 + 15, sectionY + 10);

  // Section DÉTAILS DU COLIS avec design moderne
  doc.setFillColor(247, 247, 247);
  doc.roundedRect(15, sectionY + 45, doc.internal.pageSize.width - 30, 10, 2, 2, 'F');
  doc.setFontSize(14);
  doc.setTextColor(0, 114, 187);
  doc.text('DÉTAILS DU COLIS', 20, sectionY + 52);

  // Tableau des détails avec style moderne
  doc.autoTable({
    startY: sectionY + 60,
    head: [[
      'Description',
      'Type d\'envoi',
      'Poids/Volume',
      'Prix'
    ]],
    body: [[
      'Colis',
      parcel.shipping_type,
      parcel.weight + ' kg',
      priceData?.total + ' FCFA'
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 114, 187],
      textColor: 255,
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 11,
      textColor: [70, 70, 70],
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' }
    },
    margin: { left: 20, right: 20 },
    styles: {
      cellPadding: 8
    }
  });

  // Section totaux avec design moderne
  const finalY = doc.lastAutoTable.finalY + 10;
  const totalsStartX = doc.internal.pageSize.width - 120;
  const totalsWidth = 100;
  const totalsHeight = 50;
  const totalsY = finalY - 5;
  
  // Rectangle principal avec coins arrondis
  doc.setFillColor(247, 247, 247);
  doc.roundedRect(totalsStartX, totalsY, totalsWidth, totalsHeight, 3, 3, 'F');
  
  // Bande colorée à droite des totaux
  // Simulation de dégradé pour la bande des totaux
  const totalsSteps = 10;
  const totalsBandWidth = 5;
  
  for (let i = 0; i < totalsSteps; i++) {
    const ratio = i / totalsSteps;
    const r = Math.floor(0 + (200 - 0) * ratio);
    const g = Math.floor(114 + (210 - 114) * ratio);
    const b = Math.floor(187 + (220 - 187) * ratio);
    doc.setFillColor(r, g, b);
    const stepHeight = totalsHeight / totalsSteps;
    doc.rect(totalsStartX + totalsWidth - totalsBandWidth, totalsY + (i * stepHeight), totalsBandWidth, stepHeight, 'F');
  }

  // Sous-total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text('Sous-total', totalsStartX + 10, totalsY + 20);
  doc.text(priceData?.total + ' FCFA', totalsStartX + totalsWidth - 15, totalsY + 20, { align: 'right' });
  
  // Total avec style moderne
  doc.setFontSize(14);
  doc.setTextColor(0, 114, 187);
  doc.text('Total', totalsStartX + 10, totalsY + 40);
  doc.text(priceData?.total + ' FCFA', totalsStartX + totalsWidth - 15, totalsY + 40, { align: 'right' });

  // Pied de page moderne avec meilleur centrage vertical
  const footerY = doc.internal.pageSize.height - 20;
  const footerHeight = 35;
  const footerStartY = footerY - 15;
  
  // Fond gris du pied de page
  doc.setFillColor(247, 247, 247);
  doc.rect(0, footerStartY, doc.internal.pageSize.width, footerHeight, 'F');
  
  // Textes centrés verticalement dans la bande grise
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Please make all checks payable to TWINSK LOGISTICS.', doc.internal.pageSize.width / 2, footerStartY + footerHeight/2 - 10, { align: 'center' });
  doc.text('Thanks for your business', doc.internal.pageSize.width / 2, footerStartY + footerHeight/2, { align: 'center' });
  doc.text(['Logistics@twinskcompanyltd.com | www.twinskcompanyltd.com'], doc.internal.pageSize.width / 2, footerStartY + footerHeight/2 + 10, { align: 'center' });

  // Téléchargement du PDF
  doc.save(`facture-${parcel.tracking_number}.pdf`);
};
