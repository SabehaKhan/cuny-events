export const siteConfigs = [
  {
    baseUrl: "https://events.cuny.edu/page/",
    pages: 31,
    eventItemSelector: "li.cec-list-item",
    titleSelector: "h2.low a",
    linkSelector: "h2.low a",
    collegeSelector: "h4.low-normal", 
    dateSelector: "h4.low-normal",
    timeSelector: "h4:nth-of-type(3)",
    tagsSelector: "h4 a",
  },
  {
    baseUrl: "https://qc.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "Queens College", 
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
  {
    baseUrl: "https://baruch.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "Baruch College", 
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
  //using ical in individual function
  // {
  //   baseUrl: "https://slu.event.cuny.edu/upcoming",
  //   eventItemSelector: '[data-test="event-card"]',
  //   titleSelector: 'a.text-black.font-bold',
  //   linkSelector: 'a.text-black.font-bold',
  //   collegeName: "CUNY School of Labor and Urban Studies", 
  //   dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
  //   timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
  //   tagsSelector: ".tags a",
  // },
  {
    baseUrl: "https://citytech.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "New York City College of Technology (City Tech)", 
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
  {
    baseUrl: "https://hostos.event.cuny.edu/upcoming",
    eventItemSelector: '[data-test="event-card"]',
    titleSelector: 'a.text-black.font-bold',
    linkSelector: 'a.text-black.font-bold',
    collegeName: "Hostos Community College", 
    dateSelector: '[data-test="event-date-time"] span[aria-label*="Event date"]',
    timeSelector: '[data-test="event-date-time"] span[aria-label*="Event starts at"]',
    tagsSelector: ".tags a",
  },
    {
      baseUrl: "https://www.brooklyn.edu/events/",
      eventItemSelector: ".tribe-events-calendar-list__event-wrapper",
      titleSelector: ".tribe-events-calendar-list__event-title a",
      linkSelector: ".tribe-events-calendar-list__event-title a",
      collegeName: "Brooklyn College", 
      dateTimeSelector: ".tribe-events-calendar-list__event-datetime",
      tagsSelector: ".tribe-events-calendar-list__event article",
    },
  {
    baseUrl: "https://sps.cuny.edu/about/events",
    eventItemSelector: "div.views-row",
    titleSelector: "h3.listing-item__title a",
    linkSelector: "h3.listing-item__title a",
    collegeName: "CUNY School of Professional Studies", 
    dateTimeObjectSelector: "div.field--name-field-event-date time",
    tagsSelector: "",
  },
  {
    baseUrl: "https://sph.cuny.edu/events/",
    eventItemSelector: "article.event-day-group",
    titleSelector: "div.event-title a",
    linkSelector: "div.event-title a",
    collegeName: "CUNY School of Public Health", 
    dateSelector: "span.tribe-events-list-separator-month span",
    timeSelector: "div.event-time",
    tagsSelector: "",
  },
  {
    baseUrl: "https://www.lehman.edu/events/?search=all",
    eventItemSelector: "div.eventsListing__event",
    titleSelector: "h3.eventsListing__block__desc__title",
    linkSelector: "a", 
    collegeName: "Lehman College", 
    dateSelector: "p.eventsListing__block__desc__date span",
    timeSelector: "p.eventsListing__block__desc__time",
    tagsSelector: "", 
  },
  {
    baseUrl: "https://www.jjay.cuny.edu/news-events/events",
    eventItemSelector: "div.views-row.teaser-card",
    titleSelector: "div.card__title h3",
    linkSelector: "div.card__title a",
    collegeName: "John Jay College of Criminal Justice",
    dateTimeObjectSelector: "div.event__date time",
    locationSelector: "div.card__location div",
    descriptionSelector: "div.teaser__detailed__node__body",
    tagsSelector: "", // No tags found in the provided HTML
  },
  {
    baseUrl: "https://macaulay.cuny.edu/news-events/calendar-of-events/",
    eventItemSelector: "article.espresso_events",
    titleSelector: "header.event-header h2.entry-title a",
    linkSelector: "header.event-header h2.entry-title a",
    collegeName: "Macaulay Honors College",
    dateSelector: "span.ee-event-datetimes-li-daterange",
    timeSelector: "span.ee-event-datetimes-li-timerange",
    descriptionSelector: "div.event-content p",
    tagsSelector: "", // No tags found in the provided HTML
},


];
