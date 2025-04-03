import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";
import { siteConfigs } from "./config.js";
import ical from "ical";
import { cleanString } from "./utils/cheerioUtils.js";
import { URL } from "url";
import { icalConfigs } from "./utils/icalConfig.js";
//import puppeteer from "puppeteer";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from "fs";

// Enable stealth mode
//for scrapeGraduateCenterEvents since
//it does not work in headless mode
puppeteer.use(StealthPlugin());


function removeDuplicateEvents(events) {
  const seen = new Set();
  return events.filter(event => {
    // Create a unique identifier for each event based on the specified properties
    const identifier = `${event.date}-${event.time}-${event.title}-${event.location}-${event.college}`;
    if (seen.has(identifier)) {
      return false; // Duplicate found, exclude this event
    }
    seen.add(identifier);
    return true; // Unique event, include it
  });
}


export async function fetchEventsFromSite(config, page = 1) {
  try {
    const url = config.pages ? `${config.baseUrl}${page}` : config.baseUrl;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const events = [];

    $(config.eventItemSelector).each((_i, element) => {
      const title =
        cleanString(
          $(element).find(config.titleSelector).attr("title") ||
            $(element).find(config.titleSelector).text() ||
            null
        );
      const relativeLink = $(element).find(config.linkSelector).attr("href") || null;
      let link = relativeLink;

      if (relativeLink && relativeLink.startsWith("/")) {
        link = new URL(relativeLink, config.baseUrl).href;
      }

      let college = "";
      if (config.collegeSelector) {
        const collegeElement = $(element).find(config.collegeSelector).first();
        college = cleanString(collegeElement.text());
      }

      let date = null;
      let time = null;

      if (config.dateTimeSelector) {
        const dateTimeText = cleanString(
          $(element).find(config.dateTimeSelector).text() || ""
        );

        if (
          dateTimeText &&
          (dateTimeText.includes("@") ||
            dateTimeText.includes(" at ") ||
            dateTimeText.includes(" | "))
        ) {
          if (dateTimeText.includes("@")) {
            [date, time] = dateTimeText.split("@").map((part) => part.trim());
          } else if (dateTimeText.includes(" at ")) {
            [date, time] = dateTimeText.split(" at ").map((part) => part.trim());
          } else if (dateTimeText.includes(" | ")) {
            [date, time] = dateTimeText.split(" | ").map((part) => part.trim());
          }
        } else {
          console.log("Skipping event without valid date/time:", title);
          return; // Skip events without valid time format
        }
      } 
      else if (config.dateTimeObjectSelector){
        const dateTimeElement = $(element).find(config.dateTimeObjectSelector);
        const dateTimeObject = dateTimeElement.attr("datetime");
        if (dateTimeObject) {
          const dateTime = new Date(dateTimeObject);
          date = dateTime.toISOString().split("T")[0];
          time = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
      else {
        //date = cleanString($(element).find(config.dateSelector).text() || null);
        if (config.dateSelector) {
          const dateText = cleanString($(element).find(config.dateSelector).text() || null);
        
          if (dateText && dateText.includes("-")) {
            // Handle date ranges like "April 9, 2025 - April 13, 2025"
            const [startDate] = dateText.split("-").map(part => part.trim());
            date = startDate; // Use the start date for filtering
          } else {
            date = dateText; // Use the single date if no range is present
          }
        }
        time = cleanString($(element).find(config.timeSelector).text() || null);
       
        
      }

      // Remove the leading "|" character from the time string
      if (time && time.startsWith("|")) {
        time = time.substring(1).trim();
      }
      
      if (!date || date === "false") {
        console.log("Skipping event without a valid date:", title);
        return; // Skip events without a valid date
      }
      
      // Allow events without a time but ensure time is set to an empty string
      if (!time || time === "false" || time.toLowerCase() === "online") {
        time = ""; // Set time to an empty string if missing or invalid
      }

      // Split the time string by the delimiter and take the first valid time range
      if (time && time.includes("pm")) {
        time = time.split("pm")[0].trim() + "pm";
      } else if (time && time.includes("am")) {
        time = time.split("am")[0].trim() + "am";
      }
      const timeRegex = /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm|a\.m\.|p\.m\.)(\s?-\s?(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm|a\.m\.|p\.m\.))?$/;
      if (!timeRegex.test(time)) {
        console.log(`Invalid time detected: "${time}", setting time to empty.`);
        time = ""; // Set time to an empty string if invalid
      } else {
        // Normalize time format (e.g., convert "p.m." to "PM")
        time = time.replace(/\.\s?/g, "").toUpperCase();
      }


      const tags = $(element)
        .find(config.tagsSelector)
        .map((_i, el) => cleanString($(el).text()))
        .get();
      if (college === "" && config.collegeName) {
        college = config.collegeName;
      }
      // Remove the college name from the date if it appears at the beginning
      if (date && college && date.startsWith(college)) {
        date = date.replace(college, "").trim();
      }

      const eventData = {
        title,
        link,
        college,
        date,
        time,
        tags,
      };

      

      events.push(eventData);
    });

    return events;
  } catch (error) {
    console.error(`Error fetching events from ${config.baseUrl} on page ${page}:`, error);
    return [];
  }
}

async function fetchICSEvents(icsUrl, collegeName) {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false, // Ignore SSL certificate errors
    });

    const { data } = await axios.get(icsUrl, { httpsAgent: agent });
    const parsedData = ical.parseICS(data);
    const events = [];

    for (const key in parsedData) {
      const event = parsedData[key];

      if (event.type === "VEVENT") {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let title = event.summary;
        if (typeof title === "object" && "val" in title) {
          title = title.val;
        }

        events.push({
          title: cleanString(title || "Untitled Event"),
          link: event.url || "",
          college: collegeName,
          date: startDate.toISOString().split("T")[0],
          time: `${startTime} - ${endTime}`,
          tags: event.categories || [], // Add categories as tags
        });
      }
    }

    return events;
  } catch (error) {
    console.error(`Error fetching ICS events from ${icsUrl}:`, error);
    return [];
  }
}
async function scrapeYorkEvents(cleanString) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Disable sandbox for CI environments
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.york.cuny.edu/events/list', { waitUntil: 'networkidle2' });

    const cleanStringFunction = cleanString.toString();

    const events = await page.evaluate((cleanStringFunction) => {
      const cleanString = new Function('return ' + cleanStringFunction)();
      return Array.from(document.querySelectorAll('div.nine.wide.column')).map(event => {
        const dateElement = event.querySelector('div.cal_date');
        const month = dateElement.querySelector('span.cal_month')?.innerText.trim() || '';
        const day = dateElement.querySelector('span.cal_day')?.innerText.trim() || '';
        const year = new Date().getFullYear(); // Assuming the current year for simplicity
        const date = `${month} ${day}, ${year}`;

        return {
          title: cleanString(event.querySelector('h3.threelines a')?.innerText.trim() || ''),
          link: event.querySelector('h3.threelines a')?.href || '',
          college: 'York College', // Hardcoded since it's not in the HTML
          date: date,
          time: event.querySelector('span.start-time')?.innerText.trim() || '',
          tags: [], // No tag selector in the given HTML, defaulting to an empty array
        };
      }).filter(e => !e.time.includes('All Day')); // Exclude events with "All Day" in the time field
    }, cleanStringFunction);

    return events;
  } catch (error) {
    console.error('Error scraping York College events:', error);
    return [];
  } finally {
    await browser.close();
  }
}


async function scrapeGraduateCenterEvents(cleanString) {
  const browser = await puppeteer.launch({
    headless: true, // Run in headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for CI environments
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    await page.goto('https://www.gc.cuny.edu/events', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('div.card__content__inner', { timeout: 10000 });

    const cleanStringFunction = cleanString.toString();

    const events = await page.evaluate((cleanStringFunction) => {
      const cleanString = new Function('return ' + cleanStringFunction)();

      return Array.from(document.querySelectorAll('div.card__content__inner')).map(event => {
        const dateElement = event.querySelector('div.start_date');
        const month = dateElement?.childNodes[0]?.nodeValue.trim() || '';
        const day = dateElement?.querySelector('span.h3')?.innerText.trim() || '';
        const year = new Date().getFullYear();
        const date = `${month} ${day}, ${year}`;

        const title = cleanString(event.querySelector('h3.card__title a')?.innerText.trim() || '');
        const link = event.querySelector('h3.card__title a')?.href || '';
        const time = event.querySelector('span.card__time')?.innerText.trim() || '';
        const tags = Array.from(event.querySelectorAll('ul.tags li')).map(tag =>
          cleanString(tag.innerText.trim())
        );
        const location = cleanString(
          event.querySelector('span.card__location')?.innerText.trim() || ''
        );

        return {
          title,
          link: link.startsWith('/') ? `https://www.gc.cuny.edu${link}` : link,
          college: 'CUNY Graduate Center',
          date,
          time,
          location,
          tags,
        };
      });
    }, cleanStringFunction);

    return events;
  } catch (error) {
    console.error('Error scraping Graduate Center events:', error);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeQCCEvents() {
  const url = "https://www.qcc.cuny.edu/calendar/views/2025/index.html";

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const events = [];

    $("div.col-sm-6").each((_i, element) => {
      const title = cleanString($(element).find("a.newstitle").text().trim());
      const relativeLink = $(element).find("a.newstitle").attr("href") || null;

      // Convert relative link to absolute URL
      const link = relativeLink
        ? new URL(relativeLink.replace("../../", ""), "https://www.qcc.cuny.edu/calendar/").href
        : null;

      const dateTimeText = $(element).find("time").text().trim();
      const [date, timeRange] = dateTimeText.includes("|")
        ? dateTimeText.split("|").map(part => part.trim())
        : [dateTimeText.trim(), null]; // Handle cases where time is missing

      // Clean up the time field if it exists
      let cleanedTime = timeRange ? timeRange.replace(/\s+/g, " ").trim() : "";

      // Replace "to" with "-" in the time field
      if (cleanedTime.includes("to")) {
        cleanedTime = cleanedTime.replace(/\sto\s/g, " - ");
      }

      const description = $(element).find("span").text().trim();

      events.push({
        title,
        link,
        college: "Queensborough Community College",
        date,
        time: cleanedTime,
        description,
      });
    });

    return events;
  } catch (error) {
    console.error("Error scraping QCC events:", error);
    return [];
  }
}

async function fetchSLUEvents() {
  const icsUrl = "https://calendar.google.com/calendar/ical/cunyslustudentservices@gmail.com/public/basic.ics";
  const collegeName = "CUNY School of Labor and Urban Studies";

  try {
    const { data } = await axios.get(icsUrl);
    const parsedData = ical.parseICS(data);
    const events = [];

    for (const key in parsedData) {
      const event = parsedData[key];

      if (event.type === "VEVENT") {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const startTime = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const endTime = endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        let title = event.summary || "Untitled Event";
        if (typeof title === "object" && "val" in title) {
          title = title.val;
        }

        // Extract link from the description if it exists
        let link = "";
        if (event.description) {
          const linkMatch = event.description.match(/href="([^"]+)"/);
          if (linkMatch) {
            link = linkMatch[1]; // Extract the href value
          }
        }

        events.push({
          title: cleanString(title),
          link: link || "", // Use the extracted link or leave it empty
          college: collegeName,
          date: startDate.toISOString().split("T")[0],
          time: `${startTime} - ${endTime}`,
          description: event.description || "",
        });
      }
    }

    return events;
  } catch (error) {
    console.error(`Error fetching SLU events from ${icsUrl}:`, error);
    return [];
  }
}

function removePastEvents(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to the start of today

  return events.filter((event) => {
    console.log(`Original Event date: ${event.date}, Title: ${event.title}`); // Log the original event date and title

    if (!event.date) {
      console.warn(`Skipping event without a date: ${event.title}`);
      return false; // Skip if no date is available
    }

    // Normalize the date to YYYY-MM-DD format
    let normalizedDate;
    try {
      const parsedDate = new Date(event.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid date format: ${event.date}`);
      }
      normalizedDate = parsedDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      event.date= normalizedDate;
    } catch (error) {
      console.warn(`Unable to parse date for event: ${event.title}, Date: ${event.date}`);
      return false; // Skip events with invalid date formats
    }

    console.log(`Normalized Event date: ${normalizedDate}, Title: ${event.title}`); // Log the normalized date

    // Keep the event if its date is today or in the future
    return new Date(normalizedDate) >= today;
  });
}
function removeEventsWithoutTitleOrLink(events) {
  return events.filter(event => {
    if (!event.title || !event.link) {
      console.log(`Removing event missing title or link: Title="${event.title || "N/A"}", Link="${event.link || "N/A"}"`);
      return false; // Exclude events without a title or link
    }
    return true; // Include events with both title and link
  });
}

function removeEventsWithKeywords(events) {
  const keywords = ["D75 Program", "Faculty Meeting", "COLLEGE CLOSED","No Classes","Out of Comission","HOLDs","Canceled","LALS","SPST 3963-003","Exam Review","Registration Opens","Recess","Closed","Pre-Registration","Registration","Committee","Last Day","tentative","Meeting","Council","Submit","Drop","Deadline"]; 
  return events.filter(event => {
    const title = event.title.toLowerCase();
    const hasKeyword = keywords.some(keyword => title.includes(keyword.toLowerCase()));
    if (hasKeyword) {
      console.log(`Removing event with title: "${event.title}" due to keyword match.`);
    }
    return !hasKeyword;
  });
}

export async function fetchAllEvents() {
  const allEvents = [];
  // Fetch ICS events
  
  for (const config of icalConfigs) {
    if (config.icsUrl) {
      // console.log(`Fetching ICS events for ${config.collegeName}...`);
      const icsEvents = await fetchICSEvents(config.icsUrl, config.collegeName);
      const cleanedEvents = icsEvents.map((event) => {
        let title = event.title;
        if (event.title && typeof event.title === "object" && "val" in event.title) {
          title = event.title.val;
        }
        return { ...event, title };
      });
      allEvents.push(...cleanedEvents);
    }
  }

  // Fetch events from configured sites

  for (const config of siteConfigs) {
    const events = await fetchEventsFromSite(config);
    allEvents.push(...events);
  }
  const yorkEvents = await scrapeYorkEvents(cleanString);
  allEvents.push(...yorkEvents);

  const graduateCenterEvents = await scrapeGraduateCenterEvents(cleanString);
  allEvents.push(...graduateCenterEvents);
  const QCCEvents=await scrapeQCCEvents();
  allEvents.push(...QCCEvents);
  const sluEvents = await fetchSLUEvents();
  allEvents.push(...sluEvents);


  // Remove events from the past
  const futureEvents = removePastEvents(allEvents);
  // Remove events with specific keywords
  const filteredEvents = removeEventsWithKeywords(futureEvents);
   // Remove events with invalid time
   const validTimeEvents = removeEventsWithInvalidTime(filteredEvents);
  
  
   // Remove events missing title or link
   const eventsWithTitleAndLink = removeEventsWithoutTitleOrLink(validTimeEvents);
   // Deduplicate the events
   const uniqueEvents = removeDuplicateEvents(eventsWithTitleAndLink);
   //const uniqueEvents = removeDuplicateEvents(filteredEvents);
  console.log(`Total events fetched: ${allEvents.length}`);
  console.log(`Total future events: ${futureEvents.length}`);
  console.log(`Total filtered events: ${filteredEvents.length}`);
  console.log(`Total events with title and link: ${eventsWithTitleAndLink.length}`);
  console.log(`Total unique events: ${uniqueEvents.length}`);
  // console.log("Unique events:", uniqueEvents);
  return uniqueEvents;

}
function removeEventsWithInvalidTime(events) {
  return events.filter(event => {
    if (event.time === "12:00 AM - 12:00 AM") {
      console.log(`Removing event with invalid time: "${event.title}"`);
      return false; // Exclude events with invalid time
    }
    return true; // Include valid events
  });
}

// Execute the scraper and save the results to events.json
fetchAllEvents()
  .then((events) => {
    fs.writeFileSync("events.json", JSON.stringify(events, null, 2));
    // console.log(events);
    console.log("Events saved to events.json");
  })
  .catch((error) => {
    console.error("Error fetching events:", error);
  });
