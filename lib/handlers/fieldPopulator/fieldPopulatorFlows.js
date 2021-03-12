async function fieldPopulatorFlows(req, res) {
  const {
    envoy: {
      meta: {
        location,
      },
      userAPI,
    }, 
  } = req;
  const envoyVisitorFlows = await userAPI.flows(location.id);
  const envoyVisitorFlowsOptions = envoyVisitorFlows.map(visitorFlow => ({ value: visitorFlow.id, label: `${visitorFlow.attributes.name}` }));
  res.send(envoyVisitorFlowsOptions);
}

module.exports = fieldPopulatorFlows;
