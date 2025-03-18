import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux';
import store from './Components/store/store.jsx';
import Whatsapp from './Components/Loginp/whatsapp.jsx';
import Chatbot from './Components/Navbar/Chatboat.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Chatbot/>
      <Whatsapp/>
    <App />
    </Provider>
  </StrictMode>,
)
