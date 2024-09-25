var fs = require('fs')
var express = require('express')
var app = express()
PORT = 3831
app.use(express.json())
app.use(express.urlencoded({extended: true}))

var db = require('./database/db-connector')

const { engine } = require('express-handlebars');
var exphbs = require('express-handlebars');     // Import express-handlebars
app.engine('.hbs', engine({extname: ".hbs"}));  // Create an instance of the handlebars engine to process templates
app.set('view engine', '.hbs');                 // Tell express to use the handlebars engine whenever it encounters a *.hbs file.

app.use(express.static('public'));


//Formatting function to display NULL information
replace_null = x => x == null || Number.isNaN(x) || x == "\"\"" ? 'NULL' : x

// General purpose function to print the queries into the console
log_query = (error, query) => console.log(error ? error : query)

// A map from attribute names to functions that convert a string to the required type
types = {}
string = x => "\"" + x + "\""
insert_types = (ks, f) => {ks.map(k => types[k] = f)}
[
    [['name', 'email'], string],
    [
        [
            'id', 'customer_id', 'label_id', 'artist_id',
            'album_id', 'stock', 'device_id', 'song_id',
            'purchase_id', 'item_id', 'quantity'
        ],
        k => parseInt(k, 10)
    ],
    [['date_time'], x => string(x.replace('T', ' '))],
    [['price'], k => parseFloat(k, 10).toFixed(2)]
].forEach(pair => insert_types(pair[0], pair[1]))

// Ensures that data sent to handlebars is in the correct format and order
order = (rows, fields) => rows.map(
    row => fields.map(
        field => {
            cell = replace_null(row[field['name']])
            if (field['name'] == 'price') { cell = types['price'](cell) }
            return cell
        }
    )
)


// each list must be in desired column order
values = {
    Albums: ['artist_id', 'name'],
    Artists: ['label_id', 'name'],
    Customers: ['name', 'email'],
    Devices: ['name', 'price', 'stock'],
    Items: ['device_id', 'song_id', 'album_id'],
    Labels: ['name'],
    Purchase_Items: ['purchase_id', 'item_id', 'price', 'quantity'],
    Purchases: ['customer_id', 'date_time'],
    Songs: ['album_id', 'name', 'price']
}

// modular get function for routing tables
get = (table, res, fk = null) => {
    query = "SELECT * FROM " + table
    db.pool.query(query, (error, rows, fields) => {
        log_query(error, query)
        res.render(table.toLowerCase(), {
            table: table,
            header: fields.map(field => field['name']),
            data: order(rows, fields),
            fk: fk,
            default: ""
        })
    })
}

// helper to provide the id and name attributes of an FK to handlebars
_get = (pk, fk, res) => {
    query = "SELECT id, name FROM " + fk
    db.pool.query(query, (error, rows, fields) => {
        log_query(error, query)
        fks = {}
        fks[fk.toLowerCase()] = order(rows, fields)
        !error && get(pk, res, fks)
    })
}

app.get('/', (req, res) => res.render('index', {table: 'Index'}))
app.get('/customers', (req, res) => get("Customers", res))
app.get('/purchases', (req, res) => _get("Purchases", 'Customers', res))
app.get('/purchase_items', (req, res) => {
    purchases = "SELECT id FROM Purchases"
    items = "SELECT id FROM Items"
    ids = "SELECT purchase_id, item_id FROM Purchase_Items"
    db.pool.query(purchases, (purchases_error, purchases_rows, purchases_fields) => {
        log_query(purchases_error, purchases)
        db.pool.query(items, (items_error, items_rows, items_fields) => {
            log_query(items_error, items)
            db.pool.query(ids, (ids_error, ids_rows, ids_fields) => {
                log_query(ids_error, ids)
                !(purchases_error || items_error || ids_error) && get("Purchase_Items", res, {
                    purchases: order(purchases_rows, purchases_fields),
                    items: order(items_rows, items_fields),
                    ids: order(ids_rows, ids_fields)
                })
            })
        })
    })
})
app.get('/items', (req, res) => {
    devices = "SELECT id, name FROM Devices WHERE id NOT IN (SELECT device_id FROM Items where device_id)"
    songs = "SELECT id, name FROM Songs WHERE id NOT IN (SELECT song_id FROM Items WHERE song_id)"
    albums = "SELECT id, name FROM Albums WHERE id NOT IN (SELECT album_id FROM Items where album_id)"
    db.pool.query(devices, (devices_error, devices_rows, devices_fields) => {
        log_query(devices_error, devices)
        db.pool.query(songs, (songs_error, songs_rows, songs_fields) => {
            log_query(songs_error, songs)
            db.pool.query(albums, (albums_error, albums_rows, albums_fields) => {
                log_query(albums_error, albums)
                !(devices_error || songs_error || albums_error) && get("Items", res, {
                    devices: order(devices_rows, devices_fields),
                    songs: order(songs_rows, songs_fields),
                    albums: order(albums_rows, albums_fields),
                })
            })
        })
    })
})
app.get('/devices', (req, res) => get("Devices", res))
app.get('/songs', (req, res) => _get('Songs', 'Albums', res))
app.get('/albums', (req, res) => _get("Albums", "Artists", res))
app.get('/artists', (req, res) => _get("Artists", "Labels", res))
app.get('/labels', (req, res) => get("Labels", res))

// run query and then refresh the page
post = (res, query, table) => {
    db.pool.query(query, error => log_query(error, query))
    res.redirect("/" + table.toLowerCase())
}

// modular insert function to insert into tables
app.post('/insert', (req, res, next) => {
    data = req.body
    table = data['table']
    query = "INSERT INTO " + table + " (" + values[table].join(", ") + ") VALUES (" +
        values[table].map(value => replace_null(types[value](data[value]))).join(", ") + ")"
    post(res, query, table)
})

app.post('/insert_purchase_items', (req, res, next) => {
    data = req.body
    query = "SELECT * FROM Items WHERE id = " + data['item_id']
    db.pool.query(query, (error, rows, fields) => {
        log_query(error, query)
        // name of the table where the FK is not null
        table = rows[0]['device_id'] ? "Devices" : rows[0]['song_id'] ? "Songs" : 'Albums'
        // id of the not null attribute
        eID = rows[0]['device_id'] ? rows[0]['device_id'] : rows[0]['song_id'] ? rows[0]['song_id'] : rows[0]['album_id']
        query = table === 'Albums' ? query = "SELECT * FROM Songs WHERE album_id = " + eID : "SELECT price FROM " + table + " WHERE id = " + eID

        db.pool.query(query, (error, rows, fields) => {
            log_query(error, query)
            // calculate album price from the songs within it
            if (table === 'Albums') {
                let x = 0
                for (let i = 0; i < rows.length; i++) { x += rows[i]['price'] }
                data['price'] = x * data['quantity']
            }
            else { data['price'] = rows[0]['price'] * data['quantity'] }
            table = data['table']
            query = "INSERT INTO " + table + " (" + values[table].join(", ") + ") VALUES (" +
            values[table].map(value => replace_null(types[value](data[value]))).join(", ") + ")"
            post(res, query, table)
        })
    })
})

// generic DELETE handler
app.post('/delete', (req, res, next) => {
    data = req.body
    table = data['table']
    id = data['id']
    query = "DELETE FROM " + table + " WHERE id = " + id
    post(res, query, table)
})

// Delete solely for purchase_items, as it doesn't follow the same format as other tables (two FKs to make a PK)
app.post('/delete_purchase_items', (req, res, next) => {
    data = req.body
    table = data['table']
    ids = data['ids'].split(',')
    purchase_id = ids[0]
    item_id = ids[1]
    query = "DELETE FROM " + table + " WHERE purchase_id = " + purchase_id + " AND item_id = " + item_id
    post(res, query, table)
})

// Update function for purchase items. Receives data from form, then writes the query, then posts it. 
app.post('/update_purchase_items', (req, res, next) => {
    data = req.body
    table = data['table']
    quantity = data['quantity']
    ids = data['ids'].split(',')
    purchase_id = ids[0]
    item_id = ids[1]

    query = "SELECT price, quantity FROM " + table + " WHERE purchase_id = " + purchase_id + " AND item_id = " + item_id
    db.pool.query(query, (error, rows, fields) => {
        log_query(error, query)
        old_price = rows[0]['price']
        old_quantity = rows[0]['quantity']

        // new_price = (old_price / old_quantity) * new_quantity
        query = "UPDATE " + table + " SET quantity = "
            + quantity + ", price = " + (old_price / old_quantity) * quantity +
            " WHERE purchase_id = " + purchase_id + " AND item_id = " + item_id

        post(res, query, table)
    })
})

// Update function for artists. Queries and then posts updated artist row
app.post('/update_artists', (req, res, next) => {
    table = req.body['table']
    id = req.body['id']
    label_id = req.body['label_id']
    query = "UPDATE " + table + " SET label_id = " + label_id + " WHERE id = " + id
    post(res, query, table)
})

// dynamically search for songs in a given album
app.post('/search', (req, res) => {
    // no album to search
    if (req.body['album'] == "") { res.redirect('/songs') }
    // search for songs in the album
    else {
        data = req.body
        table = data['table']

        album = data['album']
        album = album.slice(1, album.length - 1).split(", ")
        album = JSON.parse("[" + album[0] + ", \"" + album[1] + "\"]")

        album_query = "SELECT id, name FROM Albums"
        song_query = "SELECT * FROM " + table + " WHERE album_id = " + album[0]
        db.pool.query(album_query, (album_error, album_rows, album_fields) => {
            log_query(album_error, album_query)
            db.pool.query(song_query, (song_error, song_rows, song_fields) => {
                log_query(song_error, song_query)
                res.render(table.toLowerCase(), {
                    table: table,
                    header: song_fields.map(field => field['name']),
                    data: order(song_rows, song_fields),
                    fk : {albums: order(album_rows, album_fields)},
                    default: album[1]
                })
            })
        })
    }
})

// run database/DDL.sql to reset the database
app.post('/reset', (req, res) => fs.readFile('database/DDL.sql', 'utf8', (error, query) => {
    if (error) { console.log(error) }
    db.pool.query(query, (error, rows, fields) => {
        log_query(error, query)
    })
    res.redirect('/')
}))

app.listen(PORT, function(){
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
})
