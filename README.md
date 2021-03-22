# Envoy Access Control Sample Application

## Background
Envoy provides products that enable offices to provide a seamless sign-in experience for their visitors.
Many of our customers want to ensure that their visitors are securely and automatically provisioned
badges that allow them to access the building automatically after they’ve signed into Envoy. Instead of
contacting property management for individual guests each day, the access control integration will pick up
new Envoy visitors sign-ins and provision temporary building access badges while assigning the
appropriate access levels automatically.

## In this Repo
This repo is intended to showcase an example middleware with the core components needed to successfully integrate with Envoy's Access Control services. We will go through the core functions, and how to use the responses from those functions to integrate Envoy's functionality within your app.

### index.js
Within the index file off the root, you will find the endpoints that have already been set up for your use, and where those functions are within the library. The routes follow the same flow a user would follow; setup, field pre-population, and on-going events that the application will be handling.

### ./lib/handlers/setupStep/setupStepAuthenticate
You will be using this endpoint for a user who is setting up your new app on Envoy. Using our [Integration Builder](https://developers.envoy.com/hub/docs/integration-builder), you can enter the endpoint "https://www.myapp.com/setup-step-authenticate" as the posting endpoint for intialization which will go through an OAuth2 workflow. The data points passed through would be the following:

1. Client App Key
2. Client App Secret
3. Organization ID
4. The Envoy User ID

From here, you now have context to the user who has installed your app, and you can begin taking requests from that user using Envoy.

### Field Populators
Authentication steps can be any of the following:

* OAuth2 - a dialog to authenticate with
* Pop-up - a modal window with custom content
* Form - something the user fills out

For apps that would like to have more control over what can be selected by a user who is signing in, you can pre-populate the fields with approved values such as duration of stay, pre-approved organization visitors, and groups.

We can have a look at <b>lib/handlers/fieldPopulator/fieldPopulatorDurations.js</b> to see how this would work. Using a form step, you would supply the endpoint "https://www.myapp.com/field-populator-durations" as "Validation URL" that would provide pre-populated values contained in the file to the user. This ensures that the user's experience is within the bounds of what your business envisions.

### Events
For events like sign ins, invitations, and sign outs of both guests and employees, you can use the integration builder to set up a webhook to receive those events. Let's take the example of an employee signing in, and you'd like to execute custom logic against that event:

1. Setup webhook "https://www.myapp.com/webhook-employee-sign-in" with "employee sign in" event
2. visit <b>lib/handlers/events/webhookSignIn.js</b> to see how a sample application would handle that event so that the custom application has context to the provisioning that Envoy has granted that employee.

You will find the other common events as well that can be configured to fit what's needed for your application to be synced to Envoy's Access Control.


### Support
If you have any questions regarding how to initiate these steps to build an app that fits your business needs, please don't hesitate to reach out to example@envoy.com.
