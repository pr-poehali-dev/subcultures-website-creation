-- Изменяем тип колонки password на TEXT для хранения bcrypt хешей
ALTER TABLE users ALTER COLUMN password TYPE TEXT;