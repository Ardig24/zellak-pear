import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, orderBy, limit, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Order, Todo } from '../../types';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const { t } = useTranslation();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: []
  });

  // Fetch pending orders
  useEffect(() => {
    const fetchPendingOrders = async () => {
      console.log('Fetching pending orders...');
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('status', '==', 'pending'),
          orderBy('orderDate', 'desc'),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));

        setPendingOrders(orders);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  // Fetch todos
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const todosRef = collection(db, 'todos');
        const q = query(todosRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const todos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Todo));
        setTodos(todos);
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };

    fetchTodos();
  }, []);

  // Fetch sales data
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('status', '==', 'completed'),
          orderBy('orderDate', 'desc'),
          limit(100) // Last 100 orders
        );

        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));

        // Process orders into monthly data
        const monthlyData = new Map<string, number>();
        orders.forEach(order => {
          const date = order.orderDate && order.orderDate.toDate ? 
            order.orderDate.toDate() : 
            new Date(order.orderDate);
          const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
          monthlyData.set(monthYear, (monthlyData.get(monthYear) || 0) + order.total);
        });

        // Sort by date and get last 6 months
        const sortedData = Array.from(monthlyData.entries())
          .sort((a, b) => {
            const dateA = new Date(a[0]);
            const dateB = new Date(b[0]);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(-6);

        setSalesData({
          labels: sortedData.map(([month]) => month),
          datasets: [
            {
              label: t('admin.home_section.monthlySales'),
              data: sortedData.map(([, total]) => total),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(37, 99, 235, 0.9)',
              borderWidth: 1,
              borderRadius: 5,
              maxBarThickness: 50
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching sales data:', error);
      }
    };

    fetchSalesData();
  }, [t]);

  // Add new todo
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    try {
      const todosRef = collection(db, 'todos');
      await addDoc(todosRef, {
        text: newTodoText.trim(),
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewTodoText('');
      // Refresh todos
      const q = query(todosRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const updatedTodos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Todo));
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoId: string) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const todoRef = doc(db, 'todos', todoId);
      await updateDoc(todoRef, {
        completed: !todo.completed
      });

      setTodos(todos.map(t => 
        t.id === todoId ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  // Delete todo
  const deleteTodo = async (todoId: string) => {
    try {
      const todoRef = doc(db, 'todos', todoId);
      await deleteDoc(todoRef);
      setTodos(todos.filter(t => t.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('admin.home_section.dashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div className="backdrop-blur-md bg-white/70 p-6 rounded-xl shadow-lg border border-white/20">
          <h2 className="text-lg font-semibold mb-4">{t('admin.home_section.pendingOrders')}</h2>
          <div className="h-[250px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-gray-500 text-center">{t('admin.home_section.noPendingOrders')}</div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 backdrop-blur-sm bg-white/50 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/60"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">{order.companyName}</span>
                        <p className="text-sm text-gray-600">
                          {order.orderDate && order.orderDate.toDate ? 
                            order.orderDate.toDate().toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }) : 
                            new Date(order.orderDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                        </p>
                      </div>
                      <span className="text-orange-600 font-medium">
                        €{order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.items.length} {t('admin.home_section.items')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Todo List */}
        <div className="backdrop-blur-md bg-white/70 p-6 rounded-xl shadow-lg border border-white/20">
          <h2 className="text-lg font-semibold mb-4">{t('admin.home_section.todoList')}</h2>
          
          {/* Todo Input Form */}
          <form onSubmit={handleAddTodo} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder={t('admin.home_section.newToDoPlaceHolder')}
                className="flex-1 px-4 py-2.5 backdrop-blur-sm bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600/90 text-white rounded-lg hover:bg-blue-700/90 transition-colors duration-200 backdrop-blur-sm"
              >
                {t('admin.home_section.add')}
              </button>
            </div>
          </form>

          {/* Todo List */}
          <div className="h-[200px] overflow-y-auto">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-4 border-b border-white/10 last:border-b-0 hover:bg-white/40 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500/50"
                  />
                  <span className={todo.completed ? 'line-through text-gray-400' : ''}>
                    {todo.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500/90 hover:text-red-700/90 focus:outline-none transition-colors duration-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Chart */}
        <div className="md:col-span-2 backdrop-blur-md bg-white/70 p-6 rounded-xl shadow-lg border border-white/20">
          <h2 className="text-lg font-semibold mb-4">{t('admin.home_section.salesChart')}</h2>
          <div className="w-full h-[300px]">
            <Bar
              data={{
                ...salesData,
                datasets: salesData.datasets.map(dataset => ({
                  ...dataset,
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  borderColor: 'rgba(37, 99, 235, 0.9)',
                  borderWidth: 1,
                  borderRadius: 8,
                  maxBarThickness: 50
                }))
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: t('admin.home_section.salesOverTime'),
                    color: '#374151'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(107, 114, 128, 0.1)'
                    },
                    ticks: {
                      callback: (value) => `€${value}`,
                      color: '#374151'
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(107, 114, 128, 0.1)'
                    },
                    ticks: {
                      color: '#374151'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
