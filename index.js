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


app.post('/api/v1/InIStationProbe', async(req, res) => {
  console.info(req.body);
  let istationarray= req.body;
  const client = await pool.connect();
  try {
      for(let i = 0; i < istationarray.length;i++){

          // INSERT VALIDATION RULES
          if(!istationarray[i].station_id) {
            return res.status(400).send({
              success: 'false',
              message: 'station_id is required'
            });
          } else if(!istationarray[i].send_time) {
            return res.status(400).send({
              success: 'false',
              message: 'send_time is required'
            });
          }
          // INSERT END VALIDATION RULES
      

          try {
            await client.query('BEGIN');
            const queryText = 'INSERT INTO wifidata(station_id,station_name,connection_time,send_time,latitude,longitude,mac_address,floor,zone_id,zone_name,gender,age,phone_prefix,social,registration_date)' 
            + 'VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING wifidata_id';
            const dbres = await client.query(queryText, [istationarray[i].station_id,istationarray[i].station_name,istationarray[i].connection_time,istationarray[i].send_time,istationarray[i].latitude,istationarray[i].longitude,istationarray[i].mac_address,istationarray[i].floor,istationarray[i].zone_id,istationarray[i].zone_name,istationarray[i].gender,istationarray[i].age,istationarray[i].phone_prefix,istationarray[i].social,istationarray[i].registration_date]);
            await client.query('COMMIT');
          } catch (e) {
            throw e;
          }     
        }

      } catch (err) {
        console.error(err);
        await client.query('ROLLBACK');
              
        return res.status(400).send({
          success: 'false',
          message: err
        });
      } finally {
        client.release();
      } 

  return res.status(201).send({
    success: 'true',
    message: 'New wifidata message stored in IStation'
  });
  
 
});



app.get('/api/v1/InIStationProbe', async (req, res) => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT * FROM wifidata ORDER BY store_time DESC, LIMIT 3');
    res.render('pages/db', result);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.delete('/api/v1/InIStationProbe', async (req, res) => {
  try {
    const client = await pool.connect()
    const result = await client.query('DELETE FROM wifidata');
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