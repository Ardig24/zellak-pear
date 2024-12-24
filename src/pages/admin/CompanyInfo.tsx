import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

interface InfoItem {
  id: string;
  serviceName: string;
  username: string;
  password: string;
  hasRenewal?: boolean;
  renewalDate?: string;
  autoRenew?: boolean;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  items: InfoItem[];
}

export default function CompanyInfo() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    categoryId: string;
    item: InfoItem | null;
  } | null>(null);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const docRef = doc(db, 'companyInfo', 'settings');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setCategories(docSnap.data().categories || []);
      } else {
        // Initialize with some default categories if document doesn't exist
        const defaultCategories: Category[] = [
          { id: 'hosting', name: 'Hosting', items: [] },
          { id: 'email', name: 'Email Accounts', items: [] },
          { id: 'social', name: 'Social Media', items: [] },
          { id: 'payment', name: 'Payment Systems', items: [] },
          { id: 'other', name: 'Other', items: [] }
        ];
        await setDoc(docRef, { categories: defaultCategories });
        setCategories(defaultCategories);
      }
    } catch (err) {
      setError('Failed to fetch company information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyInfo = async () => {
    try {
      setLoading(true);
      await setDoc(doc(db, 'companyInfo', 'settings'), { categories });
      setError(null);
    } catch (err) {
      setError('Failed to save company information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    const newCategoryObj: Category = {
      id: newCategory.toLowerCase().replace(/\s+/g, '-'),
      name: newCategory,
      items: []
    };

    setCategories([...categories, newCategoryObj]);
    setNewCategory('');
    setAddingCategory(false);
    await saveCompanyInfo();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm(t('companyInfo.confirmDeleteCategory'))) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
      await saveCompanyInfo();
    }
  };

  const handleAddItem = async (categoryId: string) => {
    setEditingItem({
      categoryId,
      item: {
        id: Date.now().toString(),
        serviceName: '',
        username: '',
        password: '',
        hasRenewal: false,
        autoRenew: false
      }
    });
  };

  const handleSaveItem = async () => {
    if (!editingItem || !editingItem.item) return;

    const updatedCategories = categories.map(category => {
      if (category.id === editingItem.categoryId) {
        const existingItemIndex = category.items.findIndex(
          item => item.id === editingItem.item?.id
        );

        if (existingItemIndex >= 0) {
          // Update existing item
          category.items[existingItemIndex] = editingItem.item;
        } else {
          // Add new item
          category.items.push(editingItem.item);
        }
      }
      return category;
    });

    setCategories(updatedCategories);
    setEditingItem(null);
    await saveCompanyInfo();
  };

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (window.confirm(t('companyInfo.confirmDeleteItem'))) {
      const updatedCategories = categories.map(category => {
        if (category.id === categoryId) {
          category.items = category.items.filter(item => item.id !== itemId);
        }
        return category;
      });
      setCategories(updatedCategories);
      await saveCompanyInfo();
    }
  };

  if (loading && !categories.length) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t('companyInfo.title')}
        </h1>
        {!addingCategory && (
          <button
            onClick={() => setAddingCategory(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            {t('companyInfo.addCategory')}
          </button>
        )}
      </div>

      {addingCategory && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={t('companyInfo.categoryName')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => setAddingCategory(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {category.name}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddItem(category.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title={t('companyInfo.addItem')}
                >
                  <Plus size={20} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title={t('companyInfo.deleteCategory')}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium text-gray-800">{item.serviceName}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">{t('companyInfo.username')}</p>
                          <p className="text-gray-800">{item.username}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{t('companyInfo.password')}</p>
                          <p className="text-gray-800">{item.password}</p>
                        </div>
                        {item.hasRenewal && item.renewalDate && (
                          <div>
                            <p className="text-sm text-gray-600">{t('companyInfo.renewalDate')}</p>
                            <p className="text-gray-800">
                              {new Date(item.renewalDate).toLocaleDateString()}
                              {item.autoRenew && (
                                <span className="ml-2 text-green-600 text-sm">
                                  ({t('companyInfo.autoRenewEnabled')})
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        {item.notes && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">{t('companyInfo.notes')}</p>
                            <p className="text-gray-800 whitespace-pre-wrap">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem({ categoryId: category.id, item })}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title={t('common.edit')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(category.id, item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem.item?.id
                  ? t('companyInfo.editItem')
                  : t('companyInfo.addItem')}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('companyInfo.serviceName')}
                </label>
                <input
                  type="text"
                  value={editingItem.item?.serviceName || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item!, serviceName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('companyInfo.serviceNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('companyInfo.username')}
                </label>
                <input
                  type="text"
                  value={editingItem.item?.username || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item!, username: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('companyInfo.usernamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('companyInfo.password')}
                </label>
                <input
                  type="text"
                  value={editingItem.item?.password || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item!, password: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('companyInfo.passwordPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('companyInfo.renewalTracking')}
                </label>
                <select
                  value={editingItem.item?.hasRenewal ? "yes" : "no"}
                  onChange={(e) => {
                    const hasRenewal = e.target.value === "yes";
                    setEditingItem({
                      ...editingItem,
                      item: {
                        ...editingItem.item!,
                        hasRenewal,
                        // Clear renewal-related fields if disabled
                        ...(hasRenewal ? {} : {
                          renewalDate: undefined,
                          autoRenew: false
                        })
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="no">{t('companyInfo.noRenewal')}</option>
                  <option value="yes">{t('companyInfo.hasRenewal')}</option>
                </select>
              </div>

              {editingItem.item?.hasRenewal && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('companyInfo.renewalDate')}
                    </label>
                    <input
                      type="date"
                      value={editingItem.item?.renewalDate || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item!, renewalDate: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoRenew"
                        checked={editingItem.item?.autoRenew || false}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            item: { ...editingItem.item!, autoRenew: e.target.checked },
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="autoRenew" className="text-sm text-gray-700">
                        {t('companyInfo.autoRenew')}
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('companyInfo.notes')}
                </label>
                <textarea
                  value={editingItem.item?.notes || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item!, notes: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('companyInfo.notesPlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
