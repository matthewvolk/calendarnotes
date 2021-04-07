# 🗓 CalendarNotes

## Getting Started

1. `git clone https://github.com/matthewvolk/calendarnotes.git`
2. `cd calendarnotes`
3. `npm install && cd client && npm install && cd ..`
4. `cp .env.sample .env` and then enter environment variables in .env
5. `npm run develop`

## Folder structure

```
calendarnotes/
├── api/           # Express.js routes
├── client/        # Frontend create-react-app
├── config/        # Passport.js config
├── middlewares/   # Express.js middleware handlers
├── models/        # Mongoose.js models
├── services/      # Business logic for Express.js routes
```
