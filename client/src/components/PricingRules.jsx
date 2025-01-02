import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { toast } from 'react-hot-toast';

const SHIPPING_TYPES = {
  standard: 'Standard',
  express: 'Express',
  maritime: 'Maritime'
};

const COUNTRIES = {
  france: { name: 'France', flag: '🇫🇷' },
  gabon: { name: 'Gabon', flag: '🇬🇦' },
  togo: { name: 'Togo', flag: '🇹🇬' },
  cote_ivoire: { name: "Côte d'Ivoire", flag: '🇨🇮' },
  dubai: { name: 'Dubaï', flag: '🇦🇪' }
};

export default function PricingRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('country_code');

      if (error) throw error;
      setRules(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des tarifs');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (rule) => {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .upsert({
          ...rule,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Tarif mis à jour avec succès');
      fetchRules();
      setEditingRule(null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du tarif');
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Tarification</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les tarifs par pays et type d'envoi
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setEditingRule({})}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Ajouter un tarif
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pays</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type d'envoi</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Prix/kg</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Prix/m³</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {COUNTRIES[rule.country_code]?.flag} {COUNTRIES[rule.country_code]?.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {SHIPPING_TYPES[rule.shipping_type]}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {rule.price_per_kg ? `${rule.price_per_kg}€` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {rule.price_per_cbm ? `${rule.price_per_cbm}€` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {editingRule && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">
              {editingRule.id ? 'Modifier le tarif' : 'Ajouter un tarif'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(editingRule);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Pays</label>
                <select
                  value={editingRule.country_code || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, country_code: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Sélectionner un pays</option>
                  {Object.entries(COUNTRIES).map(([code, { name, flag }]) => (
                    <option key={code} value={code}>
                      {flag} {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type d'envoi</label>
                <select
                  value={editingRule.shipping_type || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, shipping_type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Sélectionner un type</option>
                  {Object.entries(SHIPPING_TYPES).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {(editingRule.shipping_type === 'standard' || editingRule.shipping_type === 'express') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix par kg (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingRule.price_per_kg || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, price_per_kg: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}

              {editingRule.shipping_type === 'maritime' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix par m³ (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingRule.price_per_cbm || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, price_per_cbm: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
