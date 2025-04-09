import { useState, useEffect } from 'react'
import './App.css'
import { FrappeProvider, useFrappeGetCall, useFrappePostCall, useFrappeAuth } from 'frappe-react-sdk'

interface Todo {
  name: string;
  description: string;
  status: string;
}

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim() && password.trim()) {
      try {
        // Use localhost URL to go through Vite proxy
        const response = await fetch('http://localhost:8080/api/method/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usr: username.trim(),
            pwd: password.trim()
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData._error_message || 'Login failed')
        }

        const data = await response.json()
        console.log('Login response:', data)

        if (data.message && data.message.token) {
          const formattedToken = `token ${data.message.token}`
          console.log('Formatted token:', formattedToken)
          onLogin(formattedToken)
        } else {
          throw new Error('No token received in login response')
        }
      } catch (error: any) {
        console.error('Login error:', error)
        setError(error.message || 'Login failed. Please check your credentials.')
      }
    }
  }

  return (
    <div className="login-container">
      <h2>Login to Frappe</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

function TodoApp() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { data: todos, mutate: refreshTodos, error: getListError } = useFrappeGetCall<{ message: Todo[] }>('frappe.client.get_list', {
    doctype: 'ToDo',
    fields: ['name', 'description', 'status']
  })
  const { call: createTodo } = useFrappePostCall('frappe.client.insert')
  const { call: updateTodo } = useFrappePostCall('frappe.client.set_value')
  const { call: deleteTodo } = useFrappePostCall('frappe.client.delete')

  const handleLogout = () => {
    localStorage.removeItem('frappe_token')
    window.location.reload() // Reload to reset the app state
  }

  useEffect(() => {
    if (getListError) {
      console.error('Error fetching todos:', getListError);
      setError(`Error loading todos: ${getListError.message || 'Permission denied. Please check your permissions.'}`);
    }
  }, [getListError]);

  const addTodo = async () => {
    if (input.trim()) {
      try {
        setError(null)
        const result = await createTodo({
          doc: {
            doctype: 'ToDo',
            description: input.trim(),
            status: 'Open'
          }
        })
        if (result) {
          setInput('')
          refreshTodos()
        } else {
          throw new Error('Failed to create todo')
        }
      } catch (err: any) {
        const errorMessage = err.message || err.exc || 'Failed to add todo. Please try again.';
        setError(`Error adding todo: ${errorMessage}`);
        console.error('Error adding todo:', err);
      }
    }
  }

  const toggleTodo = async (todo: Todo) => {
    try {
      setError(null)
      const result = await updateTodo({
        doctype: 'ToDo',
        name: todo.name,
        fieldname: 'status',
        value: todo.status === 'Open' ? 'Closed' : 'Open'
      })
      if (result) {
        refreshTodos()
      } else {
        throw new Error('Failed to update todo')
      }
    } catch (err: any) {
      const errorMessage = err.message || err.exc || 'Failed to update todo. Please try again.';
      setError(`Error updating todo: ${errorMessage}`);
      console.error('Error updating todo:', err);
    }
  }

  const removeTodo = async (todo: Todo) => {
    try {
      setError(null)
      const result = await deleteTodo({
        doctype: 'ToDo',
        name: todo.name
      })
      if (result) {
        refreshTodos()
      } else {
        throw new Error('Failed to delete todo')
      }
    } catch (err: any) {
      const errorMessage = err.message || err.exc || 'Failed to delete todo. Please try again.';
      setError(`Error deleting todo: ${errorMessage}`);
      console.error('Error deleting todo:', err);
    }
  }

  return (
    <div className="todo-container">
      <div className="todo-header">
        <h1>Todo App</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="todo-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new todo"
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos?.message?.map(todo => (
          <li key={todo.name} className={todo.status === 'Closed' ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.status === 'Closed'}
              onChange={() => toggleTodo(todo)}
            />
            <span>{todo.description}</span>
            <button onClick={() => removeTodo(todo)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('frappe_token')
    if (savedToken) {
      console.log('Found saved token:', savedToken)
      setToken(savedToken)
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = (newToken: string) => {
    console.log('Storing token:', newToken)
    localStorage.setItem('frappe_token', newToken)
    setToken(newToken)
    setIsLoggedIn(true)
  }

  if (!isLoggedIn) {
    return (
      <div className="App">
        <FrappeProvider
          url="http://localhost:8080"
          enableSocket={false}
        >
          <LoginForm onLogin={handleLogin} />
        </FrappeProvider>
      </div>
    )
  }

  return (
    <div className="App">
      <FrappeProvider
        url="http://localhost:8080"
        tokenParams={{
          useToken: true,
          type: 'token',
          token: () => {
            const token = localStorage.getItem('frappe_token')
            if (!token) {
              console.error('No token found')
              return ''
            }
            console.log('Using token:', token)
            return token
          }
        }}
        enableSocket={false}
      >
        <TodoApp />
      </FrappeProvider>
    </div>
  )
}

export default App
