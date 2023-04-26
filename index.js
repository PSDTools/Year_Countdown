// @ts-check
"use strict";

/**
 * Last Day for Students: https://calendar.google.com/calendar/ical/psdr3.org_3137383238353432373930%40resource.calendar.google.com/public/basic.ics.
 */

import http from "http";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import { Server } from "socket.io";
// @ts-ignore
import ICAL from "ical.js";

const app = express();
const server = new http.Server(app);
const io = new Server(server);
const port = process.env.PORT ?? 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (_req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

let unixTimeMs;
/** @type {ICAL.Component[]} */
let events;
/** @type {string} */
let isoString;
lastDay();

/**
 * Find the times in ISO.
 *
 * @param {string} inputString - The string to find stuff in.
 * @returns {string[]} - The list of matches.
 */
function findISOTimes(inputString) {
  const regex =
    /"dtstart",\s*{\s*},\s*"date-time",\s*"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)"/g;
  const matches = [];
  let match;
  while ((match = regex.exec(inputString)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * Find the closest time in the future.
 *
 * @param {string[]} timeList - The times
 * @returns {string} -
 */
function findClosestFutureTime(timeList) {
  const now = new Date();
  /** @type {Date} */
  let closestFutureTime = now;
  let closestTimeDiff = Infinity;

  timeList.forEach((time) => {
    const dateTime = new Date(time);
    // @ts-ignore
    const timeDiff = dateTime - now;
    if (timeDiff > 0 && timeDiff < closestTimeDiff) {
      closestFutureTime = dateTime;
      closestTimeDiff = timeDiff;
    }
  });

  return closestFutureTime.toISOString();
}

/**
 * Find the last day of school.
 */
function lastDay() {
  const icalUrl =
    "https://calendar.google.com/calendar/ical/psdr3.org_auvngjhbljjajucngr199vdrbs%40group.calendar.google.com/public/basic.ics";

  // Load the iCal file
  fetch(icalUrl)
    .then((response) => response.text())
    .then((data) => {
      // Parse the iCal file
      /** @type {string} */
      const jcalData = ICAL.parse(data);
      /** @type {ICAL.Component} */
      const vcalendar = new ICAL.Component(jcalData);
      // Get all the events from the iCal file
      events = vcalendar.getAllSubcomponents("vevent");
      // Filter events based on summary containing "Last Day for Students"
      const filteredEvents = events.filter((event) => {
        const summary = event.getFirstPropertyValue("summary");
        return summary.includes("Last Day for Students");
      });

      const input = JSON.stringify(filteredEvents);
      const isoTimes = findISOTimes(input);

      const date = findClosestFutureTime(isoTimes);
      // console.log(date.split("T")[0]);

      const filteredEvents2 = events.filter((event) => {
        const dtStart = event.getFirstPropertyValue("dtstart").toString();
        return dtStart.includes(date.split("T")[0]);
      });

      // console.log(findIsoTimes(String(filteredEvents)))

      let inputStr = JSON.stringify(filteredEvents2);
      let letter = findDayType(inputStr);

      // Set the time based on the letter
      let hour, minute;
      if (letter === "C") {
        hour = 13; // 1 pm
        minute = 19;
      } else {
        hour = 14; // 2 pm
        minute = 18;
      }

      // Parse the date string and set the time
      const dateString = String(date.split("T")[0]);
      const newDate = new Date(
        `${dateString}T${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}:00`
      );

      // Convert the date to ISO format and UNIX time
      isoString = newDate.toISOString();
      unixTimeMs = newDate.getTime(); // returns UNIX time in milliseconds
      // output: 1685068740000 (or similar, depending on your timezone)
      // console.log(unixTimeMs);
      return unixTimeMs;
    })
    .catch(() => {});
}

/**
 * Make the list of days.
 *
 * @param {string} futureDateStr
 * @returns {string[]}
 */
function createListOfDays(futureDateStr) {
  const today = new Date();
  const futureDate = new Date(futureDateStr);
  const days = [];

  for (
    const date = today;
    date <= futureDate;
    date.setDate(date.getDate() + 1)
  ) {
    const formattedDate = date.toISOString().slice(0, 10);
    days.push(formattedDate);
  }

  return days;
}

/**
 * Find the type of day.
 *
 * @param {string} inputStr
 * @returns {string | null}
 */
function findDayType(inputStr) {
  const regex = /([a-cx])\s+day|mod\s+([a-cx])/i;
  const match = inputStr.match(regex);
  const letter = match ? match[1] || match[2] : null;
  return letter;
}

// function dayTypes() {
//   const list = createListOfDays(isoString);
//   const i = 1;
//   // console.log(list[i]);
//   const filteredEvents3 = events.filter((event) => {
//     const dtStart = event.getFirstPropertyValue("dtstart").toString();
//     return dtStart.includes(list[i].split("T")[0]);
//   });

//   // console.log(JSON.stringify(filteredEvents3));
//   // console.log(findDayType(JSON.stringify(filteredEvents3)));
// }

/**
 * Find the number of days in the workweek.
 *
 * @param {string[]} days
 * @returns {number}
 */
function weekDays(days) {
  // Initialize the count of working days.
  let count = 0;

  // Iterate over the list of days.
  for (const day of days) {
    // Convert the day string to a Date object.
    const date = new Date(day);

    // Get the day of the week from the Date object.
    const dayOfWeek = date.getDay();

    // If the day is not Saturday or Sunday, increment the count.
    if (dayOfWeek !== 6 && dayOfWeek !== 0) {
      count++;
    }
  }

  // Return the count of working days.
  return count - 1;
}

io.on("connection", (socket) => {
  socket.on("needLD", (_msg) => {
    io.emit("eoty", weekDays(createListOfDays(isoString)));
  });
});

server.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
