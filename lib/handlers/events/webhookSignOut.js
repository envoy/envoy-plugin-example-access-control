const moment = require('moment-timezone');
const AccessControl = require('../../AccessControlClient');

async function webhookSignOut(req, res) {
  const {
    envoy: {
      meta: { 
        env: {
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
          'expected-arrival-time': arrivalTime,
          'signed-in-at': signInTime,
        },
        relationships: {
          flow: {
            data: {
              id: flowId,
            },
          },
        },
      },
      installStorage,
      job,
    },
  } = req;

  if (!accessControlVisitorMapping[flowId]) {
    await job.attach({ label: 'Access Ignored', value: 'This visitor type is not mapped for access in Access Control.' });
    return res.sendIgnored('Visitor is not mapped to permission flow.');
  }

  try {
    const AppKey = await installStorage.get('accessControlAppKey');
    const AppSecret = await installStorage.get('accessControlAppSecret');
    const accessControl = new AccessControl(AppKey.value, AppSecret.value);

    await accessControl.authenticate();
    const personRecord = await accessControl.findPersonByEmail(accessControlOrgId, accessControlySiteId, email);
    const personId = personRecord[0].id;
    if (!personId) {
      await job.attach({
        label: 'Error',
        value: 'Member record could not be found in Access Control.',
      });
      return res.sendFailed('Member record could not be found in Access Control.');
    }

    let endAccessZuluTime = moment().tz(timezone).add(5, 'seconds').toISOString();
    if (moment(signInTime).isBefore(arrivalTime)) {
      endAccessZuluTime = moment(arrivalTime).tz(timezone).add(5, 'seconds').toISOString();
    }
    await accessControl.scheduleStatusPerson(accessControlOrgId, accessControlSiteId, personId, 'suspended', endAccessZuluTime); // set "end" of access
    await job.attach({
      label: 'Access Terminated',
      value: `${moment(endAccessZuluTime).format('YYYY-MM-DD HH:mm:ss')}`,
    });
  } catch (err) {
    console.log(err);
    await job.attach({
      label: 'Person Record',
      value: 'Error during expiration',
    });
    return res.sendFailed('Access Control Error: Error during Access Control expiration');
  }
  return res.send({ success: 'Success' });
}

module.exports = webhookSignOut;
