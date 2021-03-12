const helper = require('envoy-integrations-helper-nodejs');
const moment = require('moment-timezone');
const AccessControl = require('../../AccessControlClient');

async function webhookSignIn(req, res) {
  const {
    envoy: {
      meta: {
        env: {
          accessControlAccessDuration,
          accessControlNotification,
          accessControlPostpend,
          accessControlVisitorMapping,
          accessControlOrgId,
          accessControlSiteId,
          accessControlInviteOnly,
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
          'signed-in-at': signInTime,
        },
        relationships: {
          flow,
          invite,
        },
      },
      installStorage,
      job,
    },
  } = req;

  if (accessControlInviteOnly && !invite) {
    await job.attach({ label: 'Restriction', value: 'Visitors without an invite are not configured to receive access.' });
    return res.sendIgnored('Visitors without an invite are not configured to receive access.');
  }

  if (accessControlInviteOnly && invite) {
    await job.attach({ label: 'Skipped', value: 'Access Control access was assigned for this visitor during invite creation.' });
    return res.sendIgnored('Access Control access was assigned for this user during invite creation.');
  }

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
    const getGroups = accessControlVisitorMapping[flow.data.id].map(async groupID => {
      return await accessControl.getGroup(accessControlOrgId, accessControlSiteId, groupID);
    });
    const getGroupResults = await Promise.all(getGroups);
    const groupTags = getGroupResults
      .filter(group => {
        const { isGlobal } = group;
        return `${isGlobal}` === 'false'; // ignore global groups
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
      tags: groupTags || undefined, // a group tag is required so this "undefined" may be unsuitable.
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

    const startTime = (signInTime) || arrivalTime;
    const startAccessZuluTime = moment(startTime).tz(timezone).add(5, 'seconds').toISOString();
    const endAccessZuluTime = moment(startTime).tz(timezone).add(accessControlAccessDuration, 'minutes').toISOString();
    await accessControl.scheduleStatusPerson(accessControlOrgId, accessControlSiteId, personId, 'active', startAccessZuluTime); // set "beginning" of access
    await accessControl.scheduleStatusPerson(accessControlOrgId, accessControlSiteId, personId, 'suspended', endAccessZuluTime); // set "end" of access
    await job.attach({ label: 'Begin Access', value: `${moment(startAccessZuluTime).format('YYYY-MM-DD HH:mm:ss')}` });
    await job.attach({ label: 'End Access', value: `${moment(endAccessZuluTime).format('YYYY-MM-DD HH:mm:ss')}` });
  } catch (err) {
    console.log(err);
    await job.attach({ label: 'Person Record', value: 'Error during creation' });
    return res.sendFailed('Access Control Error: Error during Access Control person creation');
  }
  return res.send({ success: 'Success' });
}

module.exports = webhookSignIn;
