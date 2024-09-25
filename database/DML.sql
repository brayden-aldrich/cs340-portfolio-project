
-- For all queries, any name prefixed by `:` indicates a dynamic value to be inserted later.

-- 9 INSERT queries, one for each table.
-- Insert a new row into a table.
INSERT INTO Customers (name, email)
VALUES (:name, :email);

INSERT INTO Purchases(customer_id, date_time)
VALUES (:customer_id, :date_time);

INSERT INTO Labels(name)
VALUES (:name);

INSERT INTO Artists(label_id, name)
VALUES (:label_id, :name);

INSERT INTO Albums(artist_id, name)
VALUES (:artist_id, :name);

INSERT INTO Songs(album_id, name, price)
VALUES (:album_id, :name, :price);

INSERT INTO Devices(name, price, stock)
VALUES (:name, :price, :stock);

INSERT INTO Items(device_id, album_id, song_id)
VALUES (:device_id, :album_id, :song_id);

INSERT INTO Purchase_Items(purchase_id, item_id, price, quantity)
VALUES (:purchase_id, :item_id, :price, :quantity);

-- 9 SELECT queries, one for each table.
-- Display an entire table.
SELECT * FROM :table

-- SELECT queries with dynamic properties
SELECT * FROM Items WHERE id = :id
SELECT * FROM Songs WHERE album_id = :album_id
SELECT price FROM :table WHERE id = :id
SELECT id FROM :table
SELECT id, name FROM :table
SELECT id, name FROM :table WHERE id NOT IN (SELECT :table_id FROM Items where :table_id)
SELECT price, quantity FROM :table WHERE purchase_id = :purchase_id AND item_id = :item_id

-- 1 UPDATE query in an M:N relationship
-- Update the quantity and price of an item purchased when a Customer returns some, but not all of an Item.
UPDATE Purchase_Items SET quantity = :quantity, price = :price WHERE purchase_id = :purchase_id AND item_id = :item_id

-- 1 DELETE query in an M:N relationship
-- Delete an Item when a Customer wants to return all of an Item.
DELETE FROM Purchase_Items WHERE purchase_id = :purchase_id AND item_id = :item_id;

-- A generic DELETE query
DELETE FROM :table WHERE id = :id

-- 1 query to implement a NULLable relationship
-- Change an Artist's affilation with a label.
UPDATE Artists SET label_id = :label_id WHERE id = :id;
