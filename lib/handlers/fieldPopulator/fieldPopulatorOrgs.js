const AccessControl = require('../../AccessControlClient');

async function fieldPopulatorOrgs(req, res) {
  const {
    envoy: {
      installStorage,
      userAPI,
    }, 
  } = req;
  const AppKey = await installStorage.get('accessControlAppKey');
  const AppSecret = await installStorage.get('accessControlAppSecret');
  const accessControl = new AccessControl(AppKey.value, AppSecret.value);
  const envoyInfo = await userAPI.me();
  const envoyUserId = envoyInfo.id;

  await accessControl.authenticate(envoyUserId);
  const organizationList = await accessControl.orgList();
  const organizationOptions = organizationList.map(org => ({ value: org.organization.id, label: `${org.organization.name}` }));
  res.send(organizationOptions);
}

module.exports = fieldPopulatorOrgs;
