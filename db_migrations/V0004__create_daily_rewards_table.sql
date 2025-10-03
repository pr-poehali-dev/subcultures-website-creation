-- Создание таблицы для отслеживания ежедневных бонусов
CREATE TABLE IF NOT EXISTS daily_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    last_claim_date DATE NOT NULL,
    UNIQUE(user_id)
);

-- Создание индекса для быстрого поиска
CREATE INDEX idx_daily_rewards_user_id ON daily_rewards(user_id);