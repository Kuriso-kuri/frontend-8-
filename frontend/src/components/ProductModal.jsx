import React, { useEffect, useState } from 'react';
import './ProductModal.scss';

const ProductModal = ({ open, mode, initialProduct, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (!open) return;
        
        if (initialProduct) {
            setName(initialProduct.name || '');
            setCategory(initialProduct.category || '');
            setDescription(initialProduct.description || '');
            setPrice(initialProduct.price?.toString() || '');
            setStock(initialProduct.stock?.toString() || '');
            setImageUrl(initialProduct?.imageUrl || '');
        } else {
            setName('');
            setCategory('');
            setDescription('');
            setPrice('');
            setStock('');
            setImageUrl('');
        }
    }, [open, initialProduct]);

    if (!open) return null;

    const title = mode === 'edit' ? 'Редактировать товар' : 'Создать товар';

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        const trimmedCategory = category.trim();
        const trimmedDescription = description.trim();
        const parsedPrice = Number(price);
        const parsedStock = Number(stock);
        const trimmedImageUrl = imageUrl.trim();

        if (!trimmedName) {
            alert('Введите название товара');
            return;
        }
        if (!trimmedCategory) {
            alert('Введите категорию');
            return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            alert('Введите корректную цену (больше 0)');
            return;
        }
        if (!Number.isFinite(parsedStock) || parsedStock < 0) {
            alert('Введите корректное количество (0 или больше)');
            return;
        }

        onSubmit({
            id: initialProduct?.id,
            name: trimmedName,
            category: trimmedCategory,
            description: trimmedDescription,
            price: parsedPrice,
            stock: parsedStock,
            imageUrl: trimmedImageUrl
        });
    };

    return (
        <div className="modal-backdrop" onMouseDown={onClose}>
            <div 
                className="modal-content" 
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-header">
                    <div className="modal-title">{title}</div>
                    <button 
                        className="modal-close" 
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <label className="modal-label">
                        Название товара *
                        <input
                            type="text"
                            className="modal-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например, iPhone 15"
                            autoFocus
                        />
                    </label>

                    <label className="modal-label">
                        Категория *
                        <input
                            type="text"
                            className="modal-input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Например, Смартфоны"
                        />
                    </label>

                    <label className="modal-label">
                        Описание
                        <textarea
                            className="modal-input modal-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Описание товара..."
                            rows="3"
                        />
                    </label>

                    <label className="modal-label">
                        Ссылка на изображение
                        <input
                            type="text"
                            className="modal-input"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                        <small style={{ opacity: 0.6, fontSize: '12px' }}>
                            Вставьте прямую ссылку на картинку (JPG, PNG)
                        </small>
                    </label>

                    <div className="modal-row">
                        <label className="modal-label">
                            Цена * (₽)
                            <input
                                type="number"
                                className="modal-input"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="1000"
                                min="1"
                                step="1"
                            />
                        </label>

                        <label className="modal-label">
                            Количество *
                            <input
                                type="number"
                                className="modal-input"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="10"
                                min="0"
                                step="1"
                            />
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="modal-btn modal-btn-secondary" 
                            onClick={onClose}
                        >
                            Отмена
                        </button>
                        <button 
                            type="submit" 
                            className="modal-btn modal-btn-primary"
                        >
                            {mode === 'edit' ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;