var bodyParser = require('body-parser');
var express = require('express');
var app = express();

// CONNECTION POOL PG
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.PG_MAX_CLIENT,
  idleTimeoutMillis: process.env.PG_IDLETIMEOUT_MILLIS,
  connectionTimeoutMillis: process.env.PG_CONNECTIONTIMEOUT_MILLIS,
  ssl: true
});


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



/* INSERT NEW RECORD INTO DATABASE*/
/* ############################## */
app.post('/api/v1/InIStationProbe', async(req, res) => {
  //console.info(req.body);
  try{     
          let istationarray= req.body;
          if(!Array.isArray(istationarray)){
            throw new Error('Expected an Array of IStationProbe');
          }
          let client = null;
          try {
            client = await pool.connect();
            await client.query('BEGIN');

              for(let i = 0; i < istationarray.length;i++){

                  // INSERT VALIDATION RULES
                  if(!istationarray[i].station_id) {
                    throw new Error('station_id is required');
                  } else if(!istationarray[i].send_time) {
                    throw new Error('send_time is required');
                  }

                  try {
                    const queryText = 'INSERT INTO wifidata(station_id,station_name,connection_time,send_time,latitude,longitude,mac_address,floor,zone_id,zone_name,gender,age,phone_prefix,social,registration_date)' 
                    + 'VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING wifidata_id';
                    const dbres = await client.query(queryText, [istationarray[i].station_id,istationarray[i].station_name,istationarray[i].connection_time,istationarray[i].send_time,istationarray[i].latitude,istationarray[i].longitude,istationarray[i].mac_address,istationarray[i].floor,istationarray[i].zone_id,istationarray[i].zone_name,istationarray[i].gender,istationarray[i].age,istationarray[i].phone_prefix,istationarray[i].social,istationarray[i].registration_date]);
                  } catch (e) {
                    throw e;
                  }     
                }
                await client.query('COMMIT');

              } catch (err) {
                console.error(err);
                await client.query('ROLLBACK');
                      
                return res.status(400).send({
                  success: 'false',
                  message: err.message
                });
              } finally {
                if(client != null){
                  client.release(true);
                }
              } 

          return res.status(201).send({
            success: 'true',
            message: 'New wifidata message stored in IStation'
          });
        } catch (err) {
          return res.status(400).send({
            success: 'false',
            message: err.message
          });
        }
          
});



/* GET LIST OF LAST 100 RECORD */
/* ########################### */
app.get('/api/v1/InIStationProbe', async (req, res) => {
  let client = null;
  try {
    client = await pool.connect()
    const result = await client.query('SELECT * FROM wifidata ORDER BY store_time DESC LIMIT 100');
    res.render('pages/db', result);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }finally{
    if(client != null){
      client.release(true);
    }
  }
});


/* COUNT THE TOTAL RECORDS IN DB */
/* ############################# */
app.get('/api/v1/InIStationProbe/count', async (req, res) => {
  let client = null;
  try {
    client = await pool.connect()
    console.info("Client Count: "+ pool.totalCount + " ---> Client Idle: "+pool.idleCount);
    const result = await client.query('SELECT count(*) FROM wifidata');
    return res.status(201).send({
      success: 'true',
      message: 'Total record in wifidata table: ' + result.rows[0].count
    });
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }finally{
    if(client != null){
      client.release(true);
    }
    console.info("Client Count: "+ pool.totalCount + " ---> Client Idle: "+pool.idleCount);
  }
});



/* DELETE ALL RECORDS INTO THE DB */
/* ############################## */
app.delete('/api/v1/InIStationProbe', async (req, res) => {
  let client = null;
  try {
    client = await pool.connect()
    const result = await client.query('DELETE FROM wifidata');
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  } finally{
    if(client != null){
      client.release(true);
    }
  }
  return res.status(201).send({
    success: 'true',
    message: 'IStation wifi_data DELETED'
  });
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});