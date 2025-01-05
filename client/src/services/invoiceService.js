import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../config/supabaseClient';

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

const formatPrice = (amount, currency) => {
  if (!amount) return '-';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ' + currency;
};

const calculatePrice = async (parcel) => {
  if (!parcel.country || !parcel.shipping_type || !parcel.weight) {
    return {
      total: 0,
      formatted: '-',
      unitType: 'kg',
      currency: 'FCFA'
    };
  }

  // Récupérer la règle de prix
  const { data: rules, error: rulesError } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('country_code', parcel.country.toLowerCase())
    .eq('shipping_type', parcel.shipping_type.toLowerCase())
    .single();

  if (rulesError) throw rulesError;
  if (!rules) throw new Error('Aucune règle de tarification trouvée');

  // Calculer le prix total
  let totalPrice = 0;
  if (rules.unit_type === 'kg' && parcel.weight) {
    totalPrice = rules.price_per_unit * parseFloat(parcel.weight);
  } else if (rules.unit_type === 'cbm' && parcel.cbm) {
    totalPrice = rules.price_per_unit * parseFloat(parcel.cbm);
  }

  return {
    total: totalPrice,
    formatted: formatPrice(totalPrice, rules.currency),
    unitType: rules.unit_type,
    currency: rules.currency
  };
};

export const generateInvoice = async (parcel) => {
  // Calculer le prix
  const price = await calculatePrice(parcel);

  // Ajuster les dimensions en fonction de la taille de l'écran
  const getPageDimensions = () => {
    const isMobile = window.innerWidth < 768;
    return {
      orientation: isMobile ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
      margins: isMobile ? { top: 10, right: 10, bottom: 10, left: 10 } : { top: 20, right: 20, bottom: 20, left: 20 }
    };
  };

  const dimensions = getPageDimensions();
  const doc = new jsPDF({
    orientation: dimensions.orientation,
    unit: dimensions.unit,
    format: dimensions.format
  });

  // Ajuster les marges et les dimensions en fonction de l'écran
  const pageWidth = doc.internal.pageSize.width;
  const margins = dimensions.margins;
  const contentWidth = pageWidth - margins.left - margins.right;

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
  doc.roundedRect(15, sectionY - 5, contentWidth/2 - 5, sectionHeight, 3, 3, 'F');
  doc.roundedRect(contentWidth/2 + 5, sectionY - 5, contentWidth/2 - 10, sectionHeight, 3, 3, 'F');
  
  // Bandes colorées pour les sections
  // Simulation de dégradé vertical pour les bandes latérales
  const sectionSteps = 10;
  for (let i = 0; i < sectionSteps; i++) {
    const ratio = i / sectionSteps;
    const r = Math.floor(0 + (200 - 0) * ratio);
    const g = Math.floor(114 + (210 - 114) * ratio);
    const b = Math.floor(187 + (220 - 187) * ratio);
    doc.setFillColor(r, g, b);
    const stepHeight = sectionHeight / sectionSteps;
    doc.rect(15, sectionY - 5 + i * stepHeight, 2, stepHeight, 'F');
    doc.rect(contentWidth/2 + 5, sectionY - 5 + i * stepHeight, 2, stepHeight, 'F');
  }

  // En-têtes des sections
  doc.setFontSize(12);
  doc.setTextColor(0, 114, 187);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATAIRE', 20, sectionY);
  doc.text('EXPÉDITION', contentWidth/2 + 10, sectionY);

  // Informations du destinataire
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text(parcel.recipient_name || '', 20, sectionY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text([
    parcel.recipient_phone || '',
    parcel.recipient_address || '',
    (parcel.country || '').toUpperCase()
  ], 20, sectionY + 17);

  // Informations d'expédition
  doc.text([
    'Type d\'envoi: ' + (parcel.shipping_type || ''),
    'Poids: ' + (parcel.weight ? parcel.weight + ' kg' : ''),
    'Statut: ' + (parcel.status || ''),
    'Numéro de suivi: ' + (parcel.tracking_number || '')
  ], contentWidth/2 + 10, sectionY + 10);

  // Tableau des détails avec dimensions responsives
  const tableY = sectionY + sectionHeight + 20;
  const columnWidths = {
    description: contentWidth * 0.3,
    type: contentWidth * 0.25,
    weight: contentWidth * 0.2,
    price: contentWidth * 0.25
  };

  const tableData = [
    ['Description', 'Type d\'envoi', 'Poids/Volume', 'Prix'],
    [
      'Colis',
      parcel.shipping_type || 'Standard',
      `${parcel.weight || 0} ${price.unitType === 'kg' ? 'kg' : 'm³'}`,
      price.formatted
    ]
  ];

  doc.autoTable({
    startY: tableY,
    head: [tableData[0]],
    body: [tableData[1]],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 114, 187],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: window.innerWidth < 768 ? 8 : 10
    },
    styles: {
      font: 'helvetica',
      fontSize: window.innerWidth < 768 ? 8 : 10,
      cellPadding: window.innerWidth < 768 ? 3 : 5,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: columnWidths.description },
      1: { cellWidth: columnWidths.type, halign: 'center' },
      2: { cellWidth: columnWidths.weight, halign: 'center' },
      3: { cellWidth: columnWidths.price, halign: 'right' }
    },
    margin: margins
  });

  // Ajuster la position du total pour la version mobile
  const finalY = doc.previousAutoTable.finalY + (window.innerWidth < 768 ? 5 : 10);
  const rightColumnX = pageWidth - margins.right;

  // Sous-total
  doc.setFontSize(window.innerWidth < 768 ? 9 : 11);
  doc.setTextColor(70, 70, 70);
  doc.setFont('helvetica', 'bold');
  doc.text('Sous-total', rightColumnX - (window.innerWidth < 768 ? 60 : 90), finalY);
  doc.text(price.formatted, rightColumnX, finalY, { align: 'right' });

  // Total
  const totalY = finalY + (window.innerWidth < 768 ? 5 : 10);
  doc.setFontSize(window.innerWidth < 768 ? 10 : 12);
  doc.setTextColor(0, 114, 187);
  doc.text('Total', rightColumnX - (window.innerWidth < 768 ? 60 : 90), totalY);
  doc.text(price.formatted, rightColumnX, totalY, { align: 'right' });

  // Pied de page
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  
  // Fond gris clair pour le pied de page
  doc.setFillColor(247, 247, 247);
  doc.rect(0, footerY - 10, doc.internal.pageSize.width, 40, 'F');
  
  // Textes du pied de page
  const centerX = doc.internal.pageSize.width / 2;
  doc.text('Please make all checks payable to TWINSK LOGISTICS.', centerX, footerY, { align: 'center' });
  doc.text('Thanks for your business', centerX, footerY + 10, { align: 'center' });
  doc.text('Logistics@twinskcompanyltd.com | www.twinskcompanyltd.com', centerX, footerY + 20, { align: 'center' });

  return doc;
};
