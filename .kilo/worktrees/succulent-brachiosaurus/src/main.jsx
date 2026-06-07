import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './components/Usercontext.jsx'
import { ChatProvider } from './Context/ChatContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <UserProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </UserProvider>
  </BrowserRouter>
)
