// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <Auth0Provider
    domain="dev-sfz3dvsre3jbi8k1.us.auth0.com"
    clientId="YJOY998B5J6MtflT8zXlUozYX4GWGu2H"
    authorizationParams={{
      redirect_uri: window.location.origin
    }}
  >
    <App />
  </Auth0Provider>
  // </StrictMode>,
)
