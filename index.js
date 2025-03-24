import axios from "axios";
import * as cheerio from "cheerio";
import { siteConfigs } from "./config.js";
import ical from "ical";
import { cleanString } from "./utils/cheerioUtils.js";
import { URL } from "url";
import { icalConfigs } from "./utils/icalConfig.js";
import puppeteer from "puppeteer";
import fs from "fs";

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
      } else {
        date = cleanString($(element).find(config.dateSelector).text() || null);
        time = cleanString($(element).find(config.timeSelector).text() || null);
       
        console.log("Time:", time);
      }

      // Remove the leading "|" character from the time string
      if (time && time.startsWith("|")) {
        time = time.substring(1).trim();
      }
      //remove events without time
      if (time && (time===null || time==='false')) {
        console.log("Skipping event without valid time:", title);
        return;
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

      console.log("Event being pushed:", eventData);
      if (!time) {
        console.log("Skipping event without time:", title);
        return;
      }

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
    const { data } = await axios.get(icsUrl);
    const parsedData = ical.parseICS(data);
    //console.log("Parsed ICS data:", parsedData);
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

async function scrapeYorkEvents() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Disable sandbox for CI environments
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.york.cuny.edu/events/list', { waitUntil: 'networkidle2' });

    const events = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div.nine.wide.column')).map(event => ({
        title: event.querySelector('h3.threelines a')?.innerText.trim() || '',
        link: event.querySelector('h3.threelines a')?.href || '',
        college: 'York College', // Hardcoded since it's not in the HTML
        date: event.querySelector('div.cal_date')?.innerText.trim() || '',
        time: event.querySelector('span.start-time')?.innerText.trim() || '',
        tags: [], // No tag selector in the given HTML, defaulting to an empty array
      }))
      .filter(e => !e.time.includes('All Day')); // Exclude events with "All Day" in the time field
    });

    return events;
  } catch (error) {
    console.error('Error scraping York College events:', error);
    return [];
  } finally {
    await browser.close();
  }
}

function removePastEvents(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to start of today

  return events.filter((event) => {
    if (!event.date) return false; // skip if no date available

    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) {
      console.warn(`Unable to parse date for event: ${event.title}`);
      return false; // skip events with invalid date formats
    }

    // Keep event if its date is today or in the future.
    return eventDate >= today;
  });
}


function removeEventsWithKeywords(events) {
  const keywords = ["D75 Program", "Faculty Meeting", "COLLEGE CLOSED"]; 
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
  // const yorkEvents = await scrapeYorkEvents();
  // allEvents.push(...yorkEvents);

  // Remove events from the past
  const futureEvents = removePastEvents(allEvents);
  // Remove events with specific keywords
  const filteredEvents = removeEventsWithKeywords(futureEvents);

  // Deduplicate the events
  const uniqueEvents = removeDuplicateEvents(filteredEvents);
  console.log(`Total events fetched: ${allEvents.length}`);
  console.log(`Total future events: ${futureEvents.length}`);
  console.log(`Total filtered events: ${filteredEvents.length}`);
  console.log(`Total unique events: ${uniqueEvents.length}`);
  // console.log("Unique events:", uniqueEvents);
  return uniqueEvents;

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
