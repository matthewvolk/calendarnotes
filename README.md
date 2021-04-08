# 🗓 CalendarNotes

## 💻 Getting Started

1. `git clone https://github.com/matthewvolk/calendarnotes.git`
2. `cd calendarnotes`
3. `npm install && cd client && npm install`
4. `cp .env.sample .env` and optionally edit React environment variables in .env
5. `cd .. && cp .env.sample .env` and add Node environment variables in .env
6. Generate localhost self-signed certificate: [Example](https://stackoverflow.com/a/32169444) (required to interact with Wrike API)
7. `npm run develop`

## 🗂 Folder structure

```
calendarnotes/
├── api/           # Express.js routes
├── client/        # Frontend create-react-app
├── config/        # Passport.js config
├── middlewares/   # Express.js middleware handlers
├── models/        # Mongoose.js models
├── services/      # Business logic for Express.js routes
```

## 🛣 Roadmap

[View Public Trello Board](https://trello.com/b/DtfoFkpD/%F0%9F%97%93-calendarnotes)
