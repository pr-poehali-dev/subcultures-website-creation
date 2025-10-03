-- Добавление колонки is_admin для администраторов
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Добавление колонки is_banned для блокировки пользователей
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;

-- Делаем пользователя "админ" администратором
UPDATE users SET is_admin = TRUE WHERE username = 'админ';