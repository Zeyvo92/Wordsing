"use strict";

import { DynamoDB } from "aws-sdk";
import { LambdaEvent } from "./types";

/*
 ** Get all lyrics from artistId
 ** Sort words
 */
export const wordsing = async (event: LambdaEvent) => {
  console.log("Wordsing 🎶");
  console.log(event);

  const allLyricsRes = await getAllLyricsByArtistId(event.artistId);
  if (allLyricsRes) {
    const sortedLyrics = sortLyrics(allLyricsRes);
  }
};
/*
 ** []
 */
const sortLyrics = (allLyricsRes: DynamoDB.ItemList) => {
  let occur: any = {};
  allLyricsRes.forEach((data) => {
    const lyrics = data.lyrics.S?.replace(/\n/g, " ")
      .replace(/,/g, "")
      .toLowerCase();
    if (!lyrics) return;
    // console.log(lyrics);
    const wordsArr = lyrics.split(" ");
    for (const word of wordsArr) {
      occur[word] = occur[word] ? occur[word] + 1 : 1;
    }
  });
  const ranked = [];
  for (var word in occur) {
    ranked.push([word, occur[word]]);
  }

  ranked.sort(function (a, b) {
    return b[1] - a[1];
  });
  // ranked.splice(20);
  console.log(ranked);
};

const getAllLyricsByArtistId = async (artistId: number) => {
  const options = process.env.IS_OFFLINE
    ? { endpoint: "http://localhost:8000" }
    : {};

  const params: DynamoDB.ScanInput = {
    FilterExpression: "artist_id = :artist_id",
    ProjectionExpression: "song_id, lyrics",
    ExpressionAttributeValues: {
      ":artist_id": { N: artistId.toString() },
    },
    TableName: "lyrics",
  };

  try {
    const ddb = new DynamoDB(options);
    const result = await ddb.scan(params).promise();
    // console.log(JSON.stringify(result));
    return result.Items;
  } catch (error) {
    console.error(error);
    return [];
  }
};
