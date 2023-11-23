# Sentiment demo UI

[This project](https://github.com/quixio/quix-samples/tree/main/nodejs/advanced/Sentiment-demo-ui) is an example of how to use Quix with Node.js.

 - It implements a system of chat rooms where people can communicate
 - QR codes are used to invite new participants into the chat room
 - Sentiment of the chat is analyzed in another service and displayed here

## How to run

Create a [Quix](https://portal.platform.quix.io/self-sign-up?xlink=github) account or log-in and visit the Samples to use this project.

Clicking `Deploy` on the Sample, deploys a pre-built container in Quix. Complete the environment variables to configure the container.

Clicking `Edit code` on the Sample, forks the project to your own Git repo so you can customize it before deploying.

NOTE! If running locally you should read the `Local` section below.

## Environment variables

This code sample uses the following environment variables:

- **messages**: This is the output topic for chat messages
- **sentiment**: This is the input topic for sentiment score from ML model. Use Hugging Face model sample to analyze messages sentiment.

## Connection
This app integrates with Quix via Quix WebSocket gateway. For more please refer to [Quix docs](https://documentation.platform.quix.io/apis/streaming-reader-api/intro.html).

## Debug In Quix

If you want to debug your javascript / typescript with the code deployed in the Quix serverless environment, please edit the docker file in the build folder.

The following line runs the build
`RUN npm run build -- --output-path=./dist/out --configuration production`

Remove ` --configuration production` to skip minification and other production ready steps.

The scripts will now be visible in your browsers debugger. The sources tab will now show `webpack://` files.

## Local

To run this project locally please update the `quix.service.ts` file with your:
 - Topics (messages and sentiment) - note that you need to get the Topic ID from the Topic page for this.

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.