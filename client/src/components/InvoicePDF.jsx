import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Définition de la couleur de marque
const BRAND_COLOR = '#177ab0';

// Création des styles avec StyleSheet.create
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 30,
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  companyInfoContainer: {
    flex: 1,
    marginLeft: 20,
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    color: BRAND_COLOR,
  },
  companyDetails: {
    fontSize: 9,
    marginBottom: 2,
    textAlign: 'right',
    color: '#4a5568',
  },
  invoiceTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
    marginBottom: 6,
  },
  invoiceDate: {
    color: '#4a5568',
    fontSize: 9,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  text: {
    color: '#4a5568',
    marginBottom: 4,
    fontSize: 9,
    lineHeight: 1.3,
  },
  recipientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipientInfo: {
    flex: 1,
  },
  shippingInfo: {
    flex: 1,
    marginLeft: 20,
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLOR,
    padding: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    textAlign: 'center',
    color: '#4a5568',
  },
  totalSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
    paddingRight: 15,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#4a5568',
    fontSize: 10,
    marginRight: 30,
  },
  totalAmount: {
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
    fontSize: 10,
    minWidth: 80,
    textAlign: 'right',
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e2e8f0',
  },
  grandTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#2d3748',
    fontSize: 12,
    marginRight: 30,
  },
  grandTotalAmount: {
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
    fontSize: 12,
    minWidth: 80,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#718096',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  footerText: {
    marginBottom: 3,
  },
  footerLink: {
    color: BRAND_COLOR,
    textDecoration: 'none',
  }
});

// Fonction de formatage de la devise
const formatCurrency = (amount, currency = 'XAF') => {
  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '').replace(/,/g, '.');

  return `${formattedNumber} FCFA`;
};

// Composant principal
const InvoicePDF = ({ data }) => {
  if (!data) return null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Contenu de la facture */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image 
                src="https://i.imgur.com/ZU2ZGQk.png"
                style={styles.logo}
              />
            </View>
            <View style={styles.companyInfoContainer}>
              <Text style={styles.companyName}>TWINSK COMPANY</Text>
              <Text style={styles.companyDetails}>506, Tongyue Building</Text>
              <Text style={styles.companyDetails}>No.7, Tongya East Street Xicha Road</Text>
              <Text style={styles.companyDetails}>Baiyun District, Guangzhou, China</Text>
              <Text style={styles.companyDetails}>Logistics@twinskcompanyltd.com</Text>
              <Text style={styles.companyDetails}>Address: Gabon Libreville</Text>
              <Text style={styles.companyDetails}>Tel: +8613928824921</Text>
            </View>
          </View>
          
          <View style={styles.invoiceTitle}>
            <View>
              <Text style={styles.title}>FACTURE #{data.tracking_number}</Text>
              <Text style={styles.invoiceDate}>
                Date d'émission : {format(new Date(data.created_at), 'dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.recipientSection}>
            <View style={styles.recipientInfo}>
              <Text style={styles.sectionTitle}>Destinataire</Text>
              <Text style={styles.text}>{data.recipient?.name}</Text>
              <Text style={styles.text}>{data.recipient?.phone}</Text>
              <Text style={styles.text}>{data.recipient?.address}</Text>
              <Text style={styles.text}>{data.recipient?.email}</Text>
            </View>
            <View style={styles.shippingInfo}>
              <Text style={styles.sectionTitle}>Expédition</Text>
              <Text style={styles.text}>Type: {data.shipping_type}</Text>
              <Text style={styles.text}>Destination: {data.destination_country}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du colis</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Description</Text>
              <Text style={styles.tableHeaderCell}>Type d'envoi</Text>
              <Text style={styles.tableHeaderCell}>Poids/Volume</Text>
              <Text style={styles.tableHeaderCell}>Prix</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Colis</Text>
              <Text style={styles.tableCell}>{data.shipping_type}</Text>
              <Text style={styles.tableCell}>
                {data.weight ? `${data.weight} kg` : `${data.cbm} m³`}
              </Text>
              <Text style={styles.tableCell}>
                {formatCurrency(data.total_price)}
              </Text>
            </View>
          </View>

          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalAmount}>{formatCurrency(data.total_price)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA (0%)</Text>
              <Text style={styles.totalAmount}>{formatCurrency(0)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalAmount}>{formatCurrency(data.total_price)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Please make all checks payable to TWINSK LOGISTICS.</Text>
          <Text style={styles.footerText}>Thanks for your business</Text>
          <Text style={styles.footerText}>
            <Text style={styles.footerLink}>Logistics@twinskcompanyltd.com</Text>
            {' | '}
            <Text style={styles.footerLink}>www.twinskcompanyltd.com</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
