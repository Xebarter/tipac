# Admin Dashboard

This is a comprehensive admin dashboard for managing Gallery, Events, and Tickets for the TIPAC website.

## Features

1. **Gallery Management**
   - View all gallery images
   - Upload new images
   - Delete existing images

2. **Events Management**
   - View all events
   - Create new events
   - Edit existing events
   - Delete events

3. **Ticket Management**
   - View all tickets
   - Generate new tickets
   - Update ticket status

## Access

The admin dashboard can be accessed at `/admin`. For demo purposes, use the following credentials:
- Username: `admin`
- Password: `password`

## API Routes

### Gallery
- `GET /admin/api/gallery` - Get all gallery images
- `POST /admin/api/gallery` - Upload a new image
- `DELETE /admin/api/gallery?filename={filename}` - Delete an image

### Events
- `GET /admin/api/events` - Get all events
- `POST /admin/api/events` - Create a new event
- `PUT /admin/api/events` - Update an existing event
- `DELETE /admin/api/events?id={id}` - Delete an event

### Tickets
- `GET /admin/api/tickets` - Get all tickets
- `POST /admin/api/tickets` - Create a new ticket
- `PUT /admin/api/tickets` - Update an existing ticket
- `DELETE /admin/api/tickets?id={id}` - Delete a ticket

## Implementation Notes

1. The dashboard uses a simple client-side authentication mechanism for demo purposes.
2. Gallery images are stored in the `public/gallery` directory.
3. Events and tickets are stored in MongoDB collections.
4. All API routes are protected and should only be accessible through the admin dashboard.

## Future Improvements

1. Implement proper server-side authentication with JWT tokens
2. Add image upload functionality with file validation
3. Implement event creation and editing forms
4. Add ticket generation functionality
5. Improve error handling and user feedback
6. Add search and filtering capabilities
7. Implement pagination for large datasets