# 🗓 CalendarNotes

## Demo

[![CalendarNotes Demonstration](https://embed-ssl.wistia.com/deliveries/0ab03963d7e9e65130366e3536344907.jpg?image_crop_resized=960x564&image_play_button=1&image_play_button_color=e65344EE)](https://volkmattj.wistia.com/medias/hhld2d17dn "CalendarNotes Demonstration")

## Table of Contents

- [Contributing](#contributing)
- [Deployment](#deployment)
- [Folder Structure](#folder-structure)
- [Roadmap](#roadmap)
- [What I Learned Building this Project](#what-i-learned-building-this-project)

## 💻 Contributing

1. `git clone https://github.com/matthewvolk/calendarnotes.git`
2. `cd calendarnotes`
3. `npm install && cd client && npm install`
4. `cp .env.sample .env` and optionally edit React environment variables in `.env`
5. `cd .. && cp .env.sample .env` and add Node environment variables in `.env`
6. Generate localhost self-signed certificate: [Example](https://stackoverflow.com/a/32169444) (required to interact with Wrike API)
7. `npm run develop`

## ☁️ Deployment

**Server**

- Commit all changes and push to `master` branch
- Configure SSH Config for production server and run `./deploy.sh`

**Web (Next.js)**

- Commit all changes and push to `master` branch
- Vercel will deploy to production automatically when it detects changes to `master` branch

## 🗂 Folder structure

```
calendarnotes/
├── controllers/   # Controllers for Express.js routes
├── middlewares/   # Express.js middleware handlers
├── models/        # Mongoose.js models
├── router/        # Express.js routes
├── services/      # Business logic for Express.js controllers
├── web/           # Frontend Next.js app
```

## 🛣 Roadmap

[View Public Trello Board](https://trello.com/b/DtfoFkpD/%F0%9F%97%93-calendarnotes)

# What I Learned Building this Project

## Systems Design

### Database

There are a few categories of data stored in this application:

- User/User Authentication Data
- User Application Preferences Data
- Meeting Notes Data

User and User Authentication data is fairly small in terms of storage footprint; it consists of basic user information, such as first name, last name, email, etc., as well as access and refresh tokens to authenticate with third party applications using OAuth2.
Similarly, user application preference data is also relatively small. This data consists of data that could also be stored in a browser cookie, but is stored in a database so the user's preferences are available from different browsers and computers. Information such as the user's default calendar that they should see when they log in, as well as their preferred notes storage location (such as Google Drive) is in the scope of this data category.

For the two data categories above, the convenience of a document-based store such as MongoDB made the most sense, especially because of the requirements around the third category of data: Meeting Notes Data.

Meeting Notes Data is defined as data pertaining to the meeting notes "events" that the user creates with the application. One of the main features of this application is that when the user creates meeting notes for the event, the application is aware of the newly created meeting notes file, and can perform CRUD operations on the document based on user activity. For example, a user may create a meeting notes "event", and then reschedule the meeting tied to the event to the next day. The application listens to Google Calendar webhooks and is able to subsequently move the associated notes event to the updated meeting time, as well as update the meeting notes document with the same information. In order to understand which meeting notes to listen to Google Calendar Webhooks for, the application must have a mechanism to store information about the meeting notes that the user creates.

Because there is no limit to the number of meeting notes the user can create, and because the number of columns associated with each meeting note is small, I chose MongoDB as a document-based storage system. Each user document stored in MongoDB has a subdocument called "meetingNotes" that contains information about every single meeting notes event created by the user using the application.

<!--

### Client/Server Relationship

## Application Architecture

### Bulletproof Node.js Architecture

## Programming Concepts

### Working with Date/Time

### Recursion and Folder Trees

### Authorization/Authentication

#### JSON Web Tokens

### SOLID Principles

### Testing (TDD, Red Green Refactor)

### OAuth2 Flows with Access and Refresh Token Exchanges

-->
