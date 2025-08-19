const { useState, useEffect } = React;

// Simulación de Firebase
const mockFirebase = {
  users: JSON.parse(localStorage.getItem('users') || '[]'),
  posts: JSON.parse(localStorage.getItem('posts') || '[]'),
  currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
  
  // Autenticación
  createUser: (userData) => {
    const newUser = {
      id: Date.now().toString(),
      usuario: userData.usuario,
      nombre: userData.nombre,
      apellido: userData.apellido,
      clave: userData.clave,
      createdAt: new Date().toISOString()
    };
    mockFirebase.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(mockFirebase.users));
    return { success: true, user: newUser };
  },
  
  signIn: (usuario, clave) => {
    const user = mockFirebase.users.find(u => u.usuario === usuario && u.clave === clave);
    if (user) {
      mockFirebase.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  },
  
  signOut: () => {
    mockFirebase.currentUser = null;
    localStorage.removeItem('currentUser');
    return { success: true };
  },
  
  // Posts
  createPost: (content) => {
    if (!mockFirebase.currentUser) return { success: false, error: 'Usuario no autenticado' };
    
    const newPost = {
      id: Date.now().toString(),
      content,
      authorId: mockFirebase.currentUser.id,
      author: `${mockFirebase.currentUser.nombre} ${mockFirebase.currentUser.apellido}`,
      username: mockFirebase.currentUser.usuario,
      createdAt: new Date().toISOString()
    };
    
    mockFirebase.posts.unshift(newPost);
    localStorage.setItem('posts', JSON.stringify(mockFirebase.posts));
    return { success: true, post: newPost };
  },
  
  getPosts: () => {
    return mockFirebase.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

// Componente de mensaje de alerta
const MessageAlert = ({ message }) => {
  if (!message.text) return null;
  
  const className = message.type === 'error' ? 'message-alert error' :
                   message.type === 'success' ? 'message-alert success' :
                   'message-alert info';
  
  return React.createElement('div', { className }, message.text);
};

// Componente principal
const InteractiveWall = () => {
  const [currentUser, setCurrentUser] = useState(mockFirebase.currentUser);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('wall');
  const [loading, setLoading] = useState(false);
  
  // Estados para formularios
  const [loginForm, setLoginForm] = useState({ usuario: '', clave: '' });
  const [registerForm, setRegisterForm] = useState({
    usuario: '',
    clave: '',
    nombre: '',
    apellido: ''
  });
  const [newPost, setNewPost] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    const allPosts = mockFirebase.getPosts();
    setPosts(allPosts);
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = mockFirebase.signIn(loginForm.usuario, loginForm.clave);
    
    if (result.success) {
      setCurrentUser(result.user);
      setLoginForm({ usuario: '', clave: '' });
      setActiveTab('wall');
      showMessage(`¡Bienvenido, ${result.user.nombre}!`, 'success');
    } else {
      showMessage(result.error, 'error');
    }
    
    setLoading(false);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validar que el usuario no exista
    const existingUser = mockFirebase.users.find(u => u.usuario === registerForm.usuario);
    if (existingUser) {
      showMessage('El nombre de usuario ya existe', 'error');
      setLoading(false);
      return;
    }
    
    const result = mockFirebase.createUser(registerForm);
    
    if (result.success) {
      setRegisterForm({ usuario: '', clave: '', nombre: '', apellido: '' });
      showMessage('Cuenta creada exitosamente. ¡Ahora puedes iniciar sesión!', 'success');
      setActiveTab('login');
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    mockFirebase.signOut();
    setCurrentUser(null);
    showMessage('Sesión cerrada correctamente', 'info');
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    
    const result = mockFirebase.createPost(newPost.trim());
    
    if (result.success) {
      setNewPost('');
      loadPosts();
      showMessage('¡Post publicado exitosamente!', 'success');
    } else {
      showMessage(result.error, 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Crear iconos usando Lucide
  const createIcon = (iconName, className = '') => {
    return React.createElement('i', { 
      'data-lucide': iconName, 
      className: className 
    });
  };

  // Renderizar la aplicación
  return React.createElement('div', { className: 'app' },
    // Header
    React.createElement('header', { className: 'header' },
      React.createElement('div', { className: 'header-content' },
        React.createElement('div', { className: 'header-left' },
          createIcon('message-square', 'header-icon'),
          React.createElement('h1', null, 'Muro Interactivo')
        ),
        React.createElement('div', { className: 'header-right' },
          currentUser ? 
            React.createElement('div', { className: 'user-info' },
              React.createElement('span', { className: 'welcome-text' },
                `Hola, ${currentUser.nombre}`
              ),
              React.createElement('button', {
                onClick: handleLogout,
                className: 'btn btn-logout'
              }, 
                createIcon('log-out', 'btn-icon'),
                'Cerrar Sesión'
              )
            ) :
            React.createElement('div', { className: 'auth-buttons' },
              React.createElement('button', {
                onClick: () => setActiveTab('login'),
                className: `btn ${activeTab === 'login' ? 'btn-primary active' : 'btn-outline-primary'}`
              },
                createIcon('log-in', 'btn-icon'),
                'Iniciar Sesión'
              ),
              React.createElement('button', {
                onClick: () => setActiveTab('register'),
                className: `btn ${activeTab === 'register' ? 'btn-success active' : 'btn-outline-success'}`
              },
                createIcon('user-plus', 'btn-icon'),
                'Registrarse'
              )
            ),
          React.createElement('button', {
            onClick: () => setActiveTab('wall'),
            className: `btn ${activeTab === 'wall' ? 'btn-secondary active' : 'btn-outline-secondary'}`
          }, 'Ver Muro')
        )
      )
    ),

    // Main Content
    React.createElement('main', { className: 'main-content' },
      React.createElement(MessageAlert, { message }),
      
      // Muro de Publicaciones
      activeTab === 'wall' && React.createElement('div', { className: 'wall-section' },
        React.createElement('h2', { className: 'section-title' }, 'Publicaciones Recientes'),
        
        // Formulario para crear post (solo si está autenticado)
        currentUser && React.createElement('div', { className: 'create-post-card' },
          React.createElement('h3', { className: 'card-title' }, '¿Qué estás pensando?'),
          React.createElement('form', { onSubmit: handleCreatePost, className: 'create-post-form' },
            React.createElement('textarea', {
              value: newPost,
              onChange: (e) => setNewPost(e.target.value),
              className: 'post-textarea',
              rows: 3,
              placeholder: 'Escribe tu publicación aquí...',
              required: true
            }),
            React.createElement('div', { className: 'form-actions' },
              React.createElement('button', {
                type: 'submit',
                disabled: !newPost.trim() || loading,
                className: 'btn btn-primary'
              },
                createIcon('send', 'btn-icon'),
                'Publicar'
              )
            )
          )
        ),
        
        // Lista de Posts
        React.createElement('div', { className: 'posts-list' },
          posts.length === 0 ? 
            React.createElement('div', { className: 'empty-state' },
              createIcon('message-square', 'empty-icon'),
              React.createElement('p', { className: 'empty-title' }, 'No hay publicaciones aún'),
              React.createElement('p', { className: 'empty-subtitle' },
                currentUser ? 
                  '¡Sé el primero en publicar algo!' : 
                  'Inicia sesión para crear la primera publicación'
              )
            ) :
            posts.map((post) =>
              React.createElement('div', { key: post.id, className: 'post-card' },
                React.createElement('div', { className: 'post-header' },
                  React.createElement('div', { className: 'post-avatar' },
                    createIcon('user', 'avatar-icon')
                  ),
                  React.createElement('div', { className: 'post-info' },
                    React.createElement('div', { className: 'post-meta' },
                      React.createElement('h4', { className: 'post-author' }, post.author),
                      React.createElement('span', { className: 'post-username' }, `@${post.username}`),
                      React.createElement('span', { className: 'post-separator' }, '•'),
                      React.createElement('span', { className: 'post-date' }, formatDate(post.createdAt))
                    ),
                    React.createElement('p', { className: 'post-content' }, post.content)
                  )
                )
              )
            )
        )
      ),
      
      // Formulario de Inicio de Sesión
      activeTab === 'login' && !currentUser && React.createElement('div', { className: 'auth-container' },
        React.createElement('div', { className: 'auth-card' },
          React.createElement('h2', { className: 'auth-title' }, 'Iniciar Sesión'),
          React.createElement('form', { onSubmit: handleLogin, className: 'auth-form' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Usuario'),
              React.createElement('input', {
                type: 'text',
                value: loginForm.usuario,
                onChange: (e) => setLoginForm({ ...loginForm, usuario: e.target.value }),
                className: 'form-input',
                required: true
              })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Contraseña'),
              React.createElement('input', {
                type: 'password',
                value: loginForm.clave,
                onChange: (e) => setLoginForm({ ...loginForm, clave: e.target.value }),
                className: 'form-input',
                required: true
              })
            ),
            React.createElement('button', {
              type: 'submit',
              disabled: loading,
              className: 'btn btn-primary btn-full'
            },
              loading ? 
                React.createElement('div', { className: 'spinner' }) :
                React.createElement('span', null,
                  createIcon('log-in', 'btn-icon'),
                  'Iniciar Sesión'
                )
            )
          )
        )
      ),
      
      // Formulario de Registro
      activeTab === 'register' && !currentUser && React.createElement('div', { className: 'auth-container' },
        React.createElement('div', { className: 'auth-card' },
          React.createElement('h2', { className: 'auth-title' }, 'Crear Cuenta'),
          React.createElement('form', { onSubmit: handleRegister, className: 'auth-form' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Usuario'),
              React.createElement('input', {
                type: 'text',
                value: registerForm.usuario,
                onChange: (e) => setRegisterForm({ ...registerForm, usuario: e.target.value }),
                className: 'form-input',
                required: true
              })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Nombre'),
              React.createElement('input', {
                type: 'text',
                value: registerForm.nombre,
                onChange: (e) => setRegisterForm({ ...registerForm, nombre: e.target.value }),
                className: 'form-input',
                required: true
              })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Apellido'),
              React.createElement('input', {
                type: 'text',
                value: registerForm.apellido,
                onChange: (e) => setRegisterForm({ ...registerForm, apellido: e.target.value }),
                className: 'form-input',
                required: true
              })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, 'Contraseña'),
              React.createElement('input', {
                type: 'password',
                value: registerForm.clave,
                onChange: (e) => setRegisterForm({ ...registerForm, clave: e.target.value }),
                className: 'form-input',
                required: true
              })
            ),
            React.createElement('button', {
              type: 'submit',
              disabled: loading,
              className: 'btn btn-success btn-full'
            },
              loading ? 
                React.createElement('div', { className: 'spinner' }) :
                React.createElement('span', null,
                  createIcon('user-plus', 'btn-icon'),
                  'Crear Cuenta'
                )
            )
          )
        )
      )
    )
  );
};

// Inicializar los iconos de Lucide después de que se renderice el componente
const initializeLucideIcons = () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
};

// Renderizar la aplicación
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(InteractiveWall));

// Inicializar iconos después de un pequeño delay
setTimeout(initializeLucideIcons, 100);