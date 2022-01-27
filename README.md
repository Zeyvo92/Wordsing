# Wordsing

![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![Yarn](https://img.shields.io/badge/yarn-%232C8EBB.svg?style=for-the-badge&logo=yarn&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![AmazonDynamoDB](https://img.shields.io/badge/Amazon%20DynamoDB-4053D6?style=for-the-badge&logo=Amazon%20DynamoDB&logoColor=white)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

## About The Project

Wordsing is an app which shows you what are the most used words from your favourite artist.

## Architecture overview

Coming soon...

## Getting Started

Coming soon...

## Useful ressources

ElasticMQ UI: http://localhost:9325

Get queue URL: http://localhost:9324/?Action=ListQueues

Send job to worker-song (replace `artistId`):

```sh
curl --location --request POST 'http://localhost:9324/000000000000/sqs-worker-song' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'Action=SendMessage' \
--data-urlencode 'MessageBody={"artistId": 335710}'
```

Send a job to worker-lyrics (replace `songId` & `artistId`):

```sh
curl --location --request POST 'http://localhost:9324/000000000000/sqs-worker-lyrics' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'Action=SendMessage' \
--data-urlencode 'MessageBody={"songId": 4388058, "artistId": 335710}'
```
