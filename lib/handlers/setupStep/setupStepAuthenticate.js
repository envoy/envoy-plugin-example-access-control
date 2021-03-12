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
    }
  } = req;

  const storageAppKey    = await installStorage.get('accessControlAppKey');
  const storageAppSecret = await installStorage.get('paccessControlAppSecret');
  const appKey           = accessControlppKey || (storageAppKey && storageAppKey.value);
  const appSecret        = accessControlAppSecret || (storageAppSecret && storageAppSecret.value);

  if (!(appKey || appSecret)) {
    return res.sendFailed('Access Control credentials are required.');
  }
  try {
    const { id: envoyUserId } = await userAPI.me();
    const accessControl = new AccessControl(appKey,appSecret);
    await accessControl.authenticate(appKey, appSecret, envoyUserId);
    await installStorage.set('accessControlAppKey', appKey);
    await installStorage.set('accessControlAppSecret', appSecret);
    return res.send({ accessControlAppKey: appKey, accessControlAppSecret: appSecret, accessControlOrgId });
  } catch (err) {
    if (err.response.data && err.response.data['error_description'] && err.response.data['error_description'] === 'bad client secret') {
      return res.sendFailed('Access Control rejected the provided App Secret.');
    }
    console.log(err);
    return res.sendFailed('Access Control credentials rejected during authentication');
  }
}

module.exports = setupStepAuthentication;
