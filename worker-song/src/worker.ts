"use strict";

import "dotenv/config";
import { DynamoDB, SQS } from "aws-sdk";
import get, { AxiosRequestConfig } from "axios";
import { BatchWriteItemInput } from "aws-sdk/clients/dynamodb";
import { SQSEvent } from "aws-lambda";
import { Song, SongJob, SongResponse } from "./types";

const splitArray = require("split-array");

const DYNAMODB_MAX_ITEM_PER_QUERY = 25; // Should be <= 25 because of DynamoDB batch restriction. FYI - Genius API can support up to 50 items/call

export const workerSong = async (event: SQSEvent) => {
  console.log("Worker Songs");

  const job: SongJob = JSON.parse(event.Records[0].body);
  const promises = [];

  if (!job.artistId) {
    console.error("Error artistId undefined");
    return;
  }

  try {
    let page = 0;
    let next_page = null;

    do {
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${process.env.GENIUS_API_SECRET_TOKEN}`,
        },
      };
      const url = `https://api.genius.com/artists/${
        job.artistId
      }/songs?per_page=${DYNAMODB_MAX_ITEM_PER_QUERY}&page=${++page}`;
      const axiosResponse = await get(url, config);
      const res: SongResponse = axiosResponse.data;
      next_page = res.response.next_page;
      promises.push(insertToDdb(res.response.songs, job.artistId));
      promises.push(
        sendMessageToWorkerLyrics(res.response.songs, job.artistId)
      );
    } while (next_page && page < next_page);
  } catch (error) {
    console.error(error);
  }
  await Promise.all(promises);
};

const sendMessageToWorkerLyrics = (songs: Song, artistId: number) => {
  const sqs = new SQS({ apiVersion: "2012-11-05", region: "eu-west-3" });

  const splittedSong: Song[] = splitArray(songs, 10); // SQS sendMessageBatch can send up to 10 messages max
  // for (const songArr of splittedSong) {
  return splittedSong.map((songArr) => {
    const params: SQS.SendMessageBatchRequest = {
      Entries: [],
      QueueUrl: process.env.IS_OFFLINE
        ? "http://localhost:9324/000000000000/sqs-worker-lyrics"
        : "https://sqs.eu-west-3.amazonaws.com/440971873557/sqs-worker-lyrics", // TODO: to improve
    };
    songArr.forEach((song) => {
      params.Entries.push({
        Id: song.id.toString(),
        MessageBody: JSON.stringify({ artistId, songId: song.id }),
      });
    });
    return sqs.sendMessageBatch(params).promise();
  });
};

const insertToDdb = async (songs: Song, artistId: number) => {
  const options = process.env.IS_OFFLINE
    ? { endpoint: "http://localhost:8000" }
    : {};
  const ddb = new DynamoDB(options);
  const batchParams: BatchWriteItemInput = createBatchItem(songs, artistId);

  return ddb.batchWriteItem(batchParams).promise();
};

const createBatchItem = (
  songs: Song,
  artistId: number
): BatchWriteItemInput => {
  const batch = {
    RequestItems: {
      songs: [] as any,
    },
  };

  songs.forEach((song) => {
    batch.RequestItems.songs.push({
      PutRequest: {
        Item: {
          id: { N: song.id.toString() },
          title: { S: song.title },
          full_title: { S: song.full_title },
          primary_artist_id: { N: song.primary_artist.id.toString() },
          artist_id: { N: artistId.toString() },
          artist_names: { S: song.artist_names },
        },
      },
    });
  });

  return batch;
};
