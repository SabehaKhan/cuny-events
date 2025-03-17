import axios from "axios";
import * as cheerio from "cheerio";
import { SiteConfig } from "./config";
import { siteConfigs } from "./config";
import { Event } from "@/types/event";
import ical from "ical";
import { cleanString } from "@/utils/cheerioUtils";
import { URL } from 'url';
import {icalConfigs} from "@/utils/icalConfig";
import puppeteer from "puppeteer";


export async function fetchEventsFromSite(config: SiteConfig, page = 1): Promise<Event[]> {
  try {
    const url = config.pages ? `${config.baseUrl}${page}` : config.baseUrl;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const events: Event[] = [];

    $(config.eventItemSelector).each((_i, element) => {
      const title = cleanString($(element).find(config.titleSelector).attr("title") || $(element).find(config.titleSelector).text() || null);
      // Extract the href attribute and provide a default value of null if not found
      const relativeLink = $(element).find(config.linkSelector).attr('href') || null;
      let link: string | null = relativeLink;

      // If the link is relative, convert it to an absolute URL
      if (relativeLink && relativeLink.startsWith('/')) {
        link = new URL(relativeLink, config.baseUrl).href;
      }


      // Determine the college name
      let college: string | null = "";
      if (config.collegeSelector) {
        const collegeElement = $(element).find(config.collegeSelector).first();
        college = cleanString(collegeElement.text());
      }
      
      let date: string | null = null;
      let time: string | null = null;

      // Handle date & time extraction based on config
      if (config.dateTimeSelector) {
        const dateTimeText = cleanString($(element).find(config.dateTimeSelector).text() || ""); // Ensure it's a string
        
        if (dateTimeText && (dateTimeText.includes("@") || dateTimeText.includes(" at ") || dateTimeText.includes(" | ") )) {
          if (dateTimeText.includes("@")) {
            [date, time] = dateTimeText.split("@").map((part) => part.trim());
          }
          else if (dateTimeText.includes(" at ")) {
            [date, time] = dateTimeText.split(" at ").map((part) => part.trim());
          }
          else if (dateTimeText.includes(" | ")) {
            [date, time] = dateTimeText.split(" | ").map((part) => part.trim());
          }    
        } else {
          console.log("Skipping event without valid date/time:", title);
          return; // Skip events that don't have valid time format
        }


      } else {
        date = cleanString($(element).find(config.dateSelector).text() || null);
        time = cleanString($(element).find(config.timeSelector).text() || null);
      }

      const tags = $(element).find(config.tagsSelector).map((_i, el) => cleanString($(el).text())).get();
      if (college === "" && config.collegeName) {
        college = config.collegeName;
      }
      // events.push({ title, link, college, date, time, tags });

        // Remove the college name from the date if it appears at the beginning
      if (date && college && date.startsWith(college)) {
        date = date.replace(college, '').trim();
      }

      const eventData = {
        title,
        link,
        college, // will now be the hardcoded value if it was empty
        date,
        time,
        tags,
      };

      console.log("Event being pushed:", eventData); // Log for debugging
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

async function fetchICSEvents(icsUrl: string, collegeName: string): Promise<Event[]> {
  try {
    const { data } = await axios.get(icsUrl);
    const parsedData = ical.parseICS(data);
    const events: Event[] = [];

    for (const key in parsedData) {
      const event = parsedData[key];

      if (event.type === "VEVENT") {
        events.push({
          title: event.summary || "Untitled Event", // Ensures it's never undefined
          link: event.url || "", // Ensures it's always a string
          college: collegeName,
          date: event.start ? new Date(event.start).toISOString().split("T")[0] : "", // Default to empty string if undefined
          time: event.start ? new Date(event.start).toLocaleTimeString() : "", // Default to empty string
          tags: [], // ICS usually doesn't have tags
        });
      }
    }

    return events;
  } catch (error) {
    console.error(`Error fetching ICS events from ${icsUrl}:`, error);
    return [];
  }
}

export async function scrapeYorkEvents(): Promise<Event[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://www.york.cuny.edu/events/list", { waitUntil: "networkidle2" });

    const events: Event[] = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("div.nine.wide.column"))
          .map(event => ({
            title: event.querySelector<HTMLElement>("h3.threelines a")?.innerText.trim() || "",
            link: event.querySelector<HTMLAnchorElement>("h3.threelines a")?.href || "",
            college: "York College", // Hardcoded since it's not in the HTML
            date: event.querySelector<HTMLElement>("div.cal_date")?.innerText.trim() || "",
            time: event.querySelector<HTMLElement>("span.start-time")?.innerText.trim() || "",
            tags: [] // No tag selector in the given HTML, defaulting to an empty array
          }))
          .filter(e => !e.time.includes("All Day")); // Exclude events with "All Day" in the time field
    });

    return events;
  } catch (error) {
    console.error("Error scraping York College events:", error);
    return [];
  } finally {
    await browser.close();
  }
}
/**
 * Returns only the events that are today or in the future.
 * If the event's date is missing or cannot be parsed, the event is excluded.
 */
function removePastEvents(events: Event[]): Event[] {
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




export async function fetchAllEvents(): Promise<Event[]> {
  const allEvents: Event[] = [];
  //commented for testing non ical events
  for (const config of icalConfigs) {
    if (config.icsUrl) {
      console.log(`Fetching ICS events for ${config.collegeName}...`);
      const icsEvents = await fetchICSEvents(config.icsUrl, config.collegeName);

      // Ensure event.title is a string, extracting the 'val' property if it's an object
      const cleanedEvents = icsEvents.map(event => {
        let title: string | null = event.title;

        if (event.title && typeof event.title === "object" && "val" in event.title) {
          title = (event.title as { val: string }).val;
        }

        return { ...event, title };
      });

      console.log(cleanedEvents);
      allEvents.push(...cleanedEvents);
    }
  }

  for (const config of siteConfigs) {
      const events = await fetchEventsFromSite(config);
      allEvents.push(...events);
  }
  const yorkEvents = await scrapeYorkEvents();
  allEvents.push(...yorkEvents);

  // Remove events from the past before returning.
  return removePastEvents(allEvents);
}
