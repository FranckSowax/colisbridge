import { supabase } from '../config/supabaseClient';

async function testPriceCalculation() {
  const testCases = [
    {
      name: "Test 1: Standard France",
      params: {
        p_country: 'france',
        p_shipping_type: 'standard',
        p_weight: 5.0,
        p_cbm: null
      },
      expectedPrice: 50.0,
      expectedCurrency: 'EUR'
    },
    {
      name: "Test 2: Express Dubai",
      params: {
        p_country: 'dubai',
        p_shipping_type: 'express',
        p_weight: 2.5,
        p_cbm: null
      },
      expectedPrice: 75.0,
      expectedCurrency: 'USD'
    },
    {
      name: "Test 3: Maritime Gabon",
      params: {
        p_country: 'gabon',
        p_shipping_type: 'maritime',
        p_weight: null,
        p_cbm: 2.0
      },
      expectedPrice: 480000,
      expectedCurrency: 'XAF'
    }
  ];

  console.log("Démarrage des tests de calcul de prix...\n");

  for (const test of testCases) {
    try {
      console.log(`Exécution de ${test.name}`);
      
      const { data, error } = await supabase.rpc(
        'calculate_parcel_price',
        test.params
      );

      if (error) throw error;

      if (!data.success) {
        console.error(`❌ ${test.name} a échoué:`, data.error);
        continue;
      }

      const result = {
        actualPrice: data.total_price,
        actualCurrency: data.currency,
        passed: data.total_price === test.expectedPrice && 
                data.currency === test.expectedCurrency
      };

      if (result.passed) {
        console.log(`✅ ${test.name} réussi!`);
        console.log(`   Prix calculé: ${result.actualPrice} ${result.actualCurrency}\n`);
      } else {
        console.log(`❌ ${test.name} échoué!`);
        console.log(`   Attendu: ${test.expectedPrice} ${test.expectedCurrency}`);
        console.log(`   Obtenu: ${result.actualPrice} ${result.actualCurrency}\n`);
      }

    } catch (error) {
      console.error(`❌ Erreur lors de ${test.name}:`, error.message, '\n');
    }
  }
}

// Exécuter les tests
testPriceCalculation();
