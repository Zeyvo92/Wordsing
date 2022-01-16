"use strict";

import "dotenv/config";
import { DynamoDB } from "aws-sdk";
import get, { AxiosRequestConfig } from "axios";
import { BatchWriteItemInput } from "aws-sdk/clients/dynamodb";
import { SQSEvent } from "aws-lambda";
import { Song, SongJob, SongResponse } from "./types";

const DYNAMODB_MAX_ITEM_PER_QUERY = 25; // Should be <= 25 because of DynamoDB batch restriction. FYI - Genius API can support up to 50 items/call

export const workerSong = async (event: SQSEvent) => {
  console.log("Worker Songs");

  const job: SongJob = JSON.parse(event.Records[0].body);

  if (!job.artistId) {
    console.error("Error artistId undefined");
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
      insertToDdb(res.response.songs, job.artistId);
    } while (next_page && page < next_page);
  } catch (error) {
    console.error(error);
    return;
  }
};

const insertToDdb = (songs: Song, artistId: number) => {
  const ddb = new DynamoDB({
    endpoint: "http://localhost:8000",
    // ...rest of your configuration variables
  });

  const batchParams: BatchWriteItemInput = createBatchItem(songs, artistId);

  // Call DynamoDB to add the item to the table
  ddb.batchWriteItem(batchParams, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
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

  console.log(JSON.stringify(batch));
  return batch;
};
