const UserService = require("../services/UserService");

module.exports = {
  getUser: async (request, response) => {
    const user = request.user;
    response.json(user);
  },

  getGoogleCals: async (request, response) => {
    const {
      google: { id: userId },
    } = request.user;
    const user = new UserService();
    const calendars = await user.getUserCalendars(userId);
    response.json(calendars);
  },

  getGoogleCalEvents: async (request, response) => {
    const {
      google: { id: userId },
    } = request.user;
    const { calendarId } = request.params;

    const user = new UserService();
    const calendarEvents = await user.getCalendarEvents(userId, calendarId);
    response.json(calendarEvents);
  },

  getFolders: async (request, response) => {
    // wrikeFolderService takes request
    // determines if response from Wrike is top level space or sub folder
    // if top level space, wrikeFolderService needs to make another call immediately and uniquely for Wrike
    // becuase initial wrike Spaces response doesn't give childFolders

    const { clickedFolderId } = request.query;
    const requestingUser = request.user;

    const folderGetter = new UserService();

    /**
     * @todo this needs to be prepared to catch Error object from services/UserService.js:352
     * @todo then, needs to give client some notice to retry the action
     */
    const folderData = await folderGetter.getFolders(
      requestingUser,
      clickedFolderId
    );
    response.json(folderData);
  },

  createNotes: async (request, response) => {
    /**
     * @todo Error handling for bad data supplied with URL above
     */

    const {
      google: { id: userId },
    } = request.user;
    let { folderId, eventId, calendarId } = request.params;

    const user = new UserService();
    const status = await user.createNotesForEvent(
      userId,
      folderId,
      eventId,
      calendarId
    );
    response.json(status);
  },
};
