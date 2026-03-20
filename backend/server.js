const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const JWT_SECRET = 'your-secret-key-change-this-in-production';
const REFRESH_SECRET = 'your-refresh-secret-key-change-this-in-production';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

const refreshTokens = new Set();

app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина',
            version: '1.0.0',
            description: 'Полное CRUD API для управления товарами',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
            console.log('Body:', req.body);
        }
    });
    next();
});

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role || 'user'  // Добавляем роль в токен
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role || 'user'
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN
        }
    );
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Отсутствует или неверный заголовок авторизации' });
    }
    
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Не авторизован' });
        }
        
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: 'Доступ запрещен. Недостаточно прав.',
                requiredRoles: allowedRoles,
                yourRole: userRole
            });
        }
        
        next();
    };
}


// Товары
let products = [
    { id: nanoid(6), name: 'Январь', category: 'Месяца', description: 'Неприятный, мерзлый(но у меня др)', price: 100, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2318035625/display_1500/stock-photo-frosty-snowy-trees-on-snowy-meadows-in-a-park-early-cold-morning-in-january-in-an-urban-area-2318035625.jpg'},
    { id: nanoid(6), name: 'Февраль', category: 'Месяца', description: 'Вроде конец зимы, а все равно неприятно', price: 150, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2722452063/display_1500/stock-photo-a-calendar-for-february-with-the-date-february-th-marked-with-a-red-heart-symbol-2722452063.jpg'},
    { id: nanoid(6), name: 'Март', category: 'Месяца', description: 'Небольшое тепло, оттепель, крутой', price: 300, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2564030329/display_1500/stock-photo--march-year-calendar-day-illustration-2564030329.jpg'},
    { id: nanoid(6), name: 'Апрель', category: 'Месяца', description: 'Тепло, сухо, приятно жить', price: 500, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2414809297/display_1500/stock-vector-hello-april-welcome-april-hello-spring-april-vector-illustration-2414809297.jpg'},
    { id: nanoid(6), name: 'Май', category: 'Месяца', description: 'Уже становится жарко, но пока терпимо', price: 600, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2607951387/display_1500/stock-photo-may-small-spiral-desktop-calendar-time-and-business-concept-2607951387.jpg'},
    { id: nanoid(6), name: 'Июнь', category: 'Месяца', description: 'Жарень почти в пике, фу', price: 500, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2583850537/display_1500/stock-photo-desk-calendar-for-june-calendar-for-planning-and-managing-every-day-2583850537.jpg'},
    { id: nanoid(6), name: 'Июль', category: 'Месяца', description: 'ЖАРАААААА', price: 600, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2326005523/display_1500/stock-vector-hello-july-welcome-july-vector-illustrations-for-greetings-card-2326005523.jpg'},
    { id: nanoid(6), name: 'Август', category: 'Месяца', description: 'Приятное тепло, дожди, но последний месяц лета', price: 700, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2152098053/display_1500/stock-photo-august-handwritten-on-the-soft-beach-sand-with-a-soft-lapping-wave-2152098053.jpg'},
    { id: nanoid(6), name: 'Сентябрь', category: 'Месяца', description: 'Начинается учеба, кринж', price: 450, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2613802633/display_1500/stock-photo-september-small-spiral-desktop-calendar-time-and-business-concept-2613802633.jpg'},
    { id: nanoid(6), name: 'Октябрь', category: 'Месяца', description: 'К учебе уже привыкаешь, и погодка норм', price: 420, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/708413443/display_1500/stock-vector-hello-october-card-708413443.jpg'},
    { id: nanoid(6), name: 'Ноябрь', category: 'Месяца', description: 'Погода уже хуже, но все равно приятная', price: 400, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/1943714341/display_1500/stock-photo-november-month-on-calendar-page-with-pencil-business-planning-appointment-meeting-concept-1943714341.jpg'},
    { id: nanoid(6), name: 'Декабрь', category: 'Месяца', description: 'Пока не холодно, новый год и вообще крутотень', price: 401, stock: 1, imageUrl: 'https://www.shutterstock.com/shutterstock/photos/2593106497/display_1500/stock-photo-december-resolution-strategy-solution-goal-business-and-holidays-date-month-december-2593106497.jpg'}
];

let users = [
    {
        id: nanoid(6),
        email: 'admin@example.com',
        first_name: 'Админ',
        last_name: 'Системы',
        role: 'admin',
        hashedPassword: '$2b$10$DFPmubxiUOeqEgwTE/mf8ef7cZL0AIaZJVl/3XA1jh/s9rKlvcB2a'
    },
    {
        id: nanoid(6),
        email: 'seller@example.com',
        first_name: 'Иван',
        last_name: 'Петров',
        role: 'seller',
        hashedPassword: '$2b$10$DFPmubxiUOeqEgwTE/mf8ef7cZL0AIaZJVl/3XA1jh/s9rKlvcB2a'
    },
    {
        id: nanoid(6),
        email: 'user@example.com',
        first_name: 'Петр',
        last_name: 'Иванов',
        role: 'user',
        hashedPassword: '$2b$10$DFPmubxiUOeqEgwTE/mf8ef7cZL0AIaZJVl/3XA1jh/s9rKlvcB2a'
    }
];

async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: 'Товар не найден' });
        return null;
    }
    return product;
}

function findUserOr404(id, res) {
    const user = users.find(u => u.id === id);
    if (!user) {
        res.status(404).json({ error: 'Пользователь не найден' });
        return null;
    }
    return user;
}


/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров (доступно всем авторизованным)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get('/api/products', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает товар по ID (доступно всем авторизованным)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Данные товара
 */
app.get('/api/products/:id', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый товар (только продавец и админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Товар успешно создан
 */
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const { name, category, description, price, stock, imageUrl } = req.body;

    if (!name || !category || !price) {
        return res.status(400).json({ error: 'Название, категория и цена обязательны' });
    }
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description?.trim() || '',
        price: Number(price),
        stock: Number(stock) || 0,
        imageUrl: imageUrl?.trim() || ''
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновляет товар (только продавец и админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Обновленный товар
 */
app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    
    const { name, category, description, price, stock, imageUrl } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (imageUrl !== undefined) product.imageUrl = imageUrl.trim();
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар (только админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       204:
 *         description: Товар успешно удален
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const exists = products.some(p => p.id === req.params.id);
    if (!exists) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя (доступно всем)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: newuser@example.com
 *                 description: Email пользователя
 *               first_name:
 *                 type: string
 *                 example: Иван
 *                 description: Имя
 *               last_name:
 *                 type: string
 *                 example: Петров
 *                 description: Фамилия
 *               password:
 *                 type: string
 *                 example: mypassword123
 *                 description: Пароль (минимум 6 символов)
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *       400:
 *         description: Неверные данные или email уже существует
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    try {
        const hashedPassword = await hashPassword(password);

        const newUser = {
            id: nanoid(6),
            email,
            first_name,
            last_name,
            role: 'user', 
            hashedPassword
        };
        
        users.push(newUser);

        const { hashedPassword: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему (доступно всем)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверный пароль
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    try {
        const isValid = await verifyPassword(password, user.hashedPassword);
        
        if (isValid) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            
            refreshTokens.add(refreshToken);

            const { hashedPassword: _, ...userWithoutPassword } = user;
            
            res.json({ 
                accessToken,
                refreshToken,
                user: userWithoutPassword 
            });
        } else {
            res.status(401).json({ error: 'Неверный пароль' });
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление пары токенов (доступно всем)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Успешное обновление токенов
 */
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken is required' });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        
        const user = users.find(u => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        refreshTokens.delete(refreshToken);
        
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({ 
            error: 'Invalid or expired refresh token' 
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе (доступно авторизованным)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 */
app.get('/api/auth/me', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const { hashedPassword: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 */
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user);
    res.json(usersWithoutPasswords);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Данные пользователя
 */
app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = findUserOr404(req.params.id, res);
    if (!user) return;
    
    const { hashedPassword, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию пользователя (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Обновленный пользователь
 */
app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const user = findUserOr404(req.params.id, res);
    if (!user) return;
    
    const { email, first_name, last_name, role } = req.body;
    
    if (email !== undefined) user.email = email;
    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (role !== undefined && ['user', 'seller', 'admin'].includes(role)) {
        user.role = role;
    }
    
    const { hashedPassword, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать (удалить) пользователя (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       204:
 *         description: Пользователь удален
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = findUserOr404(req.params.id, res);
    if (!user) return;

    if (user.id === req.user.sub) {
        return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }
    
    users = users.filter(u => u.id !== req.params.id);
    res.status(204).send();
});

app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Документация Swagger: http://localhost:${port}/api-docs`);
    console.log(`Товаров в базе: ${products.length}`);
    console.log(`Пользователей в базе: ${users.length}`);
    console.log(`Access token expires in: ${ACCESS_EXPIRES_IN}`);
    console.log(`Refresh token expires in: ${REFRESH_EXPIRES_IN}`);
    console.log(`Роли: admin (админ), seller (продавец), user (пользователь)`);
});