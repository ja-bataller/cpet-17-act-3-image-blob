const express = require("express");
const mysql = require("mysql");
const bodyParser = require('body-parser')
const fs = require("fs");
var path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


app.use(express.static(__dirname));

// Create MySQL DB Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "test",
});

// Create MySQLDB Motion Table
connection.connect(function (err) {
  if (err) throw err;
  console.log("Database connected successfully.");

  var sql = "CREATE TABLE motion (id INT AUTO_INCREMENT PRIMARY KEY, location VARCHAR(255), date VARCHAR(255), time VARCHAR(255), file_name VARCHAR(255), captured_movement BLOB)";
  connection.query(sql, function (err, result) {
    if (err) {
        console.log("MySQL - Motions Table - Already Exists.");
      // console.log(err);
    } else {
      console.log("MySQL - Motions Table - Created Successfully.");
    }
  });
});

// Index
app.get("/", (req, res) => {
  res.send("PinkCodeX Motion Detector App - Node.js x Python");
});

// Read - All Motion Information
app.get("/motions", (req, res) => {
  connection.query(
    "SELECT * FROM `motion`",
    function (err, results) {

      if (results.length != 0) {
        res.setHeader("Content-Type", "text/html")

        for (let i = 0; i < results.length; i++) {
          var user = `
                ID: ${results[i].id}  <br>
                Location: ${results[i].location} <br>
                Date: ${results[i].date} <br>
                Time: ${results[i].time} <br>
                `
          
          var captured_image = path.join('public', 'img', results[i].file_name);
          res.write(user)
          res.write(`<br><img src=${captured_image}> <br> <br> <br>`);
        }
        res.end()
        

      } else {
        res.send(`There are No Motions captured.`);
      }

    }
  );
});


// Create - Post
app.post('/capture', (req, res) => {
  const {
    location,
    date,
    time,
    file,
    file_name
  } = req.body;

  if (location && date && time && file) {
    connection.connect(function (err) {
      var sql = "INSERT INTO motion (location, date, time, file_name, captured_movement) VALUES ?";
      var values = [
        [
          location, date, time, file_name, file
        ],
      ];
      connection.query(sql, [values], function (err, result) {
        if (err) throw err;
        console.log("Motion Detection successfully saved.");

      });
    });

    // Save the Capture Movement to Public/img Folder
    const buffer = Buffer.from(file, "base64");
    var file_path = path.join(__dirname, 'public', 'img', file_name);
    fs.writeFileSync(file_path + "", buffer)

    res.redirect(307, '/motions');

  } else {
    res.send('Error');
  }
});


app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});