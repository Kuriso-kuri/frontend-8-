import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import './App.css';
import AdminUsersPage from './pages/AdminUsersPage/AdminUsersPage';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('accessToken');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route 
    			path="/admin/users" 
    			element={
        			<PrivateRoute>
            				<AdminUsersPage />
        			</PrivateRoute>
    			} 
                    />			
                    <Route 
                        path="/products" 
                        element={
                            <ProtectedRoute>
                                <ProductsPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/" element={<Navigate to="/products" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;