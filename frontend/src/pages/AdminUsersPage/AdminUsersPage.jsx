import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import './AdminUsersPage.scss';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ email: '', first_name: '', last_name: '', role: 'user' });
    const navigate = useNavigate();

    useEffect(() => {
        checkAdminAndLoadUsers();
    }, []);

    const checkAdminAndLoadUsers = async () => {
        try {
            const user = await api.getMe();
            if (user.role !== 'admin') {
                navigate('/');
                return;
            }
            loadUsers();
        } catch (error) {
            console.error('Ошибка проверки прав:', error);
            navigate('/');
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            try {
                await api.deleteUser(id);
                await loadUsers();
            } catch (error) {
                console.error('Ошибка удаления пользователя:', error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.updateUser(editingUser.id, formData);
            setModalOpen(false);
            await loadUsers();
        } catch (error) {
            console.error('Ошибка обновления пользователя:', error);
        }
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="admin-users-page">
            <header className="admin-header">
                <h1>👥 Управление пользователями</h1>
                <button onClick={() => navigate('/')} className="back-button">
                    ← На главную
                </button>
            </header>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Имя</th>
                            <th>Фамилия</th>
                            <th>Роль</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.email}</td>
                                <td>{user.first_name}</td>
                                <td>{user.last_name}</td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role === 'admin' ? 'Администратор' : 
                                         user.role === 'seller' ? 'Продавец' : 'Пользователь'}
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <button onClick={() => handleEdit(user)} className="edit-btn">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="delete-btn">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Редактирование пользователя</h2>
                        <form onSubmit={handleSubmit}>
                            <label>
                                Email:
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Имя:
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Фамилия:
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Роль:
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">Пользователь</option>
                                    <option value="seller">Продавец</option>
                                    <option value="admin">Администратор</option>
                                </select>
                            </label>
                            <div className="modal-buttons">
                                <button type="button" onClick={() => setModalOpen(false)}>Отмена</button>
                                <button type="submit">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;