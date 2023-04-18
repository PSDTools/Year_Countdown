const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
// Last Day for Students
//https://calendar.google.com/calendar/ical/psdr3.org_3137383238353432373930%40resource.calendar.google.com/public/basic.ics


// Sample link to an iCal file
const icalUrl = 'https://calendar.google.com/calendar/ical/psdr3.org_auvngjhbljjajucngr199vdrbs%40group.calendar.google.com/public/basic.ics';
const ical = require('ical.js');


function findISOTimes(inputString) {
  const regex = /"dtstart",\s*{\s*},\s*"date-time",\s*"([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z)"/g;
  const matches = [];
  let match;
  while ((match = regex.exec(inputString)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}
function findClosestFutureTime(timeList) {
  const now = new Date();
  let closestFutureTime = null;
  let closestTimeDiff = Infinity;

  timeList.forEach(function (time) {
    const dateTime = new Date(time);
    const timeDiff = dateTime - now;
    if (timeDiff > 0 && timeDiff < closestTimeDiff) {
      closestFutureTime = dateTime;
      closestTimeDiff = timeDiff;
    }
  });

  return closestFutureTime ? closestFutureTime.toISOString() : null;
}


// Load the iCal file
fetch(icalUrl)
  .then(response => response.text())
  .then(data => {
    // Parse the iCal file
    const jcalData = ical.parse(data);
    const vcalendar = new ical.Component(jcalData);
    // Get all the events from the iCal file
    const events = vcalendar.getAllSubcomponents('vevent');
    // Filter events based on summary containing "Last Day for Students"
    const filteredEvents = events.filter(event => {
      const summary = event.getFirstPropertyValue('summary');
      return summary.includes('Last Day for Students');
    });
		
		const input = JSON.stringify(filteredEvents);
		const isoTimes = findISOTimes(input);
		
		const date = findClosestFutureTime(isoTimes)
		console.log(date.split('T')[0]);
		
		const filteredEvents2 = events.filter(event => {
		  const dtStart = event.getFirstPropertyValue('dtstart').toString();
		  return dtStart.includes(date.split('T')[0]);
		
    });

		// console.log(findIsoTimes(String(filteredEvents)))

console.log("")
inputStr = JSON.stringify(filteredEvents2)

const regex = /(A|B|C|X)\s+Day|MOD\s+(A|B|C|X)/;
const match = inputStr.match(regex);
const letter = match ? (match[1] || match[2]) : null;

// Set the time based on the letter
let hour, minute;
if (letter === 'C') {
  hour = 13; // 1 pm
  minute = 19;
} else {
  hour = 14; // 2 pm
  minute = 18;
}

// Parse the date string and set the time
const dateString = "2023-05-26";
const newdate = new Date(`${dateString}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);

// Convert the date to ISO format and UNIX time
const isoString = newdate.toISOString();
const unixTimeMs = newdate.getTime(); // returns UNIX time in milliseconds

console.log(isoString); // output: "2023-05-26T13:19:00.000Z"
console.log(unixTimeMs); // output: 1685068740000 (or similar, depending on your timezone)

  });
