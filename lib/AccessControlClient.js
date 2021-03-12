const axios = require('axios');

class AccessControl {
  constructor(accessControlAppKey, accessControlAppSecret) {
    this.appKey = accessControlAppKey;
    this.appSecret = accessControlAppSecret; 
    this.axios = axios.create({
      baseURL: 'https://api.exampleaccesscontrol.com/manage',
      method: 'GET',
      headers: {
        'User-Agent': 'Envoy Integration for Example Access Control',
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${accessControlAppKey}:${accessControlAppSecret}`).toString('base64')}`,
      },
    });
  }

  async authenticate() {
    return await this.orgList();
  }

  async authenticateDeprecated(envoyUserId) {
    const checkAxiosAuth = this.axios.defaults.headers.Authorization;
    if (checkAxiosAuth) {
      return;
    }
    const data = {
      grant_type: 'password',
      device: `${envoyUserId}`,
      username: this.appKey,
      password: this.appSecret,
    };
    const response = await this.axios({
      baseURL: 'https://api.stage.exampleaccesscontrol.com/v1',
      url: '/oauth2/token',
      method: 'POST',
      data,
    });
    const { access_token } = response.data;
    this.axios.defaults.headers.Authorization = `Bearer ${access_token}`;
    return response.data;
  }

  async orgList() {
    const response = await this.axios({
      baseURL: 'https://api.exampleaccesscontrol.com/v1/',
      url: '/orgs',
    });
    return response.data.items;
  }

  async siteList(orgId, filter, page = 1, sortBy = 'name', sortOrder = 'desc', limit = 100) {
    const response = await this.axios({
      url: 'sites',
      params: {
        orgId,
        filter: (Object.entries(filter).length >= 1) ? JSON.stringify(filter) : undefined,
        page,
        sortBy,
        sortOrder,
        limit,
      },
    });
    return response.data.items;
  }

  async getGroup(orgId, siteId, groupId, type = 'persons') {
    const response = await this.axios({
      url: `/groups/${groupId}`,
      params: {
        orgId,
        siteId,
        type, // value must be either 'persons' or 'doors'
      },
    });
    return response.data;
  }

  async groupList(orgId, siteId, filter = {}, page = 1, type = 'persons', limit = 100, sortBy = 'name', sortOrder = 'desc') {
    const response = await this.axios({
      url: '/groups',
      params: {
        orgId,
        siteId,
        filter: (Object.entries(filter).length >= 1) ? JSON.stringify(filter) : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
        type,
      },
    });
    return response.data.items;
  }

  async addPerson(orgId, siteId, data) {
    const response = await this.axios({
      url: 'persons/import',
      method: 'POST',
      params: {
        orgId,
        siteId,
      },
      data,
    });
    return response.data;
  }

  async addPersonToGroup(orgId, siteId, groupId, personId) {
    const response = await this.axios({
      url: `groups/${groupId}/persons/${personId}`,
      method: 'POST',
      params: {
        orgId,
        siteId,
      },
    });
    return response.data;
  }

  async findPerson(orgId, siteId, sortBy = 'name', filter, limit = 100, page = 1) {
    const response = await this.axios({
      url: 'persons',
      method: 'GET',
      params: {
        filter: (Object.entries(filter).length >= 1) ? JSON.stringify(filter) : undefined,
        orgId,
        siteId,
        sortBy,
        limit,
        page,
      },
    });
    return response.data;
  }

  async findPersonPages(orgId, siteId, filter, forEachPage, page = 1) {
    const peoplePage = await this.findPerson(orgId, siteId, 'name', filter, 100, page);
    if (peoplePage.items && peoplePage.items.length === 0) {
      return;
    }
    await Promise.all(peoplePage.items.map(people => forEachPage(people)));
    return this.findPersonPages(orgId, siteId, filter, forEachPage, page + 1);
  }

  async findPersonByEmail(orgId, siteId, email) {
    const filter = { email };
    const peopleMatches = [];
    await this.findPersonPages(orgId, siteId, filter, async (people) => {
      if (people.email === email) {
        peopleMatches.push(people);
      }
    });
    return peopleMatches;
  }

  async upsertPerson(orgId, siteId, personData) {
    const { email } = personData.items[0];
    const emailMatches = [];
    await this.findPersonByEmail(orgId, siteId, email, async (matchingPerson) => {
      emailMatches.push(matchingPerson);
    });
    if (emailMatches.length >= 1) {
      return emailMatches;
    }

    return this.addPerson(orgId, siteId, personData);
  }

  async scheduleStatusPerson(orgId, siteId, personId, status, zuluTime) {
    return this.axios({
      baseURL: 'https://api.exampleaccesscontrol.com/mobile-access',
      url: `/persons/${personId}/scheduled-statuses`,
      method: 'POST',
      data: {
        status: `${status}`, // "active" / "suspended"
        scheduledDate: `${zuluTime}`, // "2020-11-06T19:33:16.993Z"
      },
      params: {
        siteId,
        orgId,
      },
    });
  }

  async sendInvite(orgId, siteId, personId) {
    const response = await this.axios({
      url: `persons/${personId}/resend`,
      method: 'POST',
      params: {
        orgId,
        siteId,
      },
    });
    return response.data;
  }
}

module.exports = AccessControl;
