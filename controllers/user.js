const UserService = require("../services/UserService");

module.exports = {
  getUser: async (request, response) => {
    const user = request.user;
    response.json(user);
  },

  getGoogleCals: async (request, response) => {
    const user = request.user;
    const userServiceInstance = new UserService();
    const calendars = await userServiceInstance.getUserCalendars(user);
    if (calendars) {
      response.json(calendars);
    } else {
      response.status(500).send();
    }
  },

  listGoogleDrives: async (request, response) => {
    const user = request.user;
    const userServiceInstance = new UserService();
    const googleDrives = await userServiceInstance.listGoogleDrives(user);
    response.json(googleDrives);
  },

  getGoogleCalEvents: async (request, response) => {
    const user = request.user;
    const { calendarId } = request.params;
    const userServiceInstance = new UserService();
    const calendarEvents = await userServiceInstance.getCalendarEvents(
      user,
      calendarId
    );
    response.json(calendarEvents);
  },

  getFolders: async (request, response) => {
    // wrikeFolderService takes request
    // determines if response from Wrike is top level space or sub folder
    // if top level space, wrikeFolderService needs to make another call immediately and uniquely for Wrike
    // becuase initial wrike Spaces response doesn't give childFolders

    const { clickedFolderId } = request.query;
    const user = request.user;
    const userServiceInstance = new UserService();

    /**
     * @todo this needs to be prepared to catch Error object from services/UserService.js:352
     * @todo then, needs to give client some notice to retry the action
     */
    const folderData = await userServiceInstance.getFolders(
      user,
      clickedFolderId
    );
    response.json(folderData);
  },

  createNotes: async (request, response) => {
    /**
     * @todo Error handling for bad data supplied with URL above
     */

    const user = request.user;
    let { folderId, eventId, calendarId } = request.params;

    const userServiceInstance = new UserService();
    const status = await userServiceInstance.createNotesForEvent(
      user,
      folderId,
      eventId,
      calendarId
    );
    response.json(status);
  },
};
