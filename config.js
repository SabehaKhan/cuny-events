export const siteConfigs = [
  // First site with full info scraped from HTML:
  {
    baseUrl: "https://events.cuny.edu/page/",
    pages: 31,
    eventItemSelector: "li.cec-list-item",
    titleSelector: "h2.low a",
    linkSelector: "h2.low a",
    collegeSelector: "h4.low-normal", // college info available here
    dateSelector: "h4.low-normal",
    timeSelector: "h4:nth-of-type(3)",
    tagsSelector: "h4 a",
  },
  {
    baseUrl: "https://qc.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "Queens College", // Hardcoded since it’s not on the card
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
  {
    baseUrl: "https://baruch.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "Baruch College", // Hardcoded since it’s not on the card
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
  {
    baseUrl: "https://slu.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "CUNY School of Labor and Urban Studies", // Hardcoded since it’s not on the card
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
  {
    baseUrl: "https://citytech.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "New York City College of Technology (City Tech)", // Hardcoded since it’s not on the card
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
  {
    baseUrl: "https://hostos.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "Hostos Community College", // Hardcoded since it’s not on the card
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
  {
    baseUrl: "https://laguardia.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "LaGuardia Community College", // Hardcoded since it’s not on the card
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
    {
      baseUrl: "https://www.brooklyn.edu/events/",
      eventItemSelector: ".tribe-events-calendar-list__event-wrapper",
      titleSelector: ".tribe-events-calendar-list__event-title a",
      linkSelector: ".tribe-events-calendar-list__event-title a",
      collegeName: "Brooklyn College", // hardcoded for this site
      dateTimeSelector: ".tribe-events-calendar-list__event-datetime",
      tagsSelector: ".tribe-events-calendar-list__event article",
    },
      {
    collegeName: "Borough of Manhattan Community College",
    baseUrl: "https://www.bmcc.cuny.edu/events-calendar/",
    eventItemSelector: ".tribe-events-calendar-list__event-details",
    titleSelector: ".tribe-events-calendar-list__event-title a",
    linkSelector: ".tribe-events-calendar-list__event-title a",
    dateTimeSelector: ".tribe-events-calendar-list__event-datetime",
    tagsSelector: "",
  },
  {
    baseUrl: "https://sps.cuny.edu/about/events",
    eventItemSelector: "div.views-row",
    titleSelector: "h3.listing-item__title a",
    linkSelector: "h3.listing-item__title a",
    collegeName: "CUNY School of Professional Studies", // Hardcoded since it's not in the HTML
    dateSelector: "span.date-display-single",
    timeSelector: "p.listing-item__timestamp:first-of-type", // Use the first occurrence for time
    tagsSelector: "",
  },
  {
    baseUrl: "https://sph.cuny.edu/events/",
    eventItemSelector: "article.event-day-group",
    titleSelector: "div.event-title a",
    linkSelector: "div.event-title a",
    collegeName: "CUNY School of Public Health", // Hardcoded since it's not in the HTML
    dateSelector: "span.tribe-events-list-separator-month span",
    timeSelector: "div.event-time",
    tagsSelector: "",
  },
  {
    baseUrl: "https://www.lehman.edu/events/?search=all",
    eventItemSelector: "div.eventsListing__event",
    titleSelector: "h3.eventsListing__block__desc__title",
    linkSelector: "a", // The link wraps the entire event block
    collegeName: "Lehman College", // Hardcoded as it's not within the event HTML
    dateSelector: "p.eventsListing__block__desc__date span",
    timeSelector: "p.eventsListing__block__desc__time",
    tagsSelector: "", // No tags information available in the provided HTML
  },


];
