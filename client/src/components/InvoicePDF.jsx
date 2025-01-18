import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../config/supabaseClient';

const LOGO_URL = 'https://i.imgur.com/ZU2ZGQk.png';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  companyInfo: {
    textAlign: 'right',
    color: '#666666',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E75B5',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E75B5',
    marginBottom: 10,
  },
  date: {
    color: '#666666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#2E75B5',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  infoColumn: {
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E75B5',
    padding: 8,
    color: 'white',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 8,
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  totals: {
    width: '40%',
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    fontWeight: 'bold',
    color: '#2E75B5',
  },
  footer: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 10,
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  invoiceHeader: {
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  tableHeaderCell: {
    flex: 1,
  },
  alignRight: {
    textAlign: 'right',
  },
  footerText: {
    fontSize: 10,
  },
  footerLinks: {
    fontSize: 10,
    textDecoration: 'underline',
  },
});

const calculatePrice = async ({ country, shippingType, weight, cbm }) => {
  if (!country || !shippingType || (!weight && !cbm)) {
    return 0;
  }

  try {
    const { data: rules, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('country_code', country.toLowerCase())
      .eq('shipping_type', shippingType.toLowerCase())
      .single();

    if (error) throw error;
    if (!rules) return 0;

    let totalPrice = 0;
    if (rules.unit_type === 'kg' && weight) {
      totalPrice = rules.price_per_unit * weight;
    } else if (rules.unit_type === 'cbm' && cbm) {
      totalPrice = rules.price_per_unit * cbm;
    }

    return totalPrice;
  } catch (error) {
    console.error('Error calculating price:', error);
    return 0;
  }
};

const InvoicePDF = ({ data }) => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await calculatePrice({
        country: data?.country,
        shippingType: data?.shipping_type,
        weight: data?.weight,
        cbm: data?.volume
      });
      setTotal(price);
    };

    fetchPrice();
  }, [data]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={LOGO_URL} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>TWINSK COMPANY</Text>
            <Text>506, Tongyue Building</Text>
            <Text>No.7, Tongya East Street Xicha Road</Text>
            <Text>Baiyun District, Guangzhou, China</Text>
            <Text>Logistics@twinskcompanyltd.com</Text>
            <Text>Address: Gabon Libreville</Text>
            <Text>Tel: +8613928824921</Text>
          </View>
        </View>

        <View style={styles.invoiceHeader}>
          <Text style={styles.title}>FACTURE #{data?.tracking_number || ''}</Text>
          <Text>Date d'émission : {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>DESTINATAIRE</Text>
            <Text>{data?.recipient_name || ''}</Text>
            <Text>Tel: {data?.recipient_phone || ''}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>EXPÉDITION</Text>
            <Text>Type: {data?.shipping_type || ''}</Text>
            <Text>Destination: {data?.country ? data.country.toUpperCase() : ''}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DÉTAILS DU COLIS</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Description</Text>
              <Text style={styles.tableHeaderCell}>Type d'envoi</Text>
              <Text style={styles.tableHeaderCell}>Poids/Volume</Text>
              <Text style={[styles.tableHeaderCell, styles.alignRight]}>Prix</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Colis</Text>
              <Text style={styles.tableCell}>{data?.shipping_type || ''}</Text>
              <Text style={styles.tableCell}>{data?.weight ? `${data.weight} kg` : ''}</Text>
              <Text style={[styles.tableCell, styles.alignRight]}>{total} XAF</Text>
            </View>
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Sous-total</Text>
            <Text>{total} XAF</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TVA (0%)</Text>
            <Text>0 FCFA</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowBold]}>
            <Text>Total</Text>
            <Text>{total} XAF</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Please make all checks payable to TWINSK LOGISTICS.</Text>
          <Text style={styles.footerText}>Thanks for your business</Text>
          <Text style={styles.footerLinks}>
            Logistics@twinskcompanyltd.com | www.twinskcompanyltd.com
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
