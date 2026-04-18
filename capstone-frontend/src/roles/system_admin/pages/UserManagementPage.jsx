import { useState, useEffect, useCallback } from 'react';
import userService from '../../../services/userService';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { toast } from 'react-hot-toast';
import PageHeader from '../../../shared/components/PageHeader';
import Table from '../../../shared/components/Table';
import Badge from '../../../shared/components/Badge';

const getInitialFormState = (user) => ({
  name: user?.name ?? '',
  email: user?.email ?? '',
  password: '',
  password_confirmation: '',
  role_id: user?.role_id ?? user?.role?.id ?? '',
  department_id: user?.department_id ?? user?.department?.id ?? '',
  designation: user?.designation ?? '',
  status: user?.status ?? 'pending',
});

const UserForm = ({ user, roles, departments, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => getInitialFormState(user));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(getInitialFormState(user));
    setErrors({});
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    }

    if (!formData.role_id) {
      nextErrors.role_id = 'Role is required';
    }

    if (!formData.status) {
      nextErrors.status = 'Status is required';
    }

    const passwordProvided = formData.password.trim().length > 0;
    if (!user || passwordProvided) {
      if (!passwordProvided) {
        nextErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters';
      }

      if (!formData.password_confirmation) {
        nextErrors.password_confirmation = 'Please confirm the password';
      } else if (formData.password_confirmation !== formData.password) {
        nextErrors.password_confirmation = 'Passwords do not match';
      }
    }

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      designation: formData.designation.trim(),
    };

    if (!payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select name="role_id" value={formData.role_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Select a role</option>
            {roles.map(role => <option key={role.id} value={role.id}>{role.display_name}</option>)}
          </select>
          {errors.role_id && <p className="text-red-500 text-xs mt-1">{errors.role_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select name="department_id" value={formData.department_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Select a department</option>
            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Designation</label>
          <input name="designation" value={formData.designation} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">Save User</Button>
      </div>
    </form>
  );
};


export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await userService.getUsers(page);
      setUsers(response.data.data ?? []);
      setPagination(response.data);
    } catch (error) {
      toast.error('Failed to fetch users.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [rolesRes, deptsRes] = await Promise.all([
        userService.getRoles(),
        userService.getDepartments()
      ]);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.data ?? []);
      setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : deptsRes.data?.data ?? []);
    } catch (error) {
      toast.error('Failed to fetch roles or departments.');
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDropdownData();
  }, [fetchUsers, fetchDropdownData]);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        toast.success('User deleted successfully.');
        fetchUsers(); // Refresh list
      } catch (error) {
        toast.error('Failed to delete user.');
        console.error(error);
      }
    }
  };

  const handleSave = async (data) => {
    const isUpdating = !!selectedUser;
    const payload = { ...data };

    if (!payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }

    const promise = isUpdating
      ? userService.updateUser(selectedUser.id, payload)
      : userService.createUser(payload);

    try {
      await toast.promise(promise, {
        loading: `${isUpdating ? 'Updating' : 'Creating'} user...`,
        success: `User ${isUpdating ? 'updated' : 'created'} successfully!`,
        error: `Failed to ${isUpdating ? 'update' : 'create'} user.`,
      });
      setIsModalOpen(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error(error);
      // Error toast is handled by the promise
    }
  };

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Role',
      accessorKey: 'role.display_name',
    },
    {
      header: 'Department',
      accessorKey: 'department.name',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <Badge status={getValue()}>{getValue()}</Badge>,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="icon" onClick={() => handleEdit(row.original)}>
            <Pencil className="h-5 w-5" />
          </Button>
          <Button variant="icon" color="danger" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <PageHeader
        title="User Management"
        actions={
            <Button onClick={handleCreate} variant="primary" icon={Plus}>
            Create User
          </Button>
        }
      />

      <div className="mt-6">
        <Table
          columns={columns}
          data={users}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => fetchUsers(page)}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Edit User' : 'Create New User'}
      >
        <UserForm
          user={selectedUser}
          roles={roles}
          departments={departments}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
