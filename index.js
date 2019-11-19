var bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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


app.post('/api/v1/InIStationProbe', (req, res) => {
  console.info(req.body);
  if(!req.body.station_id) {
    return res.status(400).send({
      success: 'false',
      message: 'station_id is required'
    });
  } else if(!req.body.send_time) {
    return res.status(400).send({
      success: 'false',
      message: 'send_time is required'
    });
  }

 return res.status(201).send({
   success: 'true',
   message: 'New wifidata message stored in IStation'
 });
});



app.get('/api/v1/InIStationProbe', async (req, res) => {
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