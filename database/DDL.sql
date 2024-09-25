
DROP TABLE IF EXISTS Purchase_Items;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Devices;
DROP TABLE IF EXISTS Songs;
DROP TABLE IF EXISTS Albums;
DROP TABLE IF EXISTS Artists;
DROP TABLE IF EXISTS Labels;
DROP TABLE IF EXISTS Purchases;
DROP TABLE IF EXISTS Customers;

CREATE TABLE Customers(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255)
);

CREATE TABLE Purchases(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    date_time DATETIME NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES Customers(id) ON DELETE CASCADE
);

CREATE TABLE Labels(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE Artists(
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    label_id INT,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY(label_id) REFERENCES Labels(id) ON DELETE CASCADE
);

CREATE TABLE Albums(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    artist_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY(artist_id) REFERENCES Artists(id) ON DELETE CASCADE
);

CREATE TABLE Songs(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    album_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(9, 2) NOT NULL,
    FOREIGN KEY(album_id) REFERENCES Albums(id) ON DELETE CASCADE,
    CONSTRAINT positive CHECK (price >= 0)
);

CREATE TABLE Devices(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(9, 2) NOT NULL,
    stock INT NOT NULL,
    CONSTRAINT positive CHECK (price >= 0 AND stock >= 0)
);

CREATE TABLE Items(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    device_id INT,
    song_id INT,
    album_id INT,
    FOREIGN KEY(device_id) REFERENCES Devices(id) ON DELETE CASCADE,
    FOREIGN KEY(album_id) REFERENCES Albums(id) ON DELETE CASCADE,
    FOREIGN KEY(song_id) REFERENCES Songs(id) ON DELETE CASCADE,
    CONSTRAINT unique_item CHECK (device_id != NULL XOR album_id != NULL XOR song_id != NULL)
);

CREATE TABLE Purchase_Items(
    purchase_id INT NOT NULL,
    item_id INT NOT NULL,
    price DECIMAL(9, 2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY(purchase_id) REFERENCES Purchases(id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES Items(id) ON DELETE CASCADE,
    CONSTRAINT primary_key PRIMARY KEY (purchase_id, item_id),
    CONSTRAINT positive CHECK (price >= 0 AND quantity >= 0)
);

INSERT INTO Customers (name, email)
VALUES
    ('Thomas K.', 'tomk@gmail.com'),
    ('Brianna W.', 'brainnaw@gmail.com'),
    ('Kyle C.', 'kyle@gmail.com'),
    ('James A.', 'james12@gmail.com'),
    (NULL, NULL);

INSERT INTO Purchases(customer_id, date_time)
VALUES
    (2, '2023-01-12 08:04:02'),
    (3, '2023-01-14 16:08:04'),
    (1, '2023-01-14 11:57:12'),
    (4, '2023-01-15 16:32:08'),
    (4, '2023-01-16 16:37:18'),
    (5, '2023-01-16 17:17:55');

INSERT INTO Labels(name)
VALUES
    ('Reprise Records'),
    ('Vagrant Records'),
    ('Warner Records');

INSERT INTO Artists(label_id, name)
VALUES
    (1, 'Green Day'),
    (NULL, 'Taylor Swift'),
    (2, 'The Get Up Kids'),
    (3, 'Disturbed');

INSERT INTO Albums(artist_id, name)
VALUES
    (1, 'American Idiot'),
    (2, 'Midnights'),
    (3, 'Something to Write Home About'),
    (4, 'Immortalized');

INSERT INTO Songs(album_id, name, price)
VALUES
    (1, 'American Idiot', 1.00),
    (1, 'Jesus of Suburbia', 0.60),
    (1, 'Holiday', 1.00),
    (2, 'Anti-Hero', 1.00),
    (3, 'Ten Minutes', 1.00),
    (4, 'The Sound of Silence', 1.20);

INSERT INTO Devices(name, price, stock)
VALUES
    ('record_player', 80, 2000),
    ('blank_record', 25, 10000),
    ('usb_drive', 10, 5000);

INSERT INTO Items(device_id, album_id, song_id)
VALUES
    (1, NULL, NULL),
    (2, NULL, NULL),
    (3, NULL, NULL),
    (NULL, 1, NULL),
    (NULL, 2, NULL),
    (NULL, 3, NULL),
    (NULL, NULL, 1),
    (NULL, NULL, 2),
    (NULL, NULL, 3);

INSERT INTO Purchase_Items(purchase_id, item_id, price, quantity)
VALUES
    (1, 1, 240.00, 3),
    (1, 2, 50.00, 2),
    (2, 3, 10.00, 1),
    (3, 4, 2.60, 1),
    (4, 5, 2.00, 2),
    (5, 6, 1.00, 1),
    (6, 7, 1.00, 1);
