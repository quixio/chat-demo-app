# Sentiment analysis

Real-time sentiment analysis pipeline. 

Sentiment analysis is performed on chat messages. The project includes a chat UI, where you can type chat messages. You can also connect to Twitch and perform sentiment analysis on large volumes of messages.

The completed application is illustrated in the following screenshot:

![Chat with sentiment analysis](./images/running-ui.png)

## Technologies used

Some of the technologies used by this template project are listed here.

**Infrastructure:** 

* [Quix](https://quix.io/)
* [Docker](https://www.docker.com/)
* [Kubernetes](https://kubernetes.io/)

**Backend:** 

* [Apache Kafka](https://kafka.apache.org/)
* [Quix Streams](https://github.com/quixio/quix-streams)
* [Flask](https://flask.palletsprojects.com/en/2.3.x/#)
* [pandas](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html)

**Sentiment analysis:**

* [Hugging Face](https://huggingface.co/)

**Frontend:**

* [Angular](https://angular.io/)
* [Typescript](https://www.typescriptlang.org/)
* [Microsoft SignalR](https://learn.microsoft.com/en-us/aspnet/signalr/)

**Data warehousing:**

* [BigQuery](https://cloud.google.com/bigquery/)

## Live demo

You can see the project running [live on Quix](https://sentimentdemoui-demo-chatappdemo-prod.deployments.quix.ai/chat).

## Getting help

If you need any assistance while following the tutorial, we're here to help in the [Quix forum](https://forum.quix.io/).

## Prerequisites

To get started make sure you have a [free Quix account](https://portal.platform.quix.ai/self-sign-up).

If you are new to Quix it is worth reviewing the [recent changes page](https://quix.io/docs/platform/changes.html), as that contains very useful information about the significant recent changes, and also has a number of useful videos you can watch to gain familiarity with Quix.

### Twitch API key

You'll also need an API key for the [Twitch](https://dev.twitch.tv/docs/api/) service (optional), if you want to try Twitch-related features.

### BigQuery credentials

If you want to use the Quix BigQuery service (optional), you'll need to provide your credentials for accessing [BigQuery](https://cloud.google.com/bigquery/).

### Git provider

You also need to have a Git account. This could be GitHub, Bitbucket, GitLab, or any other Git provider you are familar with, and that supports SSH keys. The simplest option is to create a free [GitHub account](https://github.com).

While this project uses an external Git account, Quix can also provide a Quix-hosted Git solution using Gitea for your own projects. You can watch a video on [how to create a project using Quix-hosted Git](https://www.loom.com/share/b4488be244834333aec56e1a35faf4db?sid=a9aa124a-a2b0-45f1-a756-11b4395d0efc).

## The pipeline

This is the message processing pipeline for this project:

![The pipeline](./images/pipeline-view.png)

The main services in the pipeline are:

1. *UI* - provides the chat UI, and shows the sentiment being applied to the chat messages.

2. *Sentiment analysis* - uses the [Hugging Face](https://huggingface.co/) model to perform sentiment analysis on the chat messages. There is also a *Drafts sentiment analysis* service for messages being typed, but not yet sent.

3. *Twitch data source* - An alternative to typing chat messages - you select a Twitch channel and then perform sentiment analysis on Twitch messages.

## Tutorial

Work through the [tutorial](https://quix.io/docs/platform/tutorials/sentiment-analysis/index.html).
