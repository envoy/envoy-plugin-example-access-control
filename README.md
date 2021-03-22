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

### Setup Step
You will be using this endpoint for a user who is setting up your new app on Envoy. Using our [Integration Builder](https://developers.envoy.com/hub/docs/integration-builder), you can enter the endpoint "https://www.myapp.com/setup-step-authenticate" as the posting endpoint for intialization which will go through an OAuth2 workflow. The data points passed through would be the following:

1. Client App Key
2. Client App Secret
3. Organization ID
4. The Envoy User ID

From here, you now have context to the user who has installed your app, and you can begin taking requests from that user using Envoy.

#### Field Populators
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

### Event Glossary
#### Background
Within the integration builder, you can granular notifications based on the event, and what user group triggered the event. You can set triggers on events within Envoy to post to your app. We have set up endpoints for the following common events.

#### Invitations
Endpoint: "https://www.mycustomapp.com/webhook-invite"

webhook for when a non-employee invitation is created
#### Sign-in (Non-Employee)
Endpoint: "https://www.mycustomapp.com/webhook-sign-in"
Triggers when an employee signs-in.
#### Sign-out (Non-Employee)
Endpoint: "https://www.mycustomapp.com/webhook-sign-out"
Triggers when a non-employee signs-out.
#### Sign-in (Employee)
Endpoint: "https://www.mycustomapp.com/webhook-employee-sign-in"
Triggers when an employee signs-in.
#### Sign-out (Employee)
Endpoint: "https://www.mycustomapp.com/webhook-employee-sign-out"
Triggers when an employee signs-out.

#### Full Event Glossary
If you would like set other event triggers within Envoy, you have the following at your disposal: 
<table>
  <thead>
    <tr>
      <th style="text-align: left;">Resource</th>
      <th style="text-align: left;">Topic</th>
      <th style="text-align: left;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align: left;">Entries</td>
      <td style="text-align: left;">visitors.entry.sign-in</td>
      <td style="text-align: left;">Triggers whenever a guest sign-in.</td>
    </tr>
    <tr>
      <td style="text-align: left;">Entries</td>
      <td style="text-align: left;">visitors.entry.sign-out</td>
      <td style="text-align: left;">Triggers whenever a guest signs out.</td>
    </tr>
    <tr>
      <td style="text-align: left;">Blocklist</td>
      <td style="text-align: left;">visitors.entry.block-list.review</td>
      <td style="text-align: left;">Triggers when a person has been screened by a blocklist rule.</td>
    </tr>
    <tr>
      <td style="text-align: left;">Blocklist</td>
      <td style="text-align: left;">visitors.entry.block-list.denied</td>
      <td style="text-align: left;">Triggers when a person has been denied entry by a blocklist rule</td>
    </tr>
    <tr>
      <td style="text-align: left;">Invites</td>
      <td style="text-align: left;">visitors.invite.created</td>
      <td style="text-align: left;">Triggers when an invite is created.</td>
    </tr>
    <tr>
      <td style="text-align: left;">Invites</td>
      <td style="text-align: left;">visitors.invite.updated</td>
      <td style="text-align: left;">Triggers when an invite is updated.</td>
    </tr>
    <tr>
      <td style="text-align: left;">Invites</td>
      <td style="text-align: left;">visitors.invite.removed</td>
      <td style="text-align: left;">Triggers when an invite is deleted.</td>
    </tr>
    <tr>
      <td style="text-align: left;">Invites</td>
      <td style="text-align: left;">visitors.upcoming.invited.visit</td>
      <td style="text-align: left;">upcoming_visit</td>
    </tr>
    <tr>
      <td style="text-align: left;">Invites</td>
      <td style="text-align: left;">visitors.invite.qr.code.sent</td>
      <td style="text-align: left;">qr_code_sent</td>
    </tr>
    <tr>
      <td style="text-align: left;">Entries</td>
      <td style="text-align: left;">protect.employee.check-in.created</td>
      <td style="text-align: left;">Triggers when an employee invite is created.</td>
    </tr>
    <tr>
      <td style="text-align: left;">Entries</td>
      <td style="text-align: left;">protect.upcoming.employee.on-site</td>
      <td style="text-align: left;">employee_upcoming_visit</td>
    </tr>
    <tr>
      <td style="text-align: left;">Entries</td>
      <td style="text-align: left;">protect.employee.entry.sign-in</td>
      <td style="text-align: left;">Triggers when an employee signs-in.</td>
    </tr>
    <tr>
      <td style="text-align: left;">Entries</td>
      <td style="text-align: left;">protect.employee.entry.sign-out</td>
      <td style="text-align: left;">Triggers when an employee signs-out</td>
    </tr>
    <tr>
      <td style="text-align: left;">(Beta) Tickets</td>
      <td style="text-align: left;">ticket_created</td>
      <td style="text-align: left;">Triggers when a workplace issue is created. _This feature is currently in beta and may not be available on your account._</td>
    </tr>
  </tbody>
</table>

### Support
If you have any questions regarding how to initiate these steps to build an app that fits your business needs, please don't hesitate to reach out to example@envoy.com.
