"use strict";

import cheerio, { CheerioAPI } from "cheerio";
import { DynamoDB } from "aws-sdk";
import get from "axios";
import { SQSEvent } from "aws-lambda";
import { LyricsJob } from "./types";

const BASE_GENIUS_URL = "https://genius.com/songs";

export const workerLyrics = async (event: SQSEvent) => {
  console.log("Worker Lyrics");

  const job: LyricsJob = JSON.parse(event.Records[0].body);

  if (!job.songId) {
    console.error("Error songId undefined");
    return;
  }

  try {
    const { data } = await get(`${BASE_GENIUS_URL}/${job.songId}`);
    const $ = cheerio.load(data);
    const lyrics = extractLyrics($);
    await insertLyricsToDb(lyrics, job.songId);
  } catch (err) {
    console.error(err);
  }
  return;
};

const insertLyricsToDb = (lyrics: string, songId: number) => {
  if (!lyrics) {
    console.log("Lyrics empty for songId:", songId);
    return;
  }

  const options = process.env.IS_OFFLINE
    ? { endpoint: "http://localhost:8000" }
    : {};
  const ddb = new DynamoDB(options);

  const params = {
    TableName: "lyrics",
    Item: {
      id: {
        N: songId.toString(),
      },
      song_id: {
        N: songId.toString(),
      },
      lyrics: {
        S: lyrics,
      },
    },
  };

  return ddb.putItem(params).promise();
};

const extractLyrics = ($: CheerioAPI): string => {
  let lyrics = "";

  $('div[class|="Lyrics__Container"]').each((i, elem) => {
    $(elem).find("br").replaceWith("\n");
    lyrics += $(elem)
      .text()
      .replace(/ *\[[^\]]*]/g, ""); // remove tag between array like [Couplet 1]...[Refrain]...
  });

  return lyrics.replace(/^\s*$(?:\r\n?|\n)/gm, ""); // remove blank lines (to improve)
};
