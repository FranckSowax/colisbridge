import React from 'react';
import { useCalculatePrice } from '../hooks/useCalculatePrice';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
});

const InvoicePDF = ({ data }) => {
  const { data: priceData } = useCalculatePrice({
    country: data?.country,
    shippingType: data?.shipping_type,
    weight: data?.weight,
    cbm: data?.volume
  });

  const total = priceData?.total || 0;
  const formattedTotal = total + ' FCFA';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Image source={LOGO_URL} style={styles.logo} />
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

        {/* Numéro de facture et date */}
        <View style={styles.section}>
          <Text style={styles.title}>FACTURE #{data?.reference}</Text>
          <Text style={styles.date}>
            Date d'émission : {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
          </Text>
        </View>

        {/* Sections DESTINATAIRE et EXPÉDITION */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>DESTINATAIRE</Text>
            <Text>{data?.recipient_name}</Text>
            <Text>{data?.recipient_address}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>EXPÉDITION</Text>
            <Text>Type: {data?.shipping_type || 'Standard'}</Text>
            <Text>Destination: {data?.destination}</Text>
          </View>
        </View>

        {/* Section DÉTAILS DU COLIS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DÉTAILS DU COLIS</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Description</Text>
              <Text style={styles.tableCell}>Type d'envoi</Text>
              <Text style={styles.tableCell}>Poids/Volume</Text>
              <Text style={styles.tableCellRight}>Prix</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Colis</Text>
              <Text style={styles.tableCell}>{data?.shipping_type || 'Standard'}</Text>
              <Text style={styles.tableCell}>{data?.weight} kg</Text>
              <Text style={styles.tableCellRight}>{formattedTotal}</Text>
            </View>
          </View>
        </View>

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Sous-total</Text>
            <Text>{formattedTotal}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TVA (0%)</Text>
            <Text>0 FCFA</Text>
          </View>
          <View style={styles.totalRowBold}>
            <Text>Total</Text>
            <Text>{formattedTotal}</Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Please make all checks payable to TWINSK LOGISTICS.</Text>
          <Text>Thanks for your business</Text>
          <Text>Logistics@twinskcompanyltd.com | www.twinskcompanyltd.com</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
