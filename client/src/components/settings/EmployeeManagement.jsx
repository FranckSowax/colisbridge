import { useState, useEffect } from 'react';
import { supabase } from '@config/supabaseClient';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: ''
  });

  useEffect(() => {
    fetchEmployeesAndRoles();
  }, []);

  const fetchEmployeesAndRoles = async () => {
    try {
      // Récupérer les rôles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;
      setRoles(rolesData);

      // Récupérer les employés avec leurs rôles
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          auth_user:auth_user_id (
            email
          ),
          role:role_id (
            name
          )
        `)
        .order('created_at');

      if (employeesError) throw employeesError;
      setEmployees(employeesData.map(emp => ({
        ...emp,
        email: emp.auth_user?.email,
        role_name: emp.role?.name
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Générer un mot de passe aléatoire
      const tempPassword = Math.random().toString(36).slice(-8);

      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newEmployee.email,
        password: tempPassword,
        email_confirm: true
      });

      if (authError) throw authError;

      // Mettre à jour les informations dans la table employees
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          first_name: newEmployee.firstName,
          last_name: newEmployee.lastName,
          role_id: newEmployee.roleId
        })
        .eq('auth_user_id', authData.user.id);

      if (updateError) throw updateError;

      // Envoyer l'email avec les identifiants
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: newEmployee.email,
          password: tempPassword,
          firstName: newEmployee.firstName
        }
      });

      if (emailError) throw emailError;

      // Rafraîchir la liste
      await fetchEmployeesAndRoles();
      
      // Réinitialiser le formulaire
      setNewEmployee({
        email: '',
        firstName: '',
        lastName: '',
        roleId: ''
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Erreur lors de la création de l\'employé');
    } finally {
      setLoading(false);
    }
  };

  const updateEmployeeRole = async (employeeId, roleId) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ role_id: roleId })
        .eq('id', employeeId);

      if (error) throw error;
      await fetchEmployeesAndRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erreur lors de la mise à jour du rôle');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Gestion des employés</h3>
        
        {/* Formulaire d'ajout d'employé */}
        <form onSubmit={createEmployee} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Prénom
              </label>
              <input
                type="text"
                id="firstName"
                value={newEmployee.firstName}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, firstName: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                type="text"
                id="lastName"
                value={newEmployee.lastName}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, lastName: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rôle
              </label>
              <select
                id="role"
                value={newEmployee.roleId}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, roleId: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="">Sélectionner un rôle</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Création...' : 'Créer l\'employé'}
            </button>
          </div>
        </form>

        {/* Liste des employés */}
        <div className="mt-8">
          <h4 className="text-base font-medium text-gray-900">Employés existants</h4>
          <div className="mt-4 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Employé
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Rôle
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {employee.first_name} {employee.last_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {employee.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <select
                              value={employee.role_id || ''}
                              onChange={(e) => updateEmployeeRole(employee.id, e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Sans rôle</option>
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
