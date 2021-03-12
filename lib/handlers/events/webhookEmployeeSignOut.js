const helper = require('envoy-integrations-helper-nodejs');
const moment = require('moment-timezone');
const AccessControl = require('../../AccessControlClient');

async function webhookEmployeeSignOut(req, res) {
  const {
    envoy: {
      meta: {
        env: {
          accessControlOrgId,
          accessControlSiteId,
          envoyProtectEnabled,
          envoyProtectToggleAccess,
          envoyProtectExcludeEmployees,
        },
        location: {
          id: locationId,
          attributes: {
            timezone, 
          },
        },
      },
      payload: {
        attributes: {
          email,
        },
      },
      installStorage,
      job,
      userAPI,
    },
  } = req;

  if (!envoyProtectEnabled) {
    await job.attach({ label: 'Skipped', value: 'Protect is not enabled in the Access Control integration during sign-out.' });
    return res.sendIgnored('Envoy Protect is not enabled.');
  }

  const employeeParams = {
    'filter[query]': email,
    'page[limit]': 1,
    'page[offset]': 0,
  };
  const employeeData = await userAPI.locationEmployees(locationId, employeeParams);
  const employeeId = (employeeData && employeeData[0] && employeeData[0].id) ? employeeData[0].id : undefined;
  if (envoyProtectExcludeEmployees.includes(employeeId)) {
    await job.attach({ label: 'Excluded', value: 'This employee is excluded from Protect adjustments in Access Control during sign-out.' });
    return res.sendIgnored('Employee excluded from Access Control integration.');
  }

  const emailFormatValid = helper.Strings.validateEmail(email);
  if (!emailFormatValid) {
    await job.attach({ label: 'Email Error', value: 'The email provided for this employee can not be accepted by Access Control.' });
    return res.sendFailed('Access Control Error: Invalid Email');
  }

  try {
    const appKey = await installStorage.get('accessControlAppKey');
    const appSecret = await installStorage.get('accessControlAppSecret');
    const accessControl = new AccessControl(appKey.value, appSecret.value);

    await accessControl.authenticate();
    const employeeRecord = await accessControl.findPersonByEmail(accessControlOrgId, accessControlSiteId, email);
    const accessControlUserId = employeeRecord[0].id;

    if (!accessControlUserId) {
      await job.attach({ label: 'Error', value: 'Employee record with corresponding employee email not found in Access Control.' });
      return res.sendFailed('Employee record not found in Access Control (sign-in)');
    }

    if (envoyProtectToggleAccess) {
      const endAccessZuluTime = moment().tz(timezone).add(3, 'seconds').toISOString();
      await accessControl.scheduleStatusPerson(accessControlOrgId, accessControlSiteId, accessControlUserId, 'suspended', endAccessZuluTime); // set "end" of access
      await job.attach({ label: 'Protect Access Ended', value: `${moment(endAccessZuluTime).format('YYYY-MM-DD HH:mm:ss')}` });
    }
  } catch (err) {
    console.log(err);
    await job.attach({ label: 'Person Record', value: 'Error during creation' });
    return res.sendFailed('Access Control Error: Error during Access Control person creation');
  }
  return res.send({ success: 'Success' });
}

module.exports = webhookEmployeeSignOut;
