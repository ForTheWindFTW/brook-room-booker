'use strict';

const
http = require('http'),
fs = require('fs'),
queryString = require('querystring'),

mongodb = require('mongodb'),
mongoClient = mongodb.MongoClient,
url = 'mongodb://NewtonbrookFTW:wowyoufoundmypasswordnice1!@ds353378.mlab.com:53378/heroku_90lwfh0p',
dbName = 'heroku_90lwfh0p',
collectionName = 'students',

MAX_STUDENTS_AT_ONE_TIME = 8,
port = process.env.PORT || 8080,
server = http.createServer(requestHandler),
htmlFileData = fs.readFileSync(__dirname + "/index.html").toString(),
cssFileData = fs.readFileSync(__dirname + "/index.css").toString(),
jsFileData = fs.readFileSync(__dirname + "/index.js").toString();

var students;

initialize(server);

/**
 * This function adds the specified attributes to the server-locally-stored student object, to avoid
 * errors related to looking for attributes of undefined methods. It is a helper method for the @function
 * addStudent(year, month, day, period, student).
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} period
 */
function addMissingAttributes(year, month, day, period) {
  students[year] ? undefined : students[year] = {};
  students[year][month] ? undefined : students[year][month] = {};
  students[year][month][day] ? undefined : students[year][month][day] = {};
  students[year][month][day][period] ? undefined : students[year][month][day][period] = [];
}

/**
 * This function will add a @param student to the server-locally-stored student object at the specified
 * date and time, and will not add a student if the student exceeds @global MAX_STUDENTS_AT_ONE_TIME or
 * already exists
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} period
 * @param {object} student the object to be added, received from a client request
 */
function addStudent(year, month, day, period, student) {
  addMissingAttributes(year, month, day, period);

  if(MAX_STUDENTS_AT_ONE_TIME === students[year][month][day][period].length) {
    console.log("NODEJS: addStudent(): failed; max students added");
    return false;
  } else {
    students[year][month][day][period].forEach(element => {
      if(student === element) {
        console.log("NODEJS: addStudent(): failed; already existing student");
        return false;
      }
    });
  }

  students[year][month][day][period].push(student);
  return true;
}

/**
 * This function acts as the main logic-decision request handler for the server. It will send the
 * corresponding file to the client based on their url
 *
 * Note: POST requests do not seem to work / are not consistent, as using the callback for 'data' does
 * not seem to properly recieve the body of http POST requests from clients, so GET requests (in the url)
 * have been used alternatively
 * @param {Request} req request recieved from clients
 * @param {Response} res response from server to be sent to clients
 */
function requestHandler(req, res) {
  console.log(`NODEJS REQUEST HANDLER: URL recieved from user: ${req.url}`);

  switch(req.url) {
    case "/":
      /** Main student-booker-html markup */
      res.statusCode = 200;
      res.statusMessage = "Finished";
      res.setHeader("Content-Type", "text/html");
      res.write(htmlFileData);
      console.log("NODEJS REQUEST HANDLER: text/html content sent to client");
      res.end();
      break;
    case "/index.css":
      /** Main student-booker-css styling */
      res.statusCode = 200;
      res.statusMessage = "Finished";
      res.setHeader("Content-Type", "text/css");
      res.write(cssFileData);
      console.log("NODEJS REQUEST HANDLER: text/css content sent to client");
      res.end();
      break;
    case "/index.js":
      /** Main student-booker-js functionality */
      res.statusCode = 200;
      res.statusMessage = "Finished";
      res.setHeader("Content-Type", "text/javascript");
      res.write(jsFileData);
      console.log("NODEJS REQUEST HANDLER: text/javascript content sent to client");
      res.end();
      break;
    case "/studentData":
      /** Sends student data to client */
      res.statusCode = 200;
      res.statusMessage = "Finished";
      res.setHeader("Content-Type", "application/json");
      res.write(JSON.stringify(students));
      console.log("NODEJS REQUEST HANDLER: /student.json sent to client");
      res.end();
      return;
    default:
      if(req.url.split("/?").length === 2) {
        var object = queryString.parse(req.url.split("/?")[1]);

        var student = {
          name: formatTitleCap(object.studentNameInput),
          teacher: formatTitleCap(object.teacherNameInput),
          course: object.courseInput.trim().replace(/\s\s+/g, ' ').toUpperCase(),
          room: object.roomInput.trim().replace(/\s\s+/g, ' ').toUpperCase()
        };

        const date = object.dateInput.split("-");
        const year = date[0];
        const month = date[1];
        const day = date[2];
        const period = object.periodInput;

        if(addStudent(year, month, day, period, student)) {
          console.log("NODEJS STUDENTS: Student added");
          updateStudentsToMongo();
        } else {
          console.log("NODEJS STUDENTS: Student FAILED to be added");
        }

        /** Redirects browser to main url after receiving a student */
        res.writeHead(302, {
          'Location': '/'
        });
        res.end();
      } else {
        /** Default invalid url redirect page */
        res.statusCode = 404;
        res.statusMessage = "Error";
        res.setHeader("Content-Type", "text/html");
        res.write("Error Code 404; File Not Found.\nDid you want to go to <a href='/'><b>brook-room-booker-test.herokuapp.com</b></a>?");
        console.log("NODEJS REQUEST HANDLER: text/plain error 404 sent to client");
        res.end();
      }
  }
}

/**
 * This function will take in a @param server and initalize the server object. The server will start and
 * also request the most updated database from MongoDB.
 * @param {server} server the server from http.createserver(...) to initialize and use to listen
 */
function initialize(server) {
  server.listen(port, () => {
    console.log(`NODEJS SERVER: Server successfully bound to and running at ${port}`);
  });

  loadStudentsFromMongo();
}

/**
 * This function will attempt to access the MongoDB collection and set the value recieved in the @global
 * students.
 */
function loadStudentsFromMongo() {
  // Use connect method to connect to the Server
  mongoClient.connect(url, {useUnifiedTopology: true}, function(mongoError, mongoResult) {
    if(mongoError) {
      throw mongoError;
    }

    console.log("NODEJS + MONGODB: Successfully connected.");

    var collection = mongoResult.db(dbName).collection(collectionName);

    collection.findOne({}, function(mongoError, mongoResult) {
      if(mongoError) {
        throw mongoError;
      }
      students = mongoResult;
      console.log("NODEJS + MONGODB: Students successfully loaded on server!");
    })

    mongoResult.close();
  });
}

/**
 * This function will attempt to replace the MongoDB collection as the current value of the @global
 * students.
 */
function updateStudentsToMongo() {
  // Use connect method to connect to the Server
  mongoClient.connect(url, {useUnifiedTopology: true}, function(mongoError, mongoResult) {
    if(mongoError) {
      throw mongoError;
    }

    console.log("NODEJS + MONGODB: Successfully connected.");

    var collection = mongoResult.db(dbName).collection(collectionName);

    collection.findOneAndReplace({}, students, {upsert: true}, function(mongoError, mongoResult) {
      if(mongoError) {
        throw mongoError;
      }
      console.log("MONGODB: Students successfully updated.");
    })

    mongoResult.close();
  });
}

/**
 * This function will take in a string and return a titlecaps-formatted version of it.
 *
 * The input string will have leading and trailing whitespace removed; trim(),
 * adjacent whitespace/tabs/new lines will be replaced by one space; replace(/\s\s+/g, ' '),
 * and have the first letter following whitespace to be in uppercase, and other letters being lowercase.
 * @param {string} string to be converted to titlecaps
 * @returns {string} a string formatted properly in titlecaps
 */
function formatTitleCap(string) {
  const words = string.trim().replace(/\s\s+/g, ' ').toLowerCase().split(' ');
  var finalString = "";

  for (const word of words) {
    finalString += word[0].toUpperCase() + word.slice(1) + " ";
  }

  return finalString.trim();
}
