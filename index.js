let express = require("express");
let app = require("express")(); 
app.listen(8080);

app.use(express.json()); 


app.get("/", function (req, res) {
  res.sendFile(__dirname + "/documentation.html");
});

const mysql = require("mysql"); 
con = mysql.createConnection({
  host: "localhost", 
  user: "root",
  password: "",
  database: "uppgiftapi", 
  multipleStatements: true,
});

const COLUMNS = ["id", "firstname", "lastname"]; 

app.get("/users", function (req, res) {
  let sql = "SELECT * FROM users"; 
  let condition = createCondition(req.query);
  console.log(sql + condition); 
  // skicka query till databasen
  con.query(sql + condition, function (err, result, fields) {
    res.send(result);
  });
});

let createCondition = function (query) {
  // skapar ett WHERE-villkor utifrån query-parametrar
  console.log(query);
  let output = " WHERE ";
  for (let key in query) {
    if (COLUMNS.includes(key)) {
      // om vi har ett kolumnnamn i vårt query
      output += `${key}="${query[key]}" OR `; // 
    }
  }
  if (output.length == 7) {
    // " WHERE "
    return ""; 
  } else {
    return output.substring(0, output.length - 4); // ta bort sista " OR "
  }
};

// route-parameter, dvs. filtrera efter ID i URL:en
app.get("/users/:id", function (req, res) {
  let sql = "SELECT * FROM users WHERE id=" + req.params.id;
  console.log(sql);
  con.query(sql, function (err, result, fields) {
    if (result.length > 0) {
      res.send(result);
    } else {
      res.sendStatus(404); 
    }
  });
});

app.post("/users", function (req, res) {
    // kod för att validera input
    if (!req.body.firstname) {
      res.status(400).send("firstname required!");
      return; // avslutar metoden
    }
    let fields = ["firstname", "lastname"]; 
    for (let key in req.body) {
      if (!fields.includes(key)) {
        res.status(400).send("Unknown field: " + key);
        return; // avslutar metoden
      }
    }
    // kod för att hantera anrop
    let sql = `INSERT INTO users (firstname, lastname)
      VALUES ('${req.body.firstname}', 
      '${req.body.lastname}',
      SELECT LAST_INSERT_ID();`;  
    console.log(sql);
  
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      // kod för att hantera retur av data
      console.log(result);
      let output = {
        id: result[0].insertId,
        fullname: req.body.fullname,
        lastname: req.body.lastname,
      };
      res.send(output);
    });
  });

  app.put("/users/:id", function (req, res) {
    //kod här för att hantera anrop…
    // kolla först att all data som ska finnas finns i request-body
    if (!(req.body && req.body.firstname && req.body.lastname)) {
      // om data saknas i body
      res.sendStatus(400);
      return;
    }
    let sql = `UPDATE users 
        SET firstname = '${req.body.firstnamename}', lastname = '${req.body.lastname}'
          WHERE id = ${req.params.id}`;
  
    con.query(sql, function (err, result, fields) {
      if (err) {
        throw err;
        //kod här för felhantering, skicka felmeddelande osv.
      } else {
        // meddela klienten att request har processats OK
        res.sendStatus(200);
      }
    });
  });