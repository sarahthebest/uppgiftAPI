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
app.get("/users/id=:id", function (req, res) {
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

app.get("/users/firstname=:firstname", function (req, res) {
  let sql = "SELECT * FROM users WHERE firstname=" + req.params.firstname;
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
  if (isValidUserData(req.body)) {
    if (!req.body.firstname) {
      res.status(400).send("firstname required!");
      return; 
    }
    let fields = ["firstname", "lastname"]; 
    for (let key in req.body) {
      if (!fields.includes(key)) {
        res.status(400).send("Unknown field: " + key);
        return; 
      }
    }
    let sql = `INSERT INTO users (firstname, lastname)
      VALUES ('${req.body.firstname}', 
      '${req.body.lastname}');
      SELECT * FROM users WHERE id=LAST_INSERT_ID();`;
        console.log(sql);
        con.query(sql, function (err, result, fields) {
          if (err) {
            console.log(err);
            res.status(500).send("Fel i databasanropet!");
            throw err;
          }
          let userData = Object.values(JSON.parse(JSON.stringify(result)))[1][0];
          console.log("Du har skapat användaren: ", userData);
          let output = {
            id: result[0].insertId,
            username: req.body.firstname,
            password: req.body.lastname,
          };
          res.json(output);
        });
      } else {
        res.status(422).send("username required!"); 
      }
    });

  app.put("/users/:id", function (req, res) {
  
    if (!(req.body && req.body.firstname && req.body.lastname)) {
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
  function isValidUserData(body) {
    return body && body.firstname && body.lastname; 
    /* 
          - kolla att firstname, lastname och passwd är textsträngar (snarare än tal, fält osv.)
          - (kolla att userId inte redan är upptaget - eventuellt bättre att kolla detta i samband med att man skriver till databasen genom att göra denna kolumn till key i databastabellen)
      */
  }
