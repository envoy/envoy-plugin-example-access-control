const AccessControl = require('../../AccessControlClient');

async function fieldPopulatorGroups(req, res) {
  const {
    envoy: {
      installStorage,
      meta: {
        env: {
          accessControlOrgId,
        },
      },
      userAPI,
    },
  } = req;
  const AppKey = await installStorage.get('accessControlAppKey');
  const AppSecret = await installStorage.get('accessControlAppSecret');
  const accessControl = new AccessControl(AppKey.value, AppSecret.value);
  const envoyInfo = await userAPI.me();
  const envoyUserId = envoyInfo.id;

  await accessControl.authenticate(envoyUserId);
  const groupList = await accessControl.groupList(accessControlOrgId);
  let groupOptions = groupList
    .filter(group => {
      const { isGlobal } = group;
      return `${isGlobal}` === 'false'; // exclude global groups
    })
    .map(group => ({ value: group.id, label: `${group.name}` }));
  groupOptions = (groupOptions.length === 0) ? [{ value: null, label: 'Groups configured as "Site Only" not found.', disabled: true }] : groupOptions;
  res.send(groupOptions);
}

module.exports = fieldPopulatorGroups;
