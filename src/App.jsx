import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css'
import Register from './pages/Auth/Register'
import Login from './pages/Auth/Login'
import Root from './pages/Root/Root' 
import LinkConfirmation from './pages/Auth/LinkConfirmation'
import ForgotPassword from './pages/Auth/ForgotPassword'
import UpdatePassword from './pages/Auth/UpdatePassword'
import HomePage from './pages/home/HomePage'
import Products from './pages/products/Products'
import Profile from './pages/Profile/Profile'
import NotFound from './pages/ErrorPage/NotFound'
import SellerForm from './pages/Profile/SellerForm'

function App() {
  
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Root />, 
      errorElement: <NotFound/>,
      children: [  
      {path:  '/', element: <HomePage/>},
      {path: 'products', element: <Products/>},
      {path: 'profile', element: <Profile/>},
      {path:'become-seller', element: <SellerForm/>}
          ]
    },

    {path:"/register", element: <Register />},
    {path:"/login", element: <Login />},
    {path:"/link-confirm", element: <LinkConfirmation />},
    {path:"/forgot-password", element: <ForgotPassword />},
    {path:"/update-password", element: <UpdatePassword />},

    
  ])

  return (
  
    <RouterProvider router={router} />
  )
}

export default App