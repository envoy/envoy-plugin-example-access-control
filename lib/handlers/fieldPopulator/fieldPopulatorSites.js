const AccessControl = require('../../AccessControlClient');

async function fieldPopulatorSites(req,res) {
  const {
    envoy: {
      meta: {
        env: {
          accessControlOrgId
        },
        params: {
          search,
          page
        },
      },
      installStorage,
      userAPI,
    }
  } = req;
  const AppKey = await installStorage.get('accessControlAppKey');
  const AppSecret = await installStorage.get('accessControlAppSecret');
  const accessControl = new AccessControl(AppKey.value,AppSecret.value);
  const envoyInfo = await userAPI.me();
  const envoyUserId = envoyInfo.id;
  await accessControl.authenticate(envoyUserId);

  const filter = (search) ? { "name": search } : {};
  const siteList = await accessControl.siteList(accessControlOrgId, filter, page);
  let siteOptions = siteList.map(org => ({ value: org.id, label: `${org.name}` }));
      siteOptions = (siteOptions.length === 0) ? [{ value: null, label: `Groups configured as "Site Only" not found.`, disabled: true }] : siteOptions;
  res.send(siteOptions);
}

module.exports = fieldPopulatorSites;
