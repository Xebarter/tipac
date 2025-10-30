# Events Page Documentation

## Overview

The Events page displays upcoming events from the Supabase database. It fetches events that are published and have a future date, showing them in a responsive grid layout.

## Features

1. **Responsive Design**: Works on mobile, tablet, and desktop screens
2. **Dynamic Content**: Fetches events directly from Supabase database
3. **Event Filtering**: Only shows published events with future dates
4. **Ticket Integration**: Each event has a "Get Tickets" button that links to the ticket purchase page with the event pre-selected
5. **Loading States**: Shows loading spinner while fetching data
6. **Error Handling**: Displays error messages if data fetching fails
7. **Empty State**: Shows a friendly message when no upcoming events are available

## Technical Implementation

### Data Fetching
- Uses Supabase client to fetch events
- Filters for:
  - `is_published = true`
  - `date >= current date` (only future events)
  - Orders by date ascending

### Components Used
- Framer Motion for animations
- Next.js Link for navigation
- Custom Button component
- Date formatting with native JavaScript Date methods

### URL Parameters
The page accepts a query parameter `event` to pre-select an event on the tickets page:
```
/tickets?event={event_id}
```

## Integration Points

1. **Supabase Database**: Connects to the `events` table
2. **Tickets Page**: Links to `/tickets` with event pre-selection
3. **Navigation**: Integrated into the main navigation menu

## Future Enhancements

1. Add event categories/filters
2. Implement pagination for large numbers of events
3. Add event images to the display
4. Include a calendar view option
5. Add event search functionality