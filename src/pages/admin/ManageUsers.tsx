import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

interface UserData {
  id: string;
  email: string;
  category: 'A' | 'B' | 'C';
  companyName: string;
  address?: string;
  contactNumber?: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    companyName: '',
    contactNumber: '',
    role: 'user',
  });
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    category: 'A' as 'A' | 'B' | 'C',
    companyName: '',
    address: '',
    contactNumber: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      const usersData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UserData))
        .filter(user => !user.isAdmin); // Exclude admin users from the list
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingUser) {
        // Update existing user
        await setDoc(doc(db, 'users', editingUser.id), {
          email: formData.email,
          category: formData.category,
          companyName: formData.companyName,
          address: formData.address,
          contactNumber: formData.contactNumber,
          isAdmin: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } else {
        // Create new user with Firebase Auth
        const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Store additional user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: formData.email,
          category: formData.category,
          companyName: formData.companyName,
          address: formData.address,
          contactNumber: formData.contactNumber,
          isAdmin: false,
          createdAt: new Date().toISOString()
        });

        // Sign out the newly created user to maintain admin session
        await auth.signOut();
        
        // Re-authenticate the admin (assuming you have the admin credentials stored)
        // This step might be needed depending on your authentication flow
        // You might want to handle this in your AuthContext
      }

      await fetchUsers();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t('admin.deleteUserConfirm'))) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Password field is empty when editing
      category: user.category,
      companyName: user.companyName,
      address: user.address || '',
      contactNumber: user.contactNumber || '',
    });
    setIsAddingUser(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      category: 'A',
      companyName: '',
      address: '',
      contactNumber: '',
    });
    setIsAddingUser(false);
    setEditingUser(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'users', selectedUser!.id), {
        displayName: editForm.displayName,
        companyName: editForm.companyName,
        contactNumber: editForm.contactNumber,
        role: editForm.role,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSelectedUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredUsers = users.filter(user =>
    user.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.contactNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t('admin.manageUsers')}</h2>
          <button
            onClick={() => setIsAddingUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('admin.addNewUser')}
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {/* Users List */}
        <div className="space-y-3">
          {/* Desktop View - Table */}
          <div className="hidden lg:block bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-900">
                    {t('admin.users.email')}
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-900">
                    {t('admin.users.company')}
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-900">
                    {t('admin.users.contact')}
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-900 w-24">
                    {t('admin.users.role')}
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-900 w-32">
                    {t('admin.users.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-2 py-2">
                      <div className="truncate max-w-[200px]">{user.email}</div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="truncate max-w-[150px]">{user.companyName}</div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="truncate max-w-[120px]">{user.contactNumber}</div>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        user.isAdmin 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t(`admin.users.roles.${user.isAdmin ? 'admin' : 'user'}`)}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(user)}
                          className="bg-white border border-blue-500 text-blue-700 px-2 py-1 text-xs rounded-lg hover:bg-blue-50 transition-colors duration-200"
                        >
                          {t('admin.users.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-white border border-red-500 text-red-700 px-2 py-1 text-xs rounded-lg hover:bg-red-50 transition-colors duration-200"
                        >
                          {t('admin.users.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View - Cards */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-600">{user.companyName}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    user.isAdmin 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {t(`admin.users.roles.${user.isAdmin ? 'admin' : 'user'}`)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-600">{t('admin.users.company')}:</div>
                    <div className="text-gray-900">{user.companyName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600">{t('admin.users.contact')}:</div>
                    <div className="text-gray-900">{user.contactNumber}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => startEdit(user)}
                    className="flex-1 bg-white border border-blue-500 text-blue-700 px-2 py-1 text-xs rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    {t('admin.users.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex-1 bg-white border border-red-500 text-red-700 px-2 py-1 text-xs rounded-lg hover:bg-red-50 transition-colors duration-200"
                  >
                    {t('admin.users.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit User Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-lg p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 drop-shadow-lg">
                    {t('admin.users.editUser')}
                  </h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-300 hover:text-black transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t('admin.users.company')}
                    </label>
                    <input
                      type="text"
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t('admin.users.contact')}
                    </label>
                    <input
                      type="text"
                      value={editForm.contactNumber}
                      onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t('admin.users.role')}
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'user' | 'admin' })}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="user">{t('admin.users.roles.user')}</option>
                      <option value="admin">{t('admin.users.roles.admin')}</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="flex-1 bg-gray-500/30 hover:bg-gray-600/30 text-gray-900 py-2"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {t('common.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isAddingUser && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {t('login.email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {t('login.password')}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                      required={!editingUser}
                      minLength={6}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {t('admin.category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'A' | 'B' | 'C' })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="A">{t('categories.categoryA')}</option>
                    <option value="B">{t('categories.categoryB')}</option>
                    <option value="C">{t('categories.categoryC')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {t('admin.companyName')}
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {t('admin.contactNumber')}
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {t('admin.address')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="col-span-2 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-500/30 hover:bg-gray-600/30 text-gray-900 py-2"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    {loading ? <LoadingSpinner /> : editingUser ? t('common.save') : t('common.add')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}