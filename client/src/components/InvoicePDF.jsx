import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../config/supabaseClient';

// Création des styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
    fontSize: 12,
  },
  header: {
    marginBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoContainer: {
    width: 100,
  },
  logo: {
    width: '100%',
    maxHeight: 80,
  },
  companyInfoContainer: {
    flex: 1,
    marginLeft: 40,
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'right',
  },
  invoiceTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 5,
  },
  invoiceDate: {
    color: '#4B5563',
    fontSize: 10,
  },
  section: {
    marginBottom: 40,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  text: {
    color: '#4B5563',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
  },
  centerText: {
    textAlign: 'center',
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    color: '#ffffff',
    padding: 10,
    fontSize: 12,
    fontWeight: 'bold',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  tableHeaderCell: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
    padding: 10,
  },
  tableCell: {
    flex: 1,
  },
  total: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  finalTotal: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: '#111827',
  },
  totalAmount: {
    fontSize: 14,
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 10,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 2,
  },
  highlight: {
    color: '#4F46E5',
  }
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const InvoicePDF = ({ data }) => {
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    const fetchAndConvertImage = async () => {
      try {
        const response = await fetch('https://ayxltzvmpqxtyfvfotxd.supabase.co/storage/v1/object/public/company-assets/twinsk-logo.png');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error fetching logo:', error);
        return null;
      }
    };

    fetchAndConvertImage().then(base64 => setLogoBase64(base64));
  }, []);

  const MyDoc = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {logoBase64 && (
              <View style={styles.logoContainer}>
                <Image
                  style={styles.logo}
                  src={logoBase64}
                />
              </View>
            )}
            <View style={styles.companyInfoContainer}>
              <Text style={styles.companyName}>TWINSK LOGISTICS</Text>
              <Text style={styles.companyDetails}>506, Tongyue Building</Text>
              <Text style={styles.companyDetails}>No.7, Tongya East Street Xicha Road</Text>
              <Text style={styles.companyDetails}>Baiyun District</Text>
              <Text style={styles.companyDetails}>Guangzhou, China</Text>
              <Text style={styles.companyDetails}>Logistics@twinskcompanyltd.com</Text>
              <Text style={styles.companyDetails}>Tel : +8613928824921</Text>
            </View>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.title}>FACTURE</Text>
            <Text style={styles.invoiceDate}>
              Date: {format(new Date(), 'dd/MM/yyyy')}
            </Text>
          </View>
        </View>

        {/* Informations du destinataire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <Text style={[styles.text, styles.bold]}>{data?.recipient_name || ''}</Text>
          <Text style={styles.text}>{data?.recipient?.phone || data?.recipient?.phone_number || ''}</Text>
          <Text style={styles.text}>{data?.recipient?.address || ''}</Text>
          <Text style={styles.text}>Destination: {data?.destination_country || ''}</Text>
          <Text style={styles.text}>Type d'envoi: {data?.shipping_type === 'standard' ? 'Standard' :
                                                  data?.shipping_type === 'express' ? 'Express' :
                                                  data?.shipping_type === 'maritime' ? 'Maritime' : 
                                                  data?.shipping_type || ''}</Text>
        </View>

        {/* Table d'articles */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.centerText]}>Poids/Volume</Text>
            <Text style={styles.tableHeaderCell}>Type</Text>
            <Text style={styles.tableHeaderCell}>Prix</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              Colis #<Text style={styles.bold}>{data?.tracking_number || ''}</Text>{'\n'}
              Type: {data?.shipping_type === 'standard' ? 'Standard' :
                      data?.shipping_type === 'express' ? 'Express' :
                      data?.shipping_type === 'maritime' ? 'Maritime' : 
                      data?.shipping_type || ''}
            </Text>
            <Text style={[styles.tableCell, styles.centerText]}>
              {data?.weight ? `${data.weight} kg` : ''}
              {data?.volume_cbm ? `\n${data.volume_cbm} m³` : ''}
            </Text>
            <Text style={styles.tableCell}>
              {data?.shipping_type === 'standard' ? 'Standard' :
               data?.shipping_type === 'express' ? 'Express' :
               data?.shipping_type === 'maritime' ? 'Maritime' : 
               data?.shipping_type || ''}
            </Text>
            <Text style={styles.tableCell}>
              {data?.total_price ? `${new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XAF',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                useGrouping: true,
              }).format(data.total_price).replace(/\s/g, '.')}` : ''}
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.total}>
          <View style={[styles.totalRow, styles.finalTotal]}>
            <Text style={[styles.totalLabel, styles.bold]}>TOTAL</Text>
            <Text style={[styles.totalAmount, styles.bold]}>
              {data?.total_price ? `${new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XAF',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                useGrouping: true,
              }).format(data.total_price).replace(/\s/g, '.')}` : ''}
            </Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Please make all checks payable to TWINSK LOGISTICS.</Text>
          <Text style={styles.footerText}>Thanks for your business</Text>
          <Text style={styles.footerText}>Logistics@twinskcompanyltd.com | www.twinskcompanyltd.com</Text>
        </View>
      </Page>
    </Document>
  );

  if (!logoBase64) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Loading...</Text>
        </Page>
      </Document>
    );
  }

  return <MyDoc />;
};

export default InvoicePDF;
