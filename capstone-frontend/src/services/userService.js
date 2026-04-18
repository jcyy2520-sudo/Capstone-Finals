import api from './api';

const userService = {
  getUsers: (page = 1) => {
    return api.get(`/admin/users?page=${page}`);
  },
  createUser: (userData) => {
    return api.post('/admin/users', userData);
  },
  updateUser: (userId, userData) => {
    return api.put(`/admin/users/${userId}`, userData);
  },
  deleteUser: (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },
  getRoles: () => {
    // This endpoint doesn't exist yet, we'll need to create it.
    // For now, we can hardcode or create a new route.
    return api.get('/roles');
  },
  getDepartments: () => {
    // This endpoint doesn't exist yet, we'll need to create it.
    return api.get('/departments');
  }
};

export default userService;
