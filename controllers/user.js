const DateService = require("../services/DateService");
const NotesService = require("../services/NotesService");
const StorageService = require("../services/StorageService");
const CalendarService = require("../services/CalendarService");

module.exports = {
  getUser: async (request, response) => {
    const user = request.user;
    response.json(user);
  },

  getGoogleCals: async (request, response) => {
    const user = request.user;
    const calendarServiceInstance = new CalendarService();
    const calendars = await calendarServiceInstance.getUserCalendars(user);
    if (calendars) {
      response.json(calendars);
    } else {
      response.status(500).send();
    }
  },

  getNotesStorageInfo: async (request, response) => {
    const user = request.user;
    const storageService = new StorageService();
    const notesStorageInfo = await storageService.getNotesStorageInfo(user);
    response.json(notesStorageInfo);
  },

  updateNotesStorageInfo: async (request, response) => {
    const user = request.user;
    const notesStorageUpdate = request.body;
    const storageService = new StorageService();
    const updatedNotesStorageInfo = await storageService.updateNotesStorageInfo(
      user,
      notesStorageUpdate
    );
    response.json(updatedNotesStorageInfo);
  },

  listGoogleDrives: async (request, response) => {
    const user = request.user;
    const { folderId } = request.query;
    const storageService = new StorageService();
    const googleDrives = await storageService.listGoogleDrives(user, folderId);
    response.json(googleDrives);
  },

  getGoogleCalEvents: async (request, response) => {
    const user = request.user;
    const { calendarId } = request.params;
    let { weekOf, prevOrNext } = request.query;
    const calendarServiceInstance = new CalendarService();
    const dateServiceInstance = new DateService();

    if (!weekOf) {
      let userCalTz = await calendarServiceInstance.getCalendarTimeZone(
        user,
        calendarId
      );
      weekOf = dateServiceInstance.getDateTimeForTimezone(userCalTz);
      const calendarEvents = await calendarServiceInstance.getCalEventsForWeek(
        user,
        calendarId,
        weekOf
      );
      response.json(calendarEvents);
      return;
    }

    if (weekOf) {
      if (!prevOrNext) {
        response
          .status(400)
          .send("Must provide query param prevOrNext if weekOf is specified");
      }

      if (["next", "prev"].indexOf(prevOrNext) === -1) {
        response.status(400).send("prevOrNext must be one of 'prev' or 'next'");
      }

      if (prevOrNext === "prev") {
        weekOf = dateServiceInstance.oneWeekBack(weekOf);
      }

      if (prevOrNext === "next") {
        weekOf = dateServiceInstance.oneWeekForward(weekOf);
      }

      const calendarEvents = await calendarServiceInstance.getCalEventsForWeek(
        user,
        calendarId,
        weekOf
      );
      response.json(calendarEvents);
      return;
    }
  },

  getFolders: async (request, response) => {
    // wrikeFolderService takes request
    // determines if response from Wrike is top level space or sub folder
    // if top level space, wrikeFolderService needs to make another call immediately and uniquely for Wrike
    // becuase initial wrike Spaces response doesn't give childFolders

    const { clickedFolderId } = request.query;
    const user = request.user;
    const storageService = new StorageService();

    /**
     * @todo this needs to be prepared to catch Error object from services/StorageService.js
     * @todo then, needs to give client some notice to retry the action
     */
    const folderData = await storageService.getFolders(user, clickedFolderId);
    // sort alphabetically
    folderData.sort(function (a, b) {
      let nameA = a.name.toUpperCase();
      let nameB = b.name.toUpperCase();
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });
    response.json(folderData);
  },

  createNotes: async (request, response) => {
    /**
     * @todo Error handling for bad data supplied with URL above
     */

    const user = request.user;
    let { folderId, eventId, calendarId } = request.params;

    const notesService = new NotesService();
    const status = await notesService.createNotesForEvent(
      user,
      folderId,
      eventId,
      calendarId
    );
    response.json(status);
  },
};
