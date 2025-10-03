
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    icon VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_gifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    gift_id INTEGER REFERENCES gifts(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO gifts (name, description, price, icon, category) VALUES
('Граффити Баллон', 'Эксклюзивный баллон для создания уличного искусства', 150, 'Paintbrush', 'art'),
('Готик Кулон', 'Мистический кулон в готическом стиле', 250, 'Skull', 'accessories'),
('Эмо Наклейки', 'Набор стикеров с эмоциональными рисунками', 100, 'Sticker', 'art'),
('Музыкальный Плейлист', 'Эксклюзивная подборка треков субкультуры', 200, 'Music', 'music'),
('Скейтборд', 'Кастомный скейт с граффити дизайном', 500, 'Plane', 'sport'),
('Футболка Субкультура', 'Уникальная футболка с принтом', 300, 'Shirt', 'clothes');
