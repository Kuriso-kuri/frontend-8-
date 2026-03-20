import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import './UsersPage.scss';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
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
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.updateUser(editingUser.id, editingUser);
            await fetchUsers();
            setShowEditModal(false);
            setEditingUser(null);
        } catch (error) {
            console.error('Ошибка обновления пользователя:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите заблокировать этого пользователя?')) {
            try {
                await api.deleteUser(id);
                await fetchUsers();
            } catch (error) {
                console.error('Ошибка удаления пользователя:', error);
            }
        }
    };

    const handleChange = (e) => {
        setEditingUser({
            ...editingUser,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="users-page">
            <h1>Управление пользователями</h1>
            
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
                                <td className="user-id">{user.id}</td>
                                <td>{user.email}</td>
                                <td>{user.first_name}</td>
                                <td>{user.last_name}</td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role === 'admin' ? 'Админ' : 
                                         user.role === 'seller' ? 'Продавец' : 'Пользователь'}
                                    </span>
                                </td>
                                <td className="user-actions">
                                    <button 
                                        onClick={() => handleEdit(user)}
                                        className="edit-btn"
                                        title="Редактировать"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(user.id)}
                                        className="delete-btn"
                                        title="Заблокировать"
                                    >
                                        🚫
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showEditModal && editingUser && (
                <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Редактирование пользователя</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="modal-form">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editingUser.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Имя</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={editingUser.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </