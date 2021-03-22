const AccessControl = require('../../AccessControlClient');

async function setupStepAuthentication(req, res) {
  const {
    envoy: {
      payload: {
        accessControlAppKey,
        accessControlAppSecret,
        accessControlOrgId,
      },
      installStorage,
      userAPI,
    },
  } = req;

  const storageAppKey = await installStorage.get('accessControlAppKey');

  // typo
  const storageAppSecret = await installStorage.get('accessControlAppSecret');

  // the or would be a boolean and not a value, changed with save nav
  const appKey = accessControlAppKey || storageAppKey?.value;
  const appSecret = accessControlAppSecret || storageAppSecret?.value;
  // change end

  if (!(appKey || appSecret)) {
    return res.sendFailed('Access Control credentials are required.');
  }
  try {
    const { id: envoyUserId } = await userAPI.me();
    const accessControl = new AccessControl(appKey, appSecret);
    await accessControl.authenticate(appKey, appSecret, envoyUserId);
    await installStorage.set('accessControlAppKey', appKey);
    await installStorage.set('accessControlAppSecret', appSecret);

    // key missing
    return res.send({ accessControlAppKey: appKey, accessControlAppSecret: appSecret, accessControlOrgID: accessControlOrgId });
  } catch (err) {
    if (err.response.data && err.response.data.error_description && err.response.data.error_description === 'bad client secret') {
      return res.sendFailed('Access Control rejected the provided App Secret.');
    }
    console.log(err);
    return res.sendFailed('Access Control credentials rejected during authentication');
  }
}

module.exports = setupStepAuthentication;
