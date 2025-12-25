CREATE DATABASE IF NOT EXISTS krash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE krash;

CREATE TABLE drops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rarity VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL,
    icon VARCHAR(255),
    lottie_anim VARCHAR(255) NULL,
    UseInUpgrade BOOLEAN NOT NULL DEFAULT FALSE,
    UseInLive BOOLEAN NOT NULL DEFAULT FALSE,
    IsNft BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL,
    gradient_colors JSON,
    main_image VARCHAR(255),
    lottie_anim VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE case_drops (
    case_id INT NOT NULL,
    drop_id INT NOT NULL,
    chance FLOAT NOT NULL,
    position INT NOT NULL DEFAULT 0;
    PRIMARY KEY (case_id, drop_id),
    CONSTRAINT fk_case_drops_case
        FOREIGN KEY (case_id) REFERENCES cases(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_case_drops_drop
        FOREIGN KEY (drop_id) REFERENCES drops(id)
        ON DELETE CASCADE
);


CREATE TABLE withdraw_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- user
    user_id INT NOT NULL,
    tg_id VARCHAR(255) NOT NULL,
    username VARCHAR(255),

    -- что выводят (ОДНО ИЗ ДВУХ)
    ton_amount DECIMAL(12,4) NULL,
    drop_id INT NULL,

    -- тип вывода
    type ENUM('ton', 'drop') NOT NULL,

    -- статус заявки
    status ENUM('pending', 'approved', 'rejected', 'processed') NOT NULL DEFAULT 'pending',

    -- служебное
    comment VARCHAR(255) NULL,          -- комментарий админа
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,

    CONSTRAINT fk_wr_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_wr_drop
        FOREIGN KEY (drop_id)
        REFERENCES drops(id)
        ON DELETE SET NULL
);



CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tg_id VARCHAR(255) UNIQUE,
    username VARCHAR(255),
    firstname VARCHAR(255),
    balance FLOAT DEFAULT 0,
    level INT NOT NULL DEFAULT 1,
    xp INT NOT NULL DEFAULT 0,
    refcount INT DEFAULT 0,
    refLink VARCHAR (50),
    refererID VARCHAR(250),
    totalDEP FLOAT,
    inventory JSON,
    url_image VARCHAR(255) NULL,
    json_anim VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE crash_rounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_number INT NULL,
    crash_point FLOAT,
    started_at DATETIME,
    ended_at DATETIME,
    total_bet FLOAT,
    total_payout FLOAT
);

CREATE TABLE crash_bets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    user_id INT NOT NULL,
    amount FLOAT NOT NULL,
    cashout_multiplier FLOAT,
    profit FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 🔥 Новые поля
    gift BOOLEAN NOT NULL DEFAULT FALSE,
    gift_id INT NULL,
    auto_cashout_x FLOAT NULL,   -- 🔥 вот этого не хватало

    CONSTRAINT fk_bet_round
        FOREIGN KEY (round_id) REFERENCES crash_rounds(id)
        ON DELETE CASCADE
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(255) NOT NULL,
    amount FLOAT NOT NULL,
    balance_before FLOAT,
    balance_after FLOAT,
    related_round_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tx_round
        FOREIGN KEY (related_round_id) REFERENCES crash_rounds(id)
        ON DELETE SET NULL
);

CREATE TABLE crash_bots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) NOT NULL,
    min_bet FLOAT DEFAULT 0,
    max_bet FLOAT DEFAULT 5
);

CREATE TABLE promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- ABC123
    type ENUM(
        'deposit_percent',  -- +50% к депозиту
        'deposit_fixed',    -- +500 TON
        'freespin',         -- N бесплатных игр
    'ref_fixed',
    'freecase'
        ) NOT NULL,

    value FLOAT NOT NULL,         -- 50 / 500 / N / 1.5
    wager_games INT DEFAULT 0,    -- сколько игр нужно отыграть
    max_uses INT DEFAULT NULL,    -- лимит активаций
    used_count INT DEFAULT 0,

    active BOOLEAN DEFAULT TRUE,
    starts_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ends_at DATETIME DEFAULT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE deposits (
  id INT NOT NULL AUTO_INCREMENT,

  -- user
  user_id INT NOT NULL,
  username VARCHAR(64) NOT NULL,

  -- deposit info
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(16) NOT NULL,           -- XTR / TON / USDT
  type_deposit VARCHAR(32) NOT NULL,       -- stars / ton / cryptobot

  -- payment identifiers
  payload VARCHAR(128) UNIQUE,
  invoice_id VARCHAR(128) UNIQUE,

  -- status
  status VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending / success / failed

  -- provider meta
  provider_tx_id VARCHAR(128),
  comment VARCHAR(255),

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,

  PRIMARY KEY (id),

  KEY ix_deposits_user_id (user_id),
  KEY ix_deposits_status (status),
  KEY ix_deposits_user_status (user_id, status),

  CONSTRAINT fk_deposits_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;




CREATE TABLE upgrade_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    from_drop_id INT NOT NULL,
    to_drop_id INT NOT NULL,

    chance FLOAT NOT NULL,        -- шанс на момент апгрейда (0.15 и т.п)
    roll FLOAT NOT NULL,          -- фактический roll (0–1)

    result ENUM('win','lose') NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ul_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ul_from_drop
        FOREIGN KEY (from_drop_id)
        REFERENCES drops(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ul_to_drop
        FOREIGN KEY (to_drop_id)
        REFERENCES drops(id)
        ON DELETE CASCADE
);


CREATE TABLE user_daily_games (
    user_id INT NOT NULL,
    day_date DATE NOT NULL,
    games_played INT DEFAULT 0,
    was_free_spin BOOLEAN NOT NULL DEFAULT FALSE,
    was_free_case BOOLEAN NOT NULL DEFAULT FALSE,
     usedPromoToday BOOLEAN NOT NULL DEFAULT FALSE,
     usedFirst BOOLEAN NOT NULL DEFAULT FALSE,
     usedTenDays BOOLEAN NOT NULL DEFAULT FALSE;
    PRIMARY KEY (user_id, day_date),

    CONSTRAINT fk_udg_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE user_promos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    promo_id INT NULL, -- 👈 теперь NULL допустим (для рефов)

    referral_owner_id INT NULL, -- 👈 НОВОЕ ПОЛЕ

    activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,

    remaining_wager_games INT DEFAULT 0,
    remaining_freespins INT DEFAULT 0,

    UNIQUE (user_id, promo_id),

    CONSTRAINT fk_up_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_up_promo FOREIGN KEY (promo_id)
        REFERENCES promo_codes(id) ON DELETE CASCADE,

    CONSTRAINT fk_up_ref_owner FOREIGN KEY (referral_owner_id)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE roulette_spins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    drop_id INT NOT NULL,
    is_free BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rs_drop
        FOREIGN KEY (drop_id)
        REFERENCES drops(id)
        ON DELETE CASCADE
);

CREATE TABLE pvp_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    bot_id INT NOT NULL,
    bot_bet FLOAT NOT NULL,

    user_bet FLOAT NOT NULL,
    gift BOOLEAN DEFAULT FALSE,
    gift_id INT NULL,

    result ENUM('win','lose','draw') NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pvp_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pvp_bot
        FOREIGN KEY (bot_id) REFERENCES crash_bots(id)
        ON DELETE CASCADE
);

CREATE TABLE referral_promos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_user_id INT NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    reward FLOAT NOT NULL, -- фикс TON
    active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_ref_owner FOREIGN KEY (owner_user_id)
        REFERENCES users(id) ON DELETE CASCADE
);
