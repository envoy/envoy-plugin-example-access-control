const { middleware, errorMiddleware, asyncHandler } = require('@envoy/envoy-integrations-sdk');
const express = require('express');

const app = express();
app.use(middleware()); 

// Setup Steps
app.post('/setup-step-authenticate', asyncHandler(require('./lib/handlers/setupStep/setupStepAuthenticate')));

// Field Populators
app.post('/field-populator-durations', require('./lib/handlers/fieldPopulator/fieldPopulatorDurations'));
app.post('/field-populator-protect-durations', require('./lib/handlers/fieldPopulator/fieldPopulatorProtectDuration'));
app.post('/field-populator-orgs', asyncHandler(require('./lib/handlers/fieldPopulator/fieldPopulatorOrgs')));
app.post('/field-populator-sites', asyncHandler(require('./lib/handlers/fieldPopulator/fieldPopulatorSites')));
app.post('/field-populator-groups', asyncHandler(require('./lib/handlers/fieldPopulator/fieldPopulatorGroups')));
app.post('/field-populator-flows', asyncHandler(require('./lib/handlers/fieldPopulator/fieldPopulatorFlows')));
app.post('/field-populator-employees', asyncHandler(require('./lib/handlers/fieldPopulator/fieldPopulatorEmployees')));

// Events
app.post('/webhook-invite', asyncHandler(require('./lib/handlers/events/webhookInvite')));
app.post('/webhook-sign-in', asyncHandler(require('./lib/handlers/events/webhookSignIn')));
app.post('/webhook-sign-out', asyncHandler(require('./lib/handlers/events/webhookSignOut')));
app.post('/webhook-employee-sign-in', asyncHandler(require('./lib/handlers/events/webhookEmployeeSignIn')));
app.post('/webhook-employee-sign-out', asyncHandler(require('./lib/handlers/events/webhookEmployeeSignOut')));

app.use(errorMiddleware(console.log));
app.listen(process.env.PORT || 0, () => {});
