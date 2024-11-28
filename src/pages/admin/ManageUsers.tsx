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

  if (loading && !isAddingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('admin.manageUsers')}</h2>
        <button
          onClick={() => setIsAddingUser(true)}
          className="glass-button-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('admin.addNewUser')}
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isAddingUser && (
        <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('login.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="glass-input"
                required
              />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  {t('login.password')}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="glass-input"
                  required={!editingUser}
                  minLength={6}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('admin.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'A' | 'B' | 'C' })}
                className="glass-input"
                required
              >
                <option value="A">{t('categories.categoryA')}</option>
                <option value="B">{t('categories.categoryB')}</option>
                <option value="C">{t('categories.categoryC')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('admin.companyName')}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('admin.contactNumber')}
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('admin.address')}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="col-span-2 flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="glass-button"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary"
              >
                {loading ? <LoadingSpinner /> : editingUser ? t('common.save') : t('common.add')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              <th>{t('admin.companyName')}</th>
              <th>{t('admin.email')}</th>
              <th>{t('admin.contact')}</th>
              <th>{t('admin.category')}</th>
              <th className="text-right pr-8">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.companyName}</td>
                <td>{user.email}</td>
                <td>{user.contactNumber}</td>
                <td>{t(`categories.category${user.category}`)}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2 pr-6">
                    <button
                      onClick={() => startEdit(user)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}