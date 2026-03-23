import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import ProductModal from '../../components/ProductModal';
import './ProductsPage.scss';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const userData = await api.getMe();
            setUser(userData);
            setUserRole(userData.role);	
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setModalMode('create');
        setSelectedProduct(null);
        setModalOpen(true);
    };

    const handleEdit = (product) => {
        setModalMode('edit');
        setSelectedProduct(product);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                await api.deleteProduct(id);
                await fetchProducts();
            } catch (error) {
                console.error('Ошибка удаления товара:', error);
            }
        }
    };

    const handleSubmit = async (productData) => {
        try {
            if (modalMode === 'create') {
                await api.createProduct(productData);
            } else {
                await api.updateProduct(productData.id, productData);
            }
            await fetchProducts();
            setModalOpen(false);
        } catch (error) {
            console.error('Ошибка сохранения товара:', error);
        }
    };

    const handleLogout = () => {
        api.logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="products-page">
            <header className="products-header">
                <h1>Каталог товаров</h1>
                {user && (
                    <div className="user-info">
                        <span>👤 {user.first_name} {user.last_name}</span>
			{user.role === 'admin' && (
           			 <button onClick={() => navigate('/admin/users')} className="admin-link">
                				Управление пользователями
            			 </button>
        		)}
                        <button onClick={handleLogout} className="logout-button">
                            Выйти
                        </button>
                    </div>
                )}
            </header>
            
            {(user?.role === 'seller' || user?.role === 'admin') && (
    		<button onClick={handleCreate} className="create-button">
        		+ Создать товар
    		</button>
            )}
            
            <div className="products-grid">
                {products.map(product => (
                    <div key={product.id} className="product-card">
                        {product.imageUrl && (
                            <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="product-image"
                            />
                        )}
                        <div className="product-info">
                            <h3>{product.name}</h3>
                            <p className="product-category">{product.category}</p>
                            <p className="product-description">{product.description}</p>
                            <div className="product-details">
                                <span className="product-price">{product.price} ₽</span>
                                <span className="product-stock">В наличии: {product.stock}</span>
                            </div>
                        </div>
                        <div className="product-actions">
    				{(userRole === 'seller' || userRole === 'admin') && (
        				<button onClick={() => handleEdit(product)}>✏️</button>
    				)}
    				{userRole === 'admin' && (
        				<button onClick={() => handleDelete(product.id)}>🗑️</button>
    				)}
			</div>
                    </div>
                ))}
            </div>

            <ProductModal
                open={modalOpen}
                mode={modalMode}
                initialProduct={selectedProduct}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default ProductsPage;