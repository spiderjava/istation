var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.status(200).send({
    success: 'true',
    message: 'IStation API Services Running'
  });
});

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

app.get('/v1/InIStationProbe', async (req, res) => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT * FROM wifidata');
    res.render('pages/db', result);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});