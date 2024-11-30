import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, orderBy, limit, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Order, Todo } from '../../types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  const [salesData, setSalesData] = useState<ChartData<'line'>>({
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
              label: t('admin.home.monthlySales'),
              data: sortedData.map(([, total]) => total),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.4
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
      <h1 className="text-2xl font-bold mb-6">{t('admin.home.dashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div className="glass-panel p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">{t('admin.home.pendingOrders')}</h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : error ? (
              <p className="text-red-500 text-center py-4">{error}</p>
            ) : pendingOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('admin.home.noPendingOrders')}</p>
            ) : (
              pendingOrders.map(order => (
                <div key={order.id} className="p-3 bg-white/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{order.companyName}</p>
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
                    <p className="font-semibold">€{order.total.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Todo List */}
        <div className="glass-panel p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">{t('admin.home.todoList')}</h2>
          
          {/* Add Todo Form */}
          <form onSubmit={handleAddTodo} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder={t('admin.home.newTodo')}
              className="flex-1 p-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
            >
              {t('admin.home.add')}
            </button>
          </form>

          {/* Todo List */}
          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('admin.home.noTodos')}</p>
            ) : (
              todos.map(todo => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="w-4 h-4"
                    />
                    <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                      {todo.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="mt-6">
        <div className="glass-panel p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">{t('admin.home.salesChart')}</h2>
          <div className="w-full h-[300px]">
            <Line
              data={salesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: t('admin.home.salesOverTime')
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `€${value}`
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
