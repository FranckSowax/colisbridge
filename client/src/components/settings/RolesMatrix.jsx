import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

const MODULES = {
  dashboard: { name: 'Tableau de bord', permissions: ['view', 'export'] },
  statistics: { name: 'Statistiques', permissions: ['view', 'export'] },
  parcels: { name: 'Colis', permissions: ['view', 'create', 'edit', 'delete'] },
  clients: { name: 'Clients', permissions: ['view', 'create', 'edit', 'delete'] },
  disputes: { name: 'Litiges', permissions: ['view', 'create', 'edit', 'delete'] },
  settings: { name: 'Paramètres', permissions: ['view', 'edit'] }
};

const PERMISSION_LABELS = {
  view: 'Voir',
  create: 'Créer',
  edit: 'Modifier',
  delete: 'Supprimer',
  export: 'Exporter',
  approve: 'Approuver'
};

export default function RolesMatrix() {
  const [roles, setRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    try {
      // Récupérer les rôles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      // Récupérer les permissions pour chaque rôle
      const permissions = {};
      for (const role of rolesData) {
        const { data: rolePerms, error: permsError } = await supabase
          .from('role_permissions')
          .select(`
            permissions (
              module,
              action
            )
          `)
          .eq('role_id', role.id);

        if (permsError) throw permsError;

        permissions[role.id] = rolePerms.map(p => ({
          module: p.permissions.module,
          action: p.permissions.action
        }));
      }

      setRoles(rolesData);
      setRolePermissions(permissions);
    } catch (error) {
      console.error('Error fetching roles and permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (roleId, module, action, checked) => {
    try {
      const { data: permission } = await supabase
        .from('permissions')
        .select('id')
        .eq('module', module)
        .eq('action', action)
        .single();

      if (checked) {
        await supabase
          .from('role_permissions')
          .insert({ role_id: roleId, permission_id: permission.id });
      } else {
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .eq('permission_id', permission.id);
      }

      await fetchRolesAndPermissions();
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const hasPermission = (roleId, module, action) => {
    return rolePermissions[roleId]?.some(
      p => p.module === module && p.action === action
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-6 text-gray-900">
            Matrice des permissions
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les permissions pour chaque rôle
          </p>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      MODULE / RÔLE
                    </th>
                    {roles.map(role => (
                      <th key={role.id} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Object.entries(MODULES).map(([moduleKey, moduleData]) => (
                    <tr key={moduleKey}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="font-medium">{moduleData.name}</div>
                        <div className="text-gray-500">{moduleData.permissions.length} permissions</div>
                      </td>
                      {roles.map(role => (
                        <td key={role.id} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="space-y-2">
                            {moduleData.permissions.map(action => (
                              <div key={action} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={hasPermission(role.id, moduleKey, action)}
                                  onChange={(e) => handlePermissionChange(role.id, moduleKey, action, e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                />
                                <span className="ml-2 text-gray-900">{PERMISSION_LABELS[action]}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
