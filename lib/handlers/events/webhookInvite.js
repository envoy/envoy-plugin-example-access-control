const helper = require('envoy-integrations-helper-nodejs');
const moment = require('moment-timezone');
const AccessControl = require('../../AccessControlClient');

async function webhookInvite(req, res) {
  const {
    envoy: {
      meta: {
        env: {
          accessControlAccessDuration,
          accessControlEarlyAccess,
          accessControlNotification,
          accessControlPostpend,
          accessControlVisitorMapping,
          accessControlOrgId,
          accessControlSiteId,
        },
        location: {
          attributes: {
            timezone,
          },
        },
      },
      payload: {
        attributes: {
          email,
          thumbnails,
          'full-name': fullName,
          'expected-arrival-time': arrivalTime,
        },
        relationships: {
          flow,
        },
      },
      installStorage,
      job,
    },
  } = req;

  if (!accessControlVisitorMapping[flow.data.id]) {
    await job.attach({ label: 'Access Ignored', value: 'This visitor type is not mapped for access in Access Control.' });
    return res.sendIgnored('Visitor is not mapped to permission flow.');
  }

  const emailFormatValid = helper.Strings.validateEmail(email);
  if (!emailFormatValid) {
    await job.attach({ label: 'Email Error', value: 'The email provided for this visitor can not be accepted by Access Control.' });
    return res.sendFailed('Access Control Error: Invalid Email');
  }

  try {
    const AppKey = await installStorage.get('accessControlAppKey');
    const AppSecret = await installStorage.get('accessControlAppSecret');
    const accessControl = new AccessControl(AppKey.value, AppSecret.value);

    const phoneNumber = await helper.SMS.getEntryPhoneNumber(req.envoy.body.payload.attributes);
    await accessControl.authenticate();
    const getGroups = accessControl[flow.data.id].map(async groupID => {
      return await accessControl.getGroup(accessControlOrgId, accessControlSiteId, groupID);
    });
    const getGroupResults = await Promise.all(getGroups);
    const groupTags = getGroupResults
      .filter(group => {
        const { isGlobal } = group;
        return `${isGlobal}` === 'false';
      })
      .map(group => {
        return group.tag;
      });

    /* ******************************************
     * begin building data blob for user creation
     * ***************************************** */
    const { payload } = req.envoy.body;
    const personData = {
      sendInvite: accessControlNotification || undefined,
      items: [{
        name: accessControlPostpend && `${fullName} (Created by Envoy)` || fullName,
        photo: (thumbnails && (thumbnails.original.length < 256) && thumbnails.original) || undefined,
        email: email || undefined,
        tags: groupTags || undefined,
        details: {
          phoneNumber: phoneNumber || undefined,
          createdBy: 'Created by Envoy',
          envoyId: `${payload.type}:${payload.id}`,
        },
      }],
      tags: groupTags || undefined,
    };
    /* ******************************************
     * end building data blob for user creation
     * ***************************************** */

    const personRecord = await accessControl.upsertPerson(accessControlOrgId, accessControlSiteId, personData);
    const personId = personRecord.items[0].id;
    if (!personId) {
      await job.attach({ label: 'Error', value: 'Member record failed to create in Access Control.' });
      return res.sendFailed('Member record failed to create in Access Control.');
    }
    await job.attach({ label: 'Person Record', value: 'Success' });
    let startAccessZuluTime = moment(arrivalTime).tz(timezone).subtract(accessControlEarlyAccess, 'minutes').toISOString();
    const timeNow = moment().tz(timezone);
    if (moment(startAccessZuluTime).add(5, 'seconds').isBefore(timeNow)) {
      startAccessZuluTime = moment(timeNow).tz(timezone).add(5, 'seconds').toISOString();
    }
    const endAccessZuluTime = moment(arrivalTime).tz(timezone).add(accessControlAccessDuration, 'minutes').toISOString();
    try { 
      await accessControl.scheduleStatusPerson(accessControlOrgId, accessControlSiteId, personId, 'active', startAccessZuluTime);
      await job.attach({ label: 'Begin Access', value: `${moment(startAccessZuluTime).format('YYYY-MM-DD HH:mm:ss')}` });
    } catch (e) {
      if (e.response.data
        && e.response.data.data
        && e.response.data.data.error
        && e.response.data.data.error.description === 'The scheduledDate field has to be a future date') {
        await job.attach({ label: 'Schedule Error', value: 'Start time is before current time (not permitted by Access Control)' });
      } else {
        await job.attach({ label: 'Schedule Error', value: 'Error assigning start of schedule.' });
      }

    }
    try {
      await accessControl.scheduleStatusPerson(accessControlOrgId, accessControlSiteId, personId, 'suspended', endAccessZuluTime); // set "end" of access
      await job.attach({ label: 'End Access', value: `${moment(endAccessZuluTime).format('YYYY-MM-DD HH:mm:ss')}` });
    } catch (e) {
      await job.attach({ label: 'Schedule Error', value: 'Error assigning end of schedule.' });
    }
  } catch (err) {
    console.log(err);
    await job.attach({ label: 'Person Record', value: 'Error during creation' });
    return res.sendFailed('Access Control Error: Error during Access Control person creation');
  }

  return res.send({ success: 'Success' });
}

module.exports = webhookInvite;
